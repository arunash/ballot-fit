// node test/validate-data.mjs — checks every data/us-2026-11/states file against SCHEMA.md
import fs from "node:fs";
const dir = "data/us-2026-11/states", MODELS = new Set(["income_tax_brackets","income_tax_flat","property_tax_rate","property_tax_pct","homestead_exemption","sales_tax","flat_fee","min_wage"]);
const KEYS = new Set(["budget","services","transit","housing","fiscal"]), FLAGS = new Set(["disab","medicaid","school","owner","renter","hourly","employer","senior","transit_user"]);
let errors = 0, warns = 0, n = 0; const ids = new Set();
const err = (f, id, msg) => { errors++; console.log(`ERROR ${f} ${id}: ${msg}`); };
const warn = (f, id, msg) => { warns++; console.log(`warn  ${f} ${id}: ${msg}`); };
for (const f of fs.readdirSync(dir).sort()) {
  const data = JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8")); const st = f.slice(0, 2);
  if (!Array.isArray(data)) { err(f, "-", "not an array"); continue; }
  if (f.endsWith(".offices.json")) { for (const o of data) if (!o.office || !Array.isArray(o.cands)) err(f, o.short, "bad office"); continue; }
  for (const m of data) {
    n++;
    for (const k of ["id","label","t","what","y","n","fiscal"]) if (!m[k]) err(f, m.id, `missing ${k}`);
    if (!String(m.id).startsWith(st + "-")) err(f, m.id, "id must start with state");
    if (ids.has(m.id)) err(f, m.id, "duplicate id"); ids.add(m.id);
    if (!m.source) warn(f, m.id, "no source URL");
    else if (!/^https?:\/\//i.test(m.source)) err(f, m.id, "source must be an http(s) URL");
    for (const [k, v] of Object.entries(m)) if (typeof v === "string" && /<\s*script|javascript:|on\w+\s*=/i.test(v)) err(f, m.id, `suspicious markup in ${k}`);
    if (m.values) continue;
    if (m.cost && !MODELS.has(m.cost.model)) err(f, m.id, `unknown cost model ${m.cost.model}`);
    for (const [k, v] of Object.entries(m.effects || {})) {
      if (!KEYS.has(k)) err(f, m.id, `unknown effect ${k}`);
      if (typeof v !== "number" || Math.abs(v) > 2.5) err(f, m.id, `effect ${k} out of range`);
      if (v && !m.reasons?.[k]) err(f, m.id, `effect ${k} has no reason`);
    }
    for (const fl of Object.keys(m.boost || {})) if (!FLAGS.has(fl)) err(f, m.id, `unknown boost flag ${fl}`);
    if (!m.cost && !Object.values(m.effects || {}).some(v => v)) warn(f, m.id, "scored measure with no cost and no effects (will always be 'Your call')");
  }
}
console.log(`${n} measures checked: ${errors} errors, ${warns} warnings`);
process.exit(errors ? 1 : 0);
