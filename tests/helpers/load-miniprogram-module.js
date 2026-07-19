const fs = require("node:fs");
const vm = require("node:vm");

function loadDefinition(source, kind, options = {}) {
  let definition;
  const modules = options.modules || {};
  const globals = options.globals || {};
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    require(request) {
      if (Object.prototype.hasOwnProperty.call(modules, request)) {
        return modules[request];
      }
      throw new Error(`Unexpected require: ${request}`);
    },
    wx: options.wx || {},
    getApp: options.getApp || (() => ({ globalData: {} })),
    getCurrentPages: options.getCurrentPages || (() => [{}]),
    Page(value) {
      if (kind === "Page") definition = value;
    },
    Component(value) {
      if (kind === "Component") definition = value;
    },
    ...globals
  };

  vm.runInNewContext(source, sandbox);
  return definition;
}

function loadFile(filePath, kind, modules = {}, globals = {}) {
  const source = fs.readFileSync(filePath, "utf8");
  return loadDefinition(source, kind, { modules, globals });
}

function loadPage(filePath, moduleStubs = {}, globals = {}) {
  return loadFile(filePath, "Page", moduleStubs, globals);
}

function loadComponent(filePath, moduleStubs = {}, globals = {}) {
  return loadFile(filePath, "Component", moduleStubs, globals);
}

module.exports = {
  loadDefinition,
  loadPage,
  loadComponent
};
