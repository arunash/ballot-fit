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
