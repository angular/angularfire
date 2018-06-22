# Installing Angular CLI on Windows 10

> There had been installation issues of `@angular/cli` on Windows 10 system. Most of the time these errors are related to Python dependecies and node-gyp.

Something as below :

```bash
execSync@1.0.2 install C:\Users\User\AppData\Roaming\npm\node_modules\angu
lar-cli\node_modules\angular2-template-loader\node_modules\codecov\node_modules\
execSync
 node install.js

[execsync v1.0.2] Attempting to compile native extensions.
{ [Error: spawn node-gyp ENOENT]
  code: 'ENOENT',
  errno: 'ENOENT',
  syscall: 'spawn node-gyp',
  path: 'node-gyp',
  spawnargs: [ 'rebuild' ] }
[execSync v1.0.2]
    Native code compile failed!!
    Will try to use win32 extension.
npm WARN deprecated tough-cookie@2.2.2: ReDoS vulnerability parsing Set-Cookie h
ttps://nodesecurity.io/advisories/130
npm WARN deprecated minimatch@0.3.0: Please update to minimatch 3.0.2 or higher
to avoid a RegExp DoS issue
npm WARN deprecated minimatch@2.0.10: Please update to minimatch 3.0.2 or higher
 to avoid a RegExp DoS issue

 node-zopfli@2.0.1 install C:\Users\User\AppData\Roaming\npm\node_modules\a
ngular-cli\node_modules\compression-webpack-plugin\node_modules\node-zopfli
 node-pre-gyp install --fallback-to-build
.......................
```

To resolve this issue, make sure you've upgraded to the latest version of **NPM** and try installing `@angular/cli` again. This seems to have worked on certain scenarios.

If the above doesn't work then the below steps should help. Please ensure all the commands are executed as an **Administrator**.

## Steps:

### 1) Install `node-gyp` from [here](https://github.com/nodejs/node-gyp) using NPM

```bash
npm install -g node-gyp
```

### 2) Install Windows build tools from [here](https://github.com/felixrieseberg/windows-build-tools) using NPM

```bash
npm install --global windows-build-tools
```

*This will also install Python

### 3) Install Angular CLI

```bash
npm install -g @angular/cli
```

This should install `@angular/cli` without errors.

#### Post this installation, follow the installation [guide](https://github.com/angular/angularfire2/blob/master/docs/install-and-setup.md) to install AngularFire and everything should work as expected.


### Note:

When you start your app using `ng serve` in the console, you might still see the below errors. Despite these errors, the application should work as expected and should be able to talk to Firebase.

```bash
ERROR in [default] C:\angularFire2Test\node_modules\angularfire2\interfaces.d.ts:12:34
Cannot find namespace 'firebase'.

ERROR in [default] C:\angularFire2Test\src\typings.d.ts:6:12
Subsequent variable declarations must have the same type.  Variable 'require' must be of type 'NodeRequire',
but here has type 'any'.

ERROR in [default] C:\angularFire2Test\src\typings.d.ts:7:12
Subsequent variable declarations must have the same type.  Variable 'module' must be of type 'NodeModule',
but here has type 'any'.
```
