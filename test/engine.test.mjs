// node test/engine.test.mjs — sanity checks on the engine, CA 2026 rules and generic cost models.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const R = require("../data/ca-2026-11/rules.js"), G = require("../data/us-2026-11/geo.js");
const { ballot, costOf } = require("../src/engine.js");
const caM = JSON.parse(fs.readFileSync(new URL("../data/ca-2026-11/measures.json", import.meta.url)));
const CA = { MEASURES: caM, OFFICES: [], R };
const fake = [
  { id: "ZZ-1", state: "OH", label: "Issue 1", t: "Flat income tax cut", values: false,
    cost: { model: "income_tax_flat", rate_change: -0.005, exempt_below: { mfj: 0, single: 0 }, start: 2027 },
    effects: { services: -1, fiscal: -1 }, reasons: { services: "Less money for schools", fiscal: "Cuts revenue" } },
  { id: "ZZ-2", state: "OH", label: "Issue 2", t: "Abolish property tax", cost: { model: "property_tax_pct", pct_change: -1, homestead_only: true },
    effects: { services: -2.5, fiscal: -2.5 }, reasons: { services: "Local services lose funding", fiscal: "Removes $X" }, boost: { school: { services: -1 } } },
  { id: "ZZ-3", state: "OH", label: "Issue 3", t: "Minimum wage $15", cost: { model: "min_wage", new_rate: 15, by_year: 2028 }, effects: {}, reasons: {} },
  { id: "ZZ-4", state: "OH", label: "Issue 4", t: "Abortion rights", values: true, cost: null, effects: {}, reasons: {} },
];
const US = { MEASURES: fake, OFFICES: { OH: [{ short: "GOV", office: "Governor", cands: [] }] }, G };
const base = { filing: "mfj", stocks: false, home: "rent", sqft: "s", rentals: 0, rentalsValue: 0, homeValue: 0, rentctl: false, senior: false,
  school: false, disab: false, medical: false, clinic: false, transit: 1, westside: false, wage: 0, employer: false,
  w: { budget: 2, services: 2, transit: 2, housing: 2, fiscal: 2 } };
const pick = (b, id) => b.results.find(x => x.m.id === id)?.rec;

// ZIP -> state routing
assert.equal(ballot({ ...base, zip: "123" }, US, CA), null);
assert.equal(ballot({ ...base, zip: "90012", income: 80000, spend: 30000 }, US, CA).results.length, 14, "LA: CA statewide only");
assert.equal(ballot({ ...base, zip: "94612", income: 80000, spend: 30000 }, US, CA).results.length, 15, "Oakland: + RTM");
assert.equal(ballot({ ...base, zip: "94110", income: 80000, spend: 30000 }, US, CA).results.length, 25, "SF: all 25");
const oh = ballot({ ...base, zip: "43215", income: 100000, spend: 40000 }, US, CA);
assert.equal(oh.state, "OH"); assert.equal(oh.results.length, 4); assert.equal(oh.offices.length, 1);
assert.equal(ballot({ ...base, zip: "10001", income: 1, spend: 1 }, US, CA).results.length, 0, "state with no measures");

// CA Prop 3 math still right
const hi = ballot({ ...base, zip: "94132", income: 1500000, spend: 120000 }, US, CA);
assert.ok(Math.abs(hi.c.p3 - 14705) < 5);

// Generic cost models
assert.equal(costOf(fake[0], { ...base, state: "OH", income: 100000 }, G).amount, -500, "flat tax cut");
assert.ok(Math.abs(costOf(fake[1], { ...base, state: "OH", home: "own", homeValue: 300000 }, G).amount + 300000 * G.PROP_TAX_RATE.OH) < 1, "property tax abolished");
assert.equal(costOf(fake[2], { ...base, state: "OH", wage: 12 }, G).amount, -3 * 2080, "min wage raise");
// Values measures never scored
assert.equal(pick(oh, "ZZ-4"), "Your call");
// A homeowner who weights budget gains leans Yes on abolishing property tax; a services-first family leans No
const owner = ballot({ ...base, zip: "43215", income: 100000, spend: 40000, home: "own", homeValue: 400000, w: { budget: 3, services: 0, transit: 0, housing: 0, fiscal: 0 } }, US, CA);
assert.match(pick(owner, "ZZ-2"), /Yes/);
const fam = ballot({ ...base, zip: "43215", income: 100000, spend: 40000, home: "own", homeValue: 400000, school: true, disab: true, w: { budget: 1, services: 3, transit: 0, housing: 0, fiscal: 2 } }, US, CA);
assert.match(pick(fam, "ZZ-2"), /No/);
// Hourly worker below the new minimum leans Yes; employer gets a cost reason
const worker = ballot({ ...base, zip: "43215", income: 30000, spend: 20000, wage: 12 }, US, CA);
assert.match(pick(worker, "ZZ-3"), /Yes/);
const boss = ballot({ ...base, zip: "43215", income: 200000, spend: 40000, employer: true }, US, CA);
assert.ok(boss.results.find(x => x.m.id === "ZZ-3").why.some(w => /business/.test(w[2])));
console.log("all engine tests passed");
