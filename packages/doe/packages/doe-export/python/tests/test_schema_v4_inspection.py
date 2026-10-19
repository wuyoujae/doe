from __future__ import annotations
import base64
import importlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch
from PIL import Image

import test_htmlir_server_security as security
from doe_export.pptx.schema.inspect_schema_v4_slide import inspect_schema_v4_slide, SlideInspectionError, _validate_result
from doe_export.pptx.schema.shared import RENDERER_CONTRACT

module = importlib.import_module('doe_export.pptx.schema.inspect_schema_v4_slide')
handler = importlib.import_module('doe_export.service.http.handler.schema_v4._handle_schema_v4_inspect_slide')
DECK={"version":4,"deck":{"theme":"yrkie-theme","slides":[{"id":"one","blocks":[]}]}}

def result():
    png=io.BytesIO()
    Image.new('RGB',(1280,720),'white').save(png,format='PNG')
    return {"success":True,"renderer_contract":RENDERER_CONTRACT,"page_number":7,
            "report":{"fits":False,"overflowY":84},"png_base64":base64.b64encode(png.getvalue()).decode()}

class InspectionValidationTests(unittest.TestCase):
    def test_failing_layout_is_valid_image_evidence(self):
        self.assertFalse(_validate_result(result(),7)['report']['fits'])

    def test_bad_png_contract_page_report_and_untrusted_sizes_rejected(self):
        variants=[{**result(),"png_base64":"bad"},{**result(),"renderer_contract":"old"},
                  {**result(),"page_number":1},{**result(),"report":{"fits":"true"}}]
        for value in variants:
            with self.subTest(value=list(value)),self.assertRaises(SlideInspectionError):_validate_result(value,7)

    def test_cancelled_request_never_launches_browser(self):
        with patch.object(module.subprocess,'Popen') as spawn,self.assertRaises(SlideInspectionError) as caught:
            inspect_schema_v4_slide(DECK,page_number=7,total_slides=8,cancelled=lambda:True)
        self.assertEqual(caught.exception.code,'doe_preview_cancelled')
        spawn.assert_not_called()

    def test_invalid_identity_or_placeholder_never_launches_browser(self):
        for options,code in [({'page_number':True,'total_slides':8},'doe_preview_invalid_request'),
                             ({'assets':{'x':{'is_fallback':True}}},'doe_preview_assets_unavailable')]:
            with patch.object(module.subprocess,'Popen') as spawn,self.assertRaises(SlideInspectionError) as caught:
                inspect_schema_v4_slide(DECK,**options)
            self.assertEqual(caught.exception.code,code)
            spawn.assert_not_called()

    def test_invalid_deck_type_is_a_safe_request_error(self):
        for deck in [None, [], "private input"]:
            with self.assertRaises(SlideInspectionError) as caught:
                inspect_schema_v4_slide(deck)
            self.assertEqual(caught.exception.code, 'doe_preview_invalid_request')

    def test_running_cancellation_and_timeout_reap_the_owned_process(self):
        original_spawn = subprocess.Popen
        processes = []
        def spawn(*args, **kwargs):
            process = original_spawn(*args, **kwargs)
            processes.append(process)
            return process
        with tempfile.TemporaryDirectory(prefix='inspection-child-test-') as directory:
            root = Path(directory)
            # A real cooperative child exercises cancellation without launching a UI.
            (root/'schema_v4_renderer.js').write_text('import json,sys,time,pathlib\nr=json.load(sys.stdin)\nwhile not pathlib.Path(r["cancellation_file"]).exists(): time.sleep(.02)\n')
            for cancel, expected in [(True,'doe_preview_cancelled'), (False,'doe_preview_timeout')]:
                started = time.monotonic()
                with patch.object(module,'RUNTIME_ROOT',root), patch.object(module,'_node_executable',return_value=sys.executable), \
                     patch.object(module.subprocess,'Popen',side_effect=spawn), self.assertRaises(SlideInspectionError) as caught:
                    inspect_schema_v4_slide(DECK, timeout_seconds=.2 if not cancel else 5,
                        cancelled=lambda: cancel and time.monotonic()-started>.2)
                self.assertEqual(caught.exception.code, expected)
                self.assertIsNotNone(processes[-1].poll())
                self.assertLess(time.monotonic()-started, 4)

    @unittest.skipUnless(os.environ.get('YRKIE_DOE_INSPECTION_BROWSER_TEST')=='1','Requires matching candidate public')
    def test_real_normal_and_overflow_keep_original_input_and_export_stays_strict(self):
        fixture=Path(__file__).with_name('capacity_fixture.mjs')
        decks=json.loads(subprocess.check_output(['node',str(fixture)],encoding='utf8'))
        before=json.dumps(decks,sort_keys=True)
        for name in ['fitting','overflow']:
            value=inspect_schema_v4_slide(decks[name],page_number=7,total_slides=8)
            self.assertEqual(value['report']['fits'],name=='fitting')
            self.assertEqual(value['page_number'],7)
        self.assertEqual(before,json.dumps(decks,sort_keys=True))
        decks['fitting']['pageNumber']={'enabled':True,'format':'fraction'}
        # Node verifies the real footer is 7/8, not the one-page clone's 1/1.
        numbered=inspect_schema_v4_slide(decks['fitting'],page_number=7,total_slides=8)
        self.assertEqual(numbered['page_number'],7)
        broken=json.loads(json.dumps(decks['fitting']))
        broken['deck']['slides'][0]['blocks'].append({'id':'bad-image','type':'media',
            'props':{'src':'data:image/png;base64,aW52YWxpZA==','alt':'Corrupt fixture'}})
        with self.assertRaises(SlideInspectionError) as caught:
            inspect_schema_v4_slide(broken,page_number=7,total_slides=8)
        self.assertEqual(caught.exception.code,'doe_preview_assets_unavailable')
        background=json.loads(json.dumps(decks['fitting']))
        background['deck']['slides'][0]['background']={'src':'data:image/png;base64,aW52YWxpZA==','enabled':True}
        with self.assertRaises(SlideInspectionError) as caught:
            inspect_schema_v4_slide(background,page_number=7,total_slides=8)
        self.assertEqual(caught.exception.code,'doe_preview_assets_unavailable')
        from schema_v4_export import export_schema_v4_deck_to_pptx
        from doe_export.pipeline.pdf.export_schema_v4_deck_to_pdf import export_schema_v4_deck_to_pdf
        from doe_export.pptx.schema.layout_error import SchemaLayoutOverflowError
        for export in [export_schema_v4_deck_to_pptx,export_schema_v4_deck_to_pdf]:
            with self.assertRaises(SchemaLayoutOverflowError):export(decks['overflow'],timeout_seconds=90)

class InspectionHttpTests(unittest.TestCase):
    TOKEN = security.HtmlIrServerSecurityTests.TOKEN
    setUp = security.HtmlIrServerSecurityTests.setUp
    tearDown = security.HtmlIrServerSecurityTests.tearDown
    request = security.HtmlIrServerSecurityTests.request

    def test_disconnected_request_cancels_render_work(self):
        import http.client
        entered, stopped = threading.Event(), threading.Event()
        def render(*args, cancelled, **kwargs):
            entered.set()
            deadline=time.monotonic()+3
            while time.monotonic()<deadline:
                if cancelled():
                    stopped.set()
                    raise SlideInspectionError('doe_preview_cancelled')
                time.sleep(.01)
            self.fail('Disconnected client did not cancel its renderer')
        with patch.object(handler,'inspect_schema_v4_slide',side_effect=render):
            connection=http.client.HTTPConnection('127.0.0.1',self.port,timeout=2)
            connection.request('POST','/api/schema-v4/inspect-slide',body=b'{"deck":{}}',
                headers={'Content-Type':'application/json','Authorization':'Bearer '+self.TOKEN})
            self.assertTrue(entered.wait(1))
            connection.close()
            self.assertTrue(stopped.wait(2))
    def test_inspection_route_requires_internal_auth_and_rejects_browser_origin(self):
        for token,headers,expected in [(None,{},401),(self.TOKEN,{'Origin':'https://untrusted.example'},403)]:
            status,_,_=self.request('POST','/api/schema-v4/inspect-slide',token=token,
                headers={'Content-Type':'application/json',**headers},body=b'{}')
            self.assertEqual(status,expected)

    def test_inspection_returns_not_fit_without_using_export_gate(self):
        with patch.object(handler,'inspect_schema_v4_slide',return_value=result()) as inspect:
            status,_,data=self.request('POST','/api/schema-v4/inspect-slide',headers={'Content-Type':'application/json'},
                body=json.dumps({'deck':DECK,'page_number':7,'total_slides':8}).encode())
        self.assertEqual(status,200)
        self.assertFalse(json.loads(data)['report']['fits'])
        self.assertEqual(inspect.call_args.kwargs['page_number'],7)

    def test_failure_is_safe_code_only_and_unknown_fields_rejected(self):
        with patch.object(handler,'inspect_schema_v4_slide',side_effect=SlideInspectionError('doe_preview_timeout')):
            status,_,data=self.request('POST','/api/schema-v4/inspect-slide',headers={'Content-Type':'application/json'},body=b'{"deck":{}}')
        self.assertEqual(status,400)
        self.assertEqual(json.loads(data),{'success':False,'code':'doe_preview_timeout'})
        with patch.object(handler,'inspect_schema_v4_slide') as inspect:
            status,_,_=self.request('POST','/api/schema-v4/inspect-slide',headers={'Content-Type':'application/json'},
                body=b'{"deck":{},"cancellation_file":"C:/private"}')
            self.assertEqual(status,400)
            inspect.assert_not_called()
