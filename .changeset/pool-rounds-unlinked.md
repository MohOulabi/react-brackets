---
"@react-brackets/core": patch
---

`fromRounds` with `kind: 'pool'` no longer links rounds of the same size, so a result on one matchday stops replacing teams already scheduled for the next. Thanks to @YiheHuang for the fix in #84.
