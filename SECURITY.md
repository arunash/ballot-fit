# Security

Ballot Fit is a single static page. It has no server, no accounts and no analytics, and its Content-Security-Policy blocks every network request (`connect-src 'none'`), so what you type can't leave your browser.

To report a vulnerability or a data error that could mislead voters, open a GitHub issue, or use a private security advisory for anything sensitive.

Data contributions are validated in CI (`test/validate-data.mjs`): sources must be http(s) URLs and markup in text fields is rejected. All data is HTML-escaped when rendered.
