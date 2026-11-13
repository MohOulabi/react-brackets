---
'react-brackets': patch
'@react-brackets/native': patch
---

Install with npm again. Since 2.2.0 (and native 0.1.0) the published packages listed `@react-brackets/core` as `workspace:*`, a range only a monorepo understands, so `npm install` failed with `EUNSUPPORTEDPROTOCOL`. They now depend on `^2.0.0`.
