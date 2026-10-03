# Ballot Fit

**Your ballot, fitted to your household.** Enter a ZIP code and a few facts about your household (income, home, family, how you get around, what you care about) and get back every measure on your ballot with:

- what a **Yes** and a **No** actually do, from the official analyses
- **what it costs you**, in dollars a year
- a **recommendation** that you can trace to your own answers, with the reasons spelled out

Everything runs in the browser. Nothing you enter is sent anywhere or stored.

Currently covers the **California general election of 3 November 2026**: all 14 statewide propositions everywhere, the 10 San Francisco measures for SF ZIPs, and the Bay Area regional transit tax (RTM) for the five participating counties.

## How recommendations work

There's no model making a call in the dark. Each measure has a small, readable rule (`data/<election>/rules.js`) describing how a **Yes** vote moves five interests:

| Interest | Examples |
|---|---|
| `budget` | your taxes and fees (computed from your income, spending and property) |
| `services` | schools, Medi-Cal, IHSS, Regional Centers, clinics |
| `transit` | Muni, BART, paratransit |
| `housing` | supply and affordability |
| `fiscal` | public debt, reserves, set-asides |

Your answers set the weights (the five sliders, scaled up when your family actually uses those services or transit). The engine (`src/engine.js`) adds it up: **Yes / Lean Yes / Your call / Lean No / No**, and shows the top reasons.

Measures that are mostly about values (voter ID, recall rules, public campaign finance) always come back **"Your call"**. The tool weighs interests you state; it doesn't pick sides on values.

## Run it

```
node build.mjs            # -> dist/index.html (one self-contained file)
node test/engine.test.mjs # sanity checks on costs and recommendations
open dist/index.html
```

No dependencies. Host `dist/index.html` anywhere static.

## Adding an election or a county

Each election is a folder under `data/`:

- `measures.json`: one object per measure (`id`, `jurisdiction`, `t`, `type`, `what`, `y`, `n`, `fiscal`, `pro`, `con`, `e` endorsements, `poll`)
- `offices.json`: candidate races shown to everyone
- `rules.js`: ZIP → jurisdictions, personal-cost formulas, and the effect of a Yes vote per measure

See [CONTRIBUTING.md](CONTRIBUTING.md). Every number should cite an official source (Legislative Analyst, county controller or counsel, voter pamphlet).

## Sources (2026)

CA Secretary of State voter guide · Legislative Analyst's Office · SF Controller statements · CalMatters · endorsements from the SF Chronicle, both state parties, League of Women Voters, SPUR, GrowSF and others. See the links inside the app.

## Not advice

Estimates from public analyses, not tax, legal or voting advice. Check your sample ballot.

## License

Code: MIT. Data in `data/`: CC BY 4.0.
