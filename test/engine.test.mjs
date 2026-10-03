// node test/engine.test.mjs — sanity checks on the 2026 rules + engine.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const R = require("../data/ca-2026-11/rules.js"), { ballot } = require("../src/engine.js");
const M = JSON.parse(fs.readFileSync(new URL("../data/ca-2026-11/measures.json", import.meta.url)));
const base = { filing: "mfj", stocks: false, home: "rent", sqft: "s", rentals: 0, rentctl: false, senior: false, school: false,
  disab: false, medical: false, clinic: false, transit: 1, westside: false, w: { budget: 2, services: 2, transit: 2, housing: 2, fiscal: 2 } };
const pick = (b, id) => b.results.find(x => x.m.id === id)?.rec;

// 1. ZIP coverage
assert.equal(ballot({ ...base, zip: "123" }, M, R), null, "invalid ZIP returns null");
assert.equal(ballot({ ...base, zip: "90012", income: 80000, spend: 30000 }, M, R).results.length, 14, "LA sees statewide only");
assert.equal(ballot({ ...base, zip: "94612", income: 80000, spend: 30000 }, M, R).results.length, 15, "Oakland adds RTM");
assert.equal(ballot({ ...base, zip: "94110", income: 80000, spend: 30000 }, M, R).results.length, 25, "SF sees all 25");

// 2. Prop 3 bracket math (married, $1.5M taxable): ~ $14.7K
const hi = ballot({ ...base, zip: "94132", income: 1500000, spend: 120000 }, M, R);
assert.ok(Math.abs(hi.c.p3 - 14705) < 5, `Prop 3 cost ${hi.c.p3}`);
assert.equal(ballot({ ...base, zip: "94132", income: 200000, spend: 0 }, M, R).c.p3, 0, "no Prop 3 cost below brackets");

// 3. Values measures are always "Your call"
for (const id of ["4", "5", "39"]) assert.equal(pick(hi, id), "Your call");

// 4. A disability family that relies on services and transit leans toward service funding
const fam = ballot({ ...base, zip: "94132", income: 1500000, spend: 120000, home: "own", sqft: "m", rentals: 1, disab: true, medical: true,
  stocks: true, westside: true, w: { budget: 2, services: 3, transit: 2, housing: 1, fiscal: 2 } }, M, R);
assert.match(pick(fam, "2"), /Yes/); assert.match(pick(fam, "H"), /Yes/); assert.match(pick(fam, "41"), /No/); assert.match(pick(fam, "44"), /No/);

// 5. Budget-first owner with no service needs leans against new taxes on themselves
const thrift = ballot({ ...base, zip: "94132", income: 1500000, spend: 200000, home: "own", rentals: 3,
  w: { budget: 3, services: 0, transit: 0, housing: 0, fiscal: 3 } }, M, R);
assert.match(pick(thrift, "3"), /No/); assert.match(pick(thrift, "RTM"), /No/);

console.log("all engine tests passed");
