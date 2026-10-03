// node build.mjs  ->  dist/index.html (one self-contained file, no network calls)
// Bundles: California 2026 (rule-driven, incl. SF + regional) and every other state's
// statewide measures + races from data/us-2026-11/states/.
import fs from "node:fs";
const CA = "data/ca-2026-11", US = "data/us-2026-11";
const read = f => fs.readFileSync(f, "utf8");
const sdir = `${US}/states`, files = fs.existsSync(sdir) ? fs.readdirSync(sdir).sort() : [];
const measures = [], offices = {};
for (const f of files) {
  const st = f.slice(0, 2);
  if (st === "CA") continue;                       // California uses the rule-driven set
  const data = JSON.parse(read(`${sdir}/${f}`));
  if (f.endsWith(".offices.json")) offices[st] = data;
  else if (/^[A-Z]{2}\.json$/.test(f)) for (const m of data) measures.push({ ...m, state: m.state || st, badge: m.label?.replace(/^(Proposition|Amendment|Question|Issue|Measure|Initiative|Referendum|Constitutional Amendment)\s*/i, "") || m.id });
}
const html = read("src/template.html")
  .replace("/*DATA*/", `const US={MEASURES:${JSON.stringify(measures)},OFFICES:${JSON.stringify(offices)}};\nconst CA={MEASURES:${read(`${CA}/measures.json`)},OFFICES:${read(`${CA}/offices.json`)}};`)
  .replace("/*GEO*/", read(`${US}/geo.js`))
  .replace("/*RULES*/", read(`${CA}/rules.js`))
  .replace("/*ENGINE*/", read("src/engine.js"));
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/index.html", html);
const states = new Set(measures.map(m => m.state));
console.log(`built dist/index.html: CA + ${measures.length} measures in ${states.size} other states, races for ${Object.keys(offices).length} states (${(html.length / 1024).toFixed(0)} KB)`);
