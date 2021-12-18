# monkey-dont

A monkey-patch to prevent monkey-patching.

This is a first try, largely un-tested, and probably buggy. Use at your own risk.

It works by rewriting Node's internal `_load` method to modify modules' exports in one of three ways:

1. `clone` - Causes `require` to return a deep copy of `module.exports`.
2. `freeze` - Causes `require` to recursively apply `Object.freeze` on `module.exports` before returning it.
3. `uncache` - Causes `require` to  delete the module from `require.cache` and re-load it the module's main `.js` file.

To deep-clone every module:
```js
require('monkey-dont').monkey('clone');
```

To deep-freeze every module:
```js
require('monkey-dont').monkey('freeze');
```

To un-cache every module, except built-ins, which can't be un-cached:
```js
require('monkey-dont').monkey('uncache');
```

To uncache all modules by default but freeze the built-ins:
```js
require('monkey-dont').monkey({
  all: 'uncache',
  builtin: 'freeze',
});
```

To clone `fs` and `path`, freeze the remaining built-ins, and un-cache the remaining non-built-ins:
```js
require('monkey-dont').monkey({
  all: 'uncache',
  builtin: 'freeze',
  byname: {
    'fs': 'clone',
    'path': 'clone',
  },
});
```

To do all the above, except freeze the module `foo` instead of uncaching it:
```js
require('monkey-dont').monkey({
  all: 'uncache',
  builtin: 'freeze',
  byname: {
    'fs': 'clone',
    'path': 'clone',
    'foo': 'freeze',
  },
});
```

To make the patch removable, keep the `monkey-dont` export instead of immediately calling `monkey` on it. Then call its `unmonkey` method to remove the patch.

(**Note:** This can't retroactively undo any cloning, freezing, and uncaching already done; it just returns `require` to its normal behavior. Future `require`s will return un-cloned, cached originals, but already-frozen modules will remain frozen on future `require`s.)
```js
const md = require('monkey-dont');
md.monkey({
  // ...snip...
});
// ...snip...
md.unmonkey();
```
