const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const transpileCache = new Map();
const moduleCache = new Map();

const resolveLocalFile = (baseDir, request) => {
  const absoluteBase = path.resolve(baseDir, request);
  return [absoluteBase, `${absoluteBase}.ts`, `${absoluteBase}.js`, path.join(absoluteBase, 'index.ts')]
    .find((candidate) => fs.existsSync(candidate));
};

const loadTypeScriptModule = (filePath) => {
  const absolutePath = path.resolve(filePath);
  if (moduleCache.has(absolutePath)) {
    return moduleCache.get(absolutePath).exports;
  }

  const module = {exports: {}};
  moduleCache.set(absolutePath, module);
  const extension = path.extname(absolutePath);
  let code = fs.readFileSync(absolutePath, 'utf8');

  if (extension === '.ts' || extension === '.tsx') {
    if (!transpileCache.has(absolutePath)) {
      transpileCache.set(absolutePath, ts.transpileModule(code, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          esModuleInterop: true,
          jsx: ts.JsxEmit.ReactJSX,
          resolveJsonModule: true,
        },
        fileName: absolutePath,
      }).outputText);
    }
    code = transpileCache.get(absolutePath);
  }

  const dirname = path.dirname(absolutePath);
  const fn = new vm.Script(`(function (exports, require, module, __filename, __dirname) {${code}\n})`, {
    filename: absolutePath,
  }).runInThisContext();

  const localRequire = (request) => {
    if (request.startsWith('.') || request.startsWith('/')) {
      const target = resolveLocalFile(dirname, request);
      if (!target) {
        throw new Error(`No se pudo resolver ${request} desde ${absolutePath}`);
      }
      if (path.extname(target) === '.json') {
        return JSON.parse(fs.readFileSync(target, 'utf8'));
      }
      return loadTypeScriptModule(target);
    }
    return require(request);
  };

  fn(module.exports, localRequire, module, absolutePath, dirname);
  return module.exports;
};

module.exports = {loadTypeScriptModule};
