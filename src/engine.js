// Ballot Fit scoring engine. Pure functions: household + measures in, recommendations out.
// No network, no storage.
//
// Two kinds of measures:
//  - data-driven (any state): the measure carries `cost`, `effects`, `reasons`, `boost`, `values`
//  - rule-driven (California 2026, the original dataset): effects come from RULES.effects(id, h, c)

const INTERESTS = ["budget", "services", "transit", "housing", "fiscal"];
const HOURS_PER_YEAR = 2080;

// ---- personal cost of a YES vote, in $ per year (positive = you pay more) ----------
function costOf(m, h, G) {
  const c = m.cost; if (!c) return null;
  const f = h.filing === "mfj" ? "mfj" : "single";
  const rate = (G.PROP_TAX_RATE[h.state] || 0.01);
  const homeV = h.home === "own" ? (h.homeValue || 0) : 0, otherV = h.rentalsValue || 0;
  let amt = 0;
  switch (c.model) {
    case "income_tax_brackets":
      for (const [thr, d] of (c.brackets?.[f] || [])) amt += Math.max(0, h.income - thr) * d; break;
    case "income_tax_flat":
      amt = Math.max(0, h.income - (c.exempt_below?.[f] || 0)) * c.rate_change; break;
    case "property_tax_rate":
      amt = (c.per_1000_value || 0) * (homeV + (c.homestead_only ? 0 : otherV)) / 1000; break;
    case "property_tax_pct":
      amt = (c.pct_change || 0) * rate * (homeV + (c.homestead_only ? 0 : otherV)); break;
    case "homestead_exemption":
      amt = h.home === "own" ? -(c.value_change || 0) * rate : 0; break;
    case "sales_tax":
      amt = (c.rate_change || 0) * h.spend; break;
    case "flat_fee": {
      const n = c.per === "property" ? (h.home === "own" ? 1 : 0) + (h.rentals || 0) : 1;
      amt = (c.amount || 0) * n; break;
    }
    case "min_wage":
      amt = h.wage > 0 && h.wage < c.new_rate ? -(c.new_rate - h.wage) * HOURS_PER_YEAR : 0; break;
    default: return null;
  }
  return { amount: amt, start: c.start || c.by_year || null };
}

const fmtMoney = v => "$" + Math.round(Math.abs(v)).toLocaleString("en-US");
const costEff = (amt, income) => {
  const scale = Math.max(income * 0.004, 500);
  // Ordinary costs top out like any other effect (2.5); stakes above ~2% of income can reach 4.
  const raw = -amt / scale, cap = Math.abs(amt) > income * 0.02 ? 4 : 2.5;
  return Math.max(-cap, Math.min(cap, raw));
};

function flags(h) {
  return { disab: h.disab, medicaid: h.medical, school: h.school, owner: h.home === "own", renter: h.home === "rent",
    hourly: h.wage > 0, employer: h.employer, senior: h.senior, transit_user: h.transit >= 1 };
}

function effectsGeneric(m, h, G) {
  const E = Object.fromEntries(INTERESTS.map(k => [k, 0])), why = [];
  for (const [k, v] of Object.entries(m.effects || {})) if (k in E) { E[k] += v; why.push([k, v, m.reasons?.[k] || ""]); }
  const F = flags(h);
  for (const [flag, eff] of Object.entries(m.boost || {})) if (F[flag])
    for (const [k, v] of Object.entries(eff)) if (k in E) { E[k] += v; if (!why.some(w => w[0] === k)) why.push([k, v, m.reasons?.[k] || ""]); }
  const c = costOf(m, h, G);
  if (c && Math.abs(c.amount) >= 1) {
    E.budget += costEff(c.amount, h.income);
    const when = c.start && c.start > 2026 ? ` from ${c.start}` : "";
    why.push(["budget", -c.amount, c.amount > 0 ? `Costs you about ${fmtMoney(c.amount)} a year${when}` : `Saves you about ${fmtMoney(c.amount)} a year${when}`]);
  }
  if (m.cost?.model === "min_wage" && h.employer) { E.budget -= 1; why.push(["budget", -1, "Raises wage costs for your business"]); }
  return { E, why: why.filter(w => w[2]), cost: c };
}

function weights(h) {
  const needsServices = h.disab || h.medical || h.school;
  return { budget: h.w.budget, services: h.w.services * (needsServices ? 1.5 : 0.75),
    transit: h.w.transit * [0.5, 1, 1.5][h.transit || 0], housing: h.w.housing, fiscal: h.w.fiscal };
}

function verdict(score) {
  return score >= 3 ? "Yes" : score >= 0.9 ? "Lean Yes" : score <= -3 ? "No" : score <= -0.9 ? "Lean No" : "Your call";
}

function recommend(m, h, c, R, G) {
  const valuesOnly = m.values === true || (R && !m.effects && R.VALUES.has(m.id));
  if (valuesOnly) return { rec: "Your call", why: [["", 0, "Mostly a question of values; it doesn't change your household's interests."]], score: 0, cost: m.cost ? costOf(m, h, G) : null };
  const { E, why, cost } = m.effects ? effectsGeneric(m, h, G) : { ...R.effects(m.id, h, c), cost: null };
  const W = weights(h);
  const score = INTERESTS.reduce((a, k) => a + E[k] * W[k], 0);
  why.sort((a, b) => Math.abs(b[1] * (W[b[0]] || 0)) - Math.abs(a[1] * (W[a[0]] || 0)));
  return { rec: verdict(score), why, score, cost };
}

// Build the ballot for a household. US = { MEASURES (all states, data-driven), OFFICES {ST: [...]}, G }
// CA = { MEASURES, OFFICES, R } for the rule-driven California set.
function ballot(h, US, CA) {
  if (!/^\d{5}$/.test(h.zip || "")) return null;
  const G = US.G; h.state = G.stateFromZip(h.zip);
  if (!h.state) return null;
  let list, c = { cards: [] }, offices;
  if (h.state === "CA" && CA) {
    const J = CA.R.jurisdictions(h); c = CA.R.costs(h);
    list = CA.MEASURES.filter(m => J.has(m.jurisdiction)).map(m => ({ m, ...recommend(m, h, c, CA.R, G) }));
    offices = CA.OFFICES;
  } else {
    list = US.MEASURES.filter(m => m.state === h.state).map(m => ({ m, ...recommend(m, h, c, null, G) }));
    offices = US.OFFICES[h.state] || [];
    c.cards = list.filter(x => x.cost && Math.abs(x.cost.amount) >= 1)
      .sort((a, b) => Math.abs(b.cost.amount) - Math.abs(a.cost.amount)).slice(0, 4)
      .map(x => ({ amount: x.cost.amount, label: `${x.m.label}${x.cost.amount < 0 ? " saves you" : ""} per year${x.cost.start > 2026 ? `, from ${x.cost.start}` : ""}`, show: true }));
  }
  return { c, results: list, offices, state: h.state };
}

if (typeof module !== "undefined") module.exports = { recommend, ballot, costOf, verdict };
