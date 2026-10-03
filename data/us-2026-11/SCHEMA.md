# Measure schema (data/us-2026-11/states/XX.json = JSON array of measures)

Each measure object:
- id: "<ST>-<ballot number or slug>", e.g. "OH-1", "CO-123", "MA-Q2"
- state: two-letter, e.g. "OH"
- label: as printed on the ballot, e.g. "Issue 1", "Amendment 2", "Question 4", "Proposition 123"
- t: short neutral title (<= 60 chars)
- type: e.g. "Initiated constitutional amendment", "Legislative referral", "Bond ($X)", "Veto referendum"
- threshold: "majority" | "60%" | "two-thirds" | other, as required to pass
- what: 2-3 plain, neutral sentences on what it does
- y / n: one sentence each: what a YES vote does / what a NO vote does
- fiscal: official fiscal impact (state fiscal note, legislative analyst, budget office), with $ figures if given
- pro / con: main supporters / opponents (organisations, notable people), comma-separated
- endorse: object of up to 5 well-known endorsers -> "Y" | "N" | "–" (e.g. {"Dem Party":"Y","GOP":"N","LWV":"Y","<Largest newspaper>":"N"})
- poll: latest public poll % YES (number) or null
- source: URL of the best official/primary source (SoS, fiscal note, Ballotpedia page)
- values: true if the measure is mainly about values/rights/process and has little direct effect on household money or public services (e.g. abortion, marijuana, guns, voter ID, redistricting, term limits, criminal sentencing, names/symbols). Values measures are never scored.
- cost: null, or ONE personal cost model for a YES vote (positive = household pays more), using official figures:
    {"model":"income_tax_brackets","start":2027,"brackets":{"mfj":[[threshold, rate_change], ...],"single":[[threshold, rate_change], ...]},"note":"..."}   rate_change e.g. 0.01 = +1 point on income above threshold (cumulative tiers listed separately)
    {"model":"income_tax_flat","rate_change":-0.005,"exempt_below":{"mfj":0,"single":0},"note":"..."}   applies to all taxable income above exempt_below
    {"model":"property_tax_rate","per_1000_value":1.5,"homestead_only":false,"note":"..."}   $ per $1,000 of market value per year (negative = cut)
    {"model":"property_tax_pct","pct_change":-0.25,"homestead_only":true,"note":"..."}   % change in the household's current property tax bill (engine estimates bill from state effective rate)
    {"model":"homestead_exemption","value_change":50000,"note":"..."}   increase in exempt home value for owner-occupied homes (saving = value_change * state effective rate)
    {"model":"sales_tax","rate_change":0.005,"note":"..."}   applied to the household's taxable spending
    {"model":"flat_fee","amount":25,"per":"household"|"vehicle"|"property","note":"..."}
    {"model":"min_wage","new_rate":17,"by_year":2028,"note":"..."}   (engine applies to hourly workers / employers)
- effects: how a YES vote moves public interests, each -2.5..+2.5 (omit zeros):
    {"services": n, "transit": n, "housing": n, "fiscal": n, "budget": n}
    services = schools, health/Medicaid, disability services, safety net; fiscal = public debt, reserves, state budget health (negative = adds debt/costs or cuts revenue sharply); budget = non-tax household money effects only (use cost for taxes)
- reasons: one plain sentence per non-zero effect key, e.g. {"services":"Adds $X a year for K-12 schools"}
- boost (optional): extra effects for specific households: keys among "disab","medicaid","school","owner","renter","hourly","employer","senior","transit_user"; values are effect objects, e.g. {"disab":{"services":1}}

Neutrality: describe, don't advocate. Every effect needs a reason; every reason should come from the official analysis or the measure text.
