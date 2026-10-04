// node test/note.test.mjs — the free-text note reader
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { parseNote } = require("../src/note.js");
const G = require("../data/us-2026-11/geo.js"), R = require("../data/ca-2026-11/rules.js"), { ballot } = require("../src/engine.js");
const keys = t => parseNote(t).facts.map(f => f.key).sort();

assert.deepEqual(keys("I'm a retired teacher and a veteran. We rent, I take the bus to work, and our son has an IEP."),
  ["disab", "renter", "senior", "teacher", "transit", "veteran"]);
assert.deepEqual(keys("I'm not a veteran and we don't have kids"), [], "negation");
assert.deepEqual(keys("We don't own a car"), ["transit"], "car-free reads as transit");
assert.deepEqual(keys("homeowner; I also rent out a condo"), ["landlord", "owner"], "owner beats renter, landlord detected");
assert.deepEqual(keys("Our daughter is in 3rd grade at public school and is on Medi-Cal"), ["medical", "school"]);
assert.deepEqual(keys("Taxes are too high and I care about schools"), ["w-budget", "w-services"]);
assert.deepEqual(keys("I own a small business with 6 employees"), ["employer"]);
assert.deepEqual(parseNote("I'm a veteran", new Set(["veteran"])).facts, [], "dismissed chips stay removed");

// end to end: a note can move a recommendation (Louisiana's veteran-spouse exemption)
const US = { MEASURES: ["LA"].flatMap(st => JSON.parse(fs.readFileSync(new URL(`../data/us-2026-11/states/${st}.json`, import.meta.url))).map(m => ({ ...m, state: st }))), OFFICES: {}, G };
const base = { zip: "70112", filing: "mfj", income: 80000, spend: 30000, home: "own", homeValue: 250000, rentals: 0, rentalsValue: 0, wage: 0,
  employer: false, school: false, disab: false, medical: false, senior: false, transit: 0, w: { budget: 2, services: 2, transit: 2, housing: 2, fiscal: 2 } };
const rec = h => ballot(h, US, { MEASURES: [], OFFICES: [], R }).results.find(x => x.m.id === "LA-1").rec;
const vet = { ...base }; parseNote("I'm a disabled veteran").facts.forEach(f => f.apply(vet));
assert.notEqual(rec(base), rec(vet), "being a veteran changes LA-1");
console.log("note tests passed:", rec(base), "->", rec(vet));

// smart read: results map onto the same chips, with evidence; unknown keys are ignored
{
  const { smartToFacts, SMART_SCHEMA } = require("../src/note.js");
  const S = smartToFacts({ facts: [{ key: "owner", evidence: "we own the house" }, { key: "bogus", evidence: "x" }], priorities: [{ key: "fiscal", evidence: "stop wasting money" }] });
  assert.deepEqual(S.facts.map(f => f.key), ["owner", "w-fiscal"]);
  assert.equal(S.facts[0].evidence, "we own the house"); assert.equal(S.weights.fiscal, 1);
  assert.ok(SMART_SCHEMA.properties.facts.items.properties.key.enum.includes("veteran"));
  console.log("smart-read mapping tests passed");
}
