// Reads the free-text "anything else about you" note, entirely in the browser.
// Transparent phrase matching, no AI and no network: every match becomes a visible
// chip the user can remove. Returns { facts: [...], weights: {...} }.
//   facts:   { key, label, apply(h) }   household facts (flags, home, transit…)
//   weights: { interest: +1 }           nudges to the priority sliders
const NOTE_RULES = [
  // who you are
  { key: "veteran", label: "Veteran", re: /\b(veteran|vet\b|served in the (army|navy|marines?|air force|coast guard|military)|military service|active duty)/, apply: h => { h.veteran = true; } },
  { key: "farmer", label: "Farmer or rancher", re: /\b(farm(er|ing|land)?|ranch(er|ing)?|agricultur|timber ?land)/, apply: h => { h.farmer = true; } },
  { key: "teacher", label: "Teacher / school staff", re: /\b(teacher|i teach|educator|school (staff|employee|nurse|counsel+or|aide)|para-?educator|substitute teacher)/, apply: h => { h.teacher = true; } },
  { key: "public_employee", label: "Public employee / union", re: /\b(state (worker|employee)|public[- ](sector|employee)|government (job|employee|worker)|(city|county) (employee|worker)|union member|in a union|i'?m union)/, apply: h => { h.public_employee = true; } },
  { key: "employer", label: "Business owner / employer", re: /\b(small business|own (a|my) business|business owner|my (company|business|restaurant|shop|store)|i employ|my employees|i'?m self[- ]employed)/, apply: h => { h.employer = true; } },
  { key: "senior", label: "65 or older / retired", re: /\b(retired|retiree|over 65|i'?m (6[5-9]|[7-9]\d)\b|senior citizen|on social security|fixed income)/, apply: h => { h.senior = true; } },
  { key: "student", label: "Student", re: /\b(i'?m a student|college student|grad(uate)? student|in college|student loans?)/, apply: h => { h.student = true; } },
  { key: "first_buyer", label: "Hoping to buy a first home", re: /\b(first[- ]time (home ?)?buyer|saving (up )?for a (house|home|down payment)|want to buy (a|our first) (house|home))/, apply: h => { h.first_buyer = true; } },
  // circumstances
  { key: "disab", label: "Disability in the family", re: /\b(disab|autis|special[- ](ed|education|needs)|wheelchair|epilep|seizure|cerebral palsy|down syndrome|\biep\b|regional center|ihss|developmental delay)/, apply: h => { h.disab = true; } },
  { key: "medical", label: "Medicaid in the family", re: /\b(medicaid|medi-?cal|\bchip\b|\bssi\b|masshealth|tenncare|apple health)/, apply: h => { h.medical = true; } },
  { key: "school", label: "Kids in public school", re: /\b(kids?|children|son|daughter|child)\b[^.]{0,40}\b(public school|elementary|middle school|high school|kindergarten|grade)|\bpublic school (parent|kids?)/, apply: h => { h.school = true; } },
  { key: "transit", label: "Rides transit daily", re: /\b(take|ride|use) (the )?(bus|train|subway|muni|bart|metro|light rail|transit)|commute by (bus|train|transit)|(don'?t|do not) (own|have) a car|car-?free/, apply: h => { h.transit = 2; } },
  { key: "owner", label: "Homeowner", re: /\b(homeowner|i (own|bought) (a|my|our) (home|house|condo)|we (own|bought) (a|our) (home|house|condo))/, apply: h => { h.home = "own"; } },
  { key: "renter", label: "Renter", re: /\b(i rent|we rent|renter|tenant)\b/, apply: h => { h.home = "rent"; } },
  { key: "landlord", label: "Landlord", re: /\b(landlord|rental propert(y|ies)|rent (it |them )?out|i own (a |two |\d+ )?rentals?)/, apply: h => { h.rentals = Math.max(1, h.rentals || 0); } },
];
const NOTE_PRIORITIES = [
  { key: "services", label: "Prioritise schools & services", re: /\b(care (a lot )?about (schools|education|public services)|(schools|education) (matter|are important|is important)|health ?care costs?|medical bills)/ },
  { key: "budget", label: "Prioritise keeping costs down", re: /\b(taxes (are )?too high|lower taxes|tight budget|money is tight|can'?t afford|cost of living|living paycheck|every dollar)/ },
  { key: "transit", label: "Prioritise transit", re: /\b(care about (transit|public transport)|need (good )?transit|better (bus|train|transit))/ },
  { key: "housing", label: "Prioritise housing affordability", re: /\b(housing (costs?|crisis|affordability)|rents? (is|are) too high|affordable housing|can'?t afford (a home|to buy))/ },
  { key: "fiscal", label: "Prioritise careful spending", re: /\b(government waste|wasteful spending|deficit|public debt|fiscal(ly)? (responsib|conservative)|balanced budget)/ },
];
const NEGATION = /\b(not|no|never|don'?t|doesn'?t|isn'?t|aren'?t|wasn'?t|without)\s+(\w+\s+){0,2}$/;

function parseNote(text, dismissed = new Set()) {
  const t = String(text || "").toLowerCase().replace(/\s+/g, " ");
  const facts = [], weights = {};
  if (!t.trim()) return { facts, weights };
  const hit = re => { const m = re.exec(t); return m && !NEGATION.test(t.slice(Math.max(0, m.index - 30), m.index)); };
  for (const r of NOTE_RULES) if (!dismissed.has(r.key) && hit(r.re)) facts.push(r);
  for (const p of NOTE_PRIORITIES) if (!dismissed.has("w-" + p.key) && hit(p.re)) { weights[p.key] = 1; facts.push({ key: "w-" + p.key, label: p.label, apply: () => {} }); }
  // a note can't say both: renter wins only if no homeowner phrase
  if (facts.some(f => f.key === "owner") && facts.some(f => f.key === "renter")) facts.splice(facts.findIndex(f => f.key === "renter"), 1);
  return { facts, weights };
}
if (typeof module !== "undefined") module.exports = { parseNote };

// ---- Smart read (opt-in) ----------------------------------------------------------
// The same fact and priority keys as the phrase matcher, so AI results become ordinary chips.
const SMART_FACT_KEYS = NOTE_RULES.map(r => r.key);
const SMART_PRIORITY_KEYS = NOTE_PRIORITIES.map(p => p.key);
const SMART_SCHEMA = {
  type: "object", additionalProperties: false, required: ["facts", "priorities"],
  properties: {
    facts: { type: "array", items: { type: "object", additionalProperties: false, required: ["key", "evidence"],
      properties: { key: { type: "string", enum: SMART_FACT_KEYS }, evidence: { type: "string" } } } },
    priorities: { type: "array", items: { type: "object", additionalProperties: false, required: ["key", "evidence"],
      properties: { key: { type: "string", enum: SMART_PRIORITY_KEYS }, evidence: { type: "string" } } } },
  },
};
const SMART_SYSTEM = `You read a short note a voter wrote about their own household and map it to a fixed list of facts and priorities used to estimate how ballot measures affect them.

Facts (include only if the note clearly says it about the writer's own household):
${NOTE_RULES.map(r => `- ${r.key}: ${r.label}`).join("\n")}

Priorities (include only if the writer says this matters to them):
${NOTE_PRIORITIES.map(p => `- ${p.key}: ${p.label}`).join("\n")}

For each item, "evidence" is the shortest exact quote from the note that supports it. Leave out anything that is guessed, hypothetical, negated, or about other people. Don't infer political views or party. Return empty arrays if nothing applies.`;

// Turns a smart-read result into the same shape parseNote returns.
function smartToFacts(result, dismissed = new Set()) {
  const facts = [], weights = {};
  for (const f of result?.facts || []) {
    const r = NOTE_RULES.find(x => x.key === f.key);
    if (r && !dismissed.has(r.key)) facts.push({ ...r, label: "✨ " + r.label, evidence: f.evidence });
  }
  for (const p of result?.priorities || []) {
    const r = NOTE_PRIORITIES.find(x => x.key === p.key);
    if (r && !dismissed.has("w-" + r.key)) { weights[r.key] = 1; facts.push({ key: "w-" + r.key, label: "✨ " + r.label, evidence: p.evidence, apply: () => {} }); }
  }
  return { facts, weights };
}

// On-device first (Chrome's built-in Prompt API: nothing leaves the device).
async function smartReadOnDevice(note) {
  if (typeof LanguageModel === "undefined") return null;
  if ((await LanguageModel.availability()) !== "available") return null;
  const session = await LanguageModel.create({ initialPrompts: [{ role: "system", content: SMART_SYSTEM }] });
  try { return JSON.parse(await session.prompt(note, { responseConstraint: SMART_SCHEMA })); }
  finally { session.destroy?.(); }
}

// Claude via the visitor's own API key, called directly from the browser. Only the note is sent.
async function smartReadClaude(note, apiKey) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "server-side-fallback-2026-07-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SMART_SCHEMA } },
      system: SMART_SYSTEM,
      messages: [{ role: "user", content: note }],
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error?.message || res.statusText;
    throw new Error(res.status === 401 ? "That API key wasn't accepted. Check it and try again."
      : res.status === 429 ? "Rate limited by Anthropic. Wait a moment and try again." : `Claude returned an error: ${msg}`);
  }
  if (body.stop_reason === "refusal") throw new Error("Claude declined to read this note. The phrase matcher's results still apply.");
  const text = (body.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  return JSON.parse(text);
}
if (typeof module !== "undefined") Object.assign(module.exports, { SMART_SCHEMA, SMART_SYSTEM, smartToFacts, smartReadClaude, smartReadOnDevice });
