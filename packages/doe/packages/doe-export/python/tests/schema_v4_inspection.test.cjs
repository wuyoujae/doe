const { test } = require('node:test');
const assert = require('node:assert/strict');
const { inspectionReport, validateInspection } = require('../schema_v4_inspection');

test('inspection keeps genuine failing geometry and only bounded diagnostic fields', () => {
  const report = inspectionReport({ fits: false, overflowY: 91, minimumFontPx: 14,
    error: 'private stack', html: '<secret>', externalPressure: [{ id: 'chart', overflowY: 91, src: 'https://private/' }],
    fontPressure: Array.from({length:90}, () => ({ id: 'x', actualPt: 10, minimumPt: 12.5 })) },
    [{ code:'overflow-y', level:'error', message:'private' }, { code:'https://private',level:'error' }]);
  assert.equal(report.fits, false);
  assert.equal(report.overflowY,91);
  assert.equal(report.fontPressure.length,80);
  assert.equal(report.fontPressureOmitted,10);
  assert.deepEqual(report.externalPressure,[{ id:'chart',overflowY:91 }]);
  assert.deepEqual(report.diagnostics,[{ code:'overflow-y',level:'error' }]);
  assert.doesNotMatch(JSON.stringify(report),/private|secret/);
  assert.throws(() => inspectionReport({}));
});

test('single page inspections retain original page identity and reject invalid totals', () => {
  const deck={deck:{slides:[{id:'slide-7'}]}};
  assert.doesNotThrow(() => validateInspection(deck,7,8));
  for (const [page,total] of [[0,8],[9,8],[1,301],[true,8],[1,1.5]]) assert.throws(() => validateInspection(deck,page,total));
  assert.throws(() => validateInspection({deck:{slides:[{},{}]}},1,2));
});

test('a fitting page exposes shortened projections without copying its text or raw plan', () => {
  const key = index => JSON.stringify(['pyramid', ['items', index, 'text']]);
  const plan = { truncate: { [key(0)]: 1, [key(1)]: 0, private: 'secret' },
    textRatio: { [key(0)]: 0.677418, [key(2)]: 0.9, [key(3)]: 1,
      '["bad",["https://private"]]': .6, [key(4)]: NaN } };
  const report = inspectionReport({ fits: true, compressionPlan: plan });
  assert.equal(report.fits, true);
  assert.equal(report.textMayBeTruncated, true);
  assert.deepEqual(report.textProjection, [
    { id:'pyramid',path:'items.0.text',truncate:true,textRatio:0.677418 },
    { id:'pyramid',path:'items.2.text',textRatio:0.9 }]);
  assert.deepEqual(report.diagnostics, [
    {code:'text-projection-truncated',level:'warning'}, {code:'text-projection-reduced',level:'info'}]);
  assert.doesNotMatch(JSON.stringify(report), /private|secret|compressionPlan/);
  const many = inspectionReport({fits:true,compressionPlan:{truncate:Object.fromEntries(Array.from({length:90},(_,i)=>[key(i),1]))}});
  assert.equal(many.textProjection.length,80);
  assert.equal(many.textProjectionOmitted,10);
  assert.equal(many.textMayBeTruncated,true);
  const clean = inspectionReport({fits:true,compressionPlan:{textRatio:{[key(0)]:.8}}});
  assert.equal(clean.textMayBeTruncated,false);
  assert.deepEqual(inspectionReport({fits:true}).textProjection,[]);
});
