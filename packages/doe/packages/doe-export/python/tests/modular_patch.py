"""Keep old test injection semantics while targeting each new module that imports a binding."""
from contextlib import ExitStack
import importlib
import functools
import json
from pathlib import Path
from types import ModuleType
from unittest import mock as original_mock
from unittest.mock import patch as original_patch

_root = Path(__file__).resolve().parents[4]
_manifest = json.loads((_root / "architecture/export-manifest.json").read_text(encoding="utf-8"))
_owners = {}
for unit in _manifest["pythonModules"]:
    owner = unit["origin"].split("app/pptx_html_runtime/", 1)[1][:-3].replace("/", ".")
    relative = unit["path"].split("/python/", 1)[1]
    modules = _owners.setdefault(owner, set())
    modules.add(relative[:-3].replace("/", "."))
    directory = Path(relative).parent
    while directory != Path("."):
        if (_root / "packages/doe-export/python" / directory / "shared.py").exists():
            modules.add(str(directory / "shared").replace("\\", ".").replace("/", "."))
        if (_root / "packages/doe-export/python" / directory / "state.py").exists():
            modules.add(str(directory / "state").replace("\\", ".").replace("/", "."))
        directory = directory.parent


class BindingPatch:
    def __init__(self, target, args, kwargs):
        self.target, self.args, self.kwargs = target, args, kwargs

    def __enter__(self):
        self.stack = ExitStack()
        try:
            mock = self.stack.enter_context(original_patch(self.target, *self.args, **self.kwargs))
            owner, name = self.target.rsplit(".", 1)
            for module_name in sorted(_owners[owner]):
                module = importlib.import_module(module_name)
                if name in vars(module):
                    self.stack.enter_context(original_patch.object(module, name, mock))
            return mock
        except BaseException:
            self.stack.close()
            raise

    def __exit__(self, *args):
        return self.stack.__exit__(*args)

    def __call__(self, function):
        @functools.wraps(function)
        def wrapped(*args, **kwargs):
            with BindingPatch(self.target, self.args, self.kwargs) as value:
                new = self.kwargs.get("new", self.args[0] if self.args else original_mock.DEFAULT)
                return function(*args, *([value] if new is original_mock.DEFAULT else []), **kwargs)
        return wrapped

    def start(self):
        return self.__enter__()

    def stop(self):
        return self.__exit__(None, None, None)


def patch(target, *args, **kwargs):
    if target.rsplit(".", 1)[0] in _owners:
        return BindingPatch(target, args, kwargs)
    return original_patch(target, *args, **kwargs)


def patch_object(target, attribute, *args, **kwargs):
    if isinstance(target, ModuleType) and target.__name__ in _owners:
        return BindingPatch(target.__name__ + "." + attribute, args, kwargs)
    return original_patch.object(target, attribute, *args, **kwargs)


patch.object = patch_object
patch.dict = original_patch.dict


def __getattr__(name):
    return getattr(original_mock, name)
