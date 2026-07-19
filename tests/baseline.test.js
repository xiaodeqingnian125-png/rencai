const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDefinition } = require("./helpers/load-miniprogram-module");

test("loadDefinition captures a Page definition", () => {
  const definition = loadDefinition("Page({ data: { ok: true } })", "Page");

  assert.equal(definition.data.ok, true);
});
