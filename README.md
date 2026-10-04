# Ballot Fit

**Your ballot, fitted to your household.** Enter a ZIP code and a few facts about your household (income, home, family, how you get around, what you care about) and get back every measure on your ballot with:

- what a **Yes** and a **No** actually do, from the official analyses
- **what it costs you**, in dollars a year
- a **recommendation** that you can trace to your own answers, with the reasons spelled out

Everything runs in the browser. Nothing you enter is sent anywhere or stored.

Covers the **US general election of 3 November 2026**:

- **Every statewide ballot measure**: 146 measures in 39 states + DC, with official fiscal impact and, where a measure changes household taxes or fees, a personal cost model (income-tax brackets, flat-rate changes, property-tax rates and exemptions, sales tax, fees, minimum wage)
- **Governor and US Senate races** in all 50 states
- **San Francisco** local measures and the Bay Area regional transit tax (RTM) for those ZIPs

ZIP code only: your state comes from the ZIP, and nothing leaves the browser (unless you choose Smart read; see below). County and city measures outside San Francisco aren't included yet.

## How recommendations work

There's no model making a call in the dark. Each measure has a small, readable rule (`data/<election>/rules.js`) describing how a **Yes** vote moves five interests:

| Interest | Examples |
|---|---|
| `budget` | your taxes and fees (computed from your income, spending and property) |
| `services` | schools, Medi-Cal, IHSS, Regional Centers, clinics |
| `transit` | Muni, BART, paratransit |
| `housing` | supply and affordability |
| `fiscal` | public debt, reserves, set-asides |

There's also an **"Anything else about you?"** box. It's read in your browser by plain phrase matching (no AI, nothing sent): "retired teacher", "veteran", "we rent", "our son has an IEP", "taxes are too high" become visible chips that adjust your household and priorities, and you can remove any it got wrong (`src/note.js`).

**✨ Smart read** (optional) reads the note with an AI model for the things phrase matching misses ("we still own the house we raised our kids in" → homeowner). It uses your device's built-in model when there is one (nothing sent), otherwise Claude with **your own** API key: only the note is sent, the key isn't stored, and there's no server in between. Results become the same removable chips, each showing the words it came from.

Your answers set the weights (the five sliders, scaled up when your family actually uses those services or transit). The engine (`src/engine.js`) adds it up: **Yes / Lean Yes / Your call / Lean No / No**, and shows the top reasons.

Measures that are mostly about values (voter ID, recall rules, public campaign finance) always come back **"Your call"**. The tool weighs interests you state; it doesn't pick sides on values.

## Run it

```
node build.mjs            # -> dist/index.html (one self-contained file)
node test/engine.test.mjs # sanity checks on costs and recommendations
open dist/index.html
```

No dependencies. Host `dist/index.html` anywhere static. Every push to `main` runs the tests and publishes to GitHub Pages: **https://arunash.github.io/ballot-fit/**

## Adding an election or a county

Each election is a folder under `data/`:

- `us-2026-11/states/XX.json` + `XX.offices.json`: each state's measures and races, in the format in `us-2026-11/SCHEMA.md`
- `ca-2026-11/measures.json`: one object per measure (`id`, `jurisdiction`, `t`, `type`, `what`, `y`, `n`, `fiscal`, `pro`, `con`, `e` endorsements, `poll`)
- `offices.json`: candidate races shown to everyone
- `rules.js`: ZIP → jurisdictions, personal-cost formulas, and the effect of a Yes vote per measure

See [CONTRIBUTING.md](CONTRIBUTING.md). Every number should cite an official source (Legislative Analyst, county controller or counsel, voter pamphlet).

## Sources (2026)

CA Secretary of State voter guide · Legislative Analyst's Office · SF Controller statements · CalMatters · endorsements from the SF Chronicle, both state parties, League of Women Voters, SPUR, GrowSF and others. See the links inside the app.

## Not advice

Estimates from public analyses, not tax, legal or voting advice. Check your sample ballot.

## License

Code: MIT. Data in `data/`: CC BY 4.0.
