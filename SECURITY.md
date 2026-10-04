# Security

Ballot Fit is a single static page. It has no server, no accounts and no analytics. Its Content-Security-Policy allows exactly one network destination, `https://api.anthropic.com`, and only for **Smart read**, an opt-in button:

- If the browser has a built-in on-device model (Chrome's Prompt API), Smart read runs locally and nothing is sent.
- Otherwise it asks for the visitor's **own** Anthropic API key and sends **only the free-text note** to Claude. The key is held in memory for that one request, then the field is cleared; it's never stored or logged, and there is no Ballot Fit server in between.

Everything else (ZIP, income, home, family details) never leaves the browser.

To report a vulnerability or a data error that could mislead voters, open a GitHub issue, or use a private security advisory for anything sensitive.

Data contributions are validated in CI (`test/validate-data.mjs`): sources must be http(s) URLs and markup in text fields is rejected. All data is HTML-escaped when rendered.
