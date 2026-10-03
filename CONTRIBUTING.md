# Contributing

The most useful contributions are **data**: another county's measures, a correction, a missing endorsement.

1. Add or edit entries in `data/<election>/measures.json`. Keep `what`, `y` and `n` plain and neutral: what the measure does, not whether it's good.
2. If the measure costs households money, add the formula to `costs()` in `rules.js`, citing the official analysis in a comment.
3. Add an `effects()` case: how a **Yes** vote moves `budget`, `services`, `transit`, `housing`, `fiscal` (−2.5..+2.5), each with a one-line reason a voter would recognise.
4. Measures that are mainly about values go in `VALUES` and are never scored.
5. `node test/engine.test.mjs` must pass; add a test for any new cost formula.

Neutrality rules: no effect without a reason, no reason without a source, and the same rule applied to every household.
