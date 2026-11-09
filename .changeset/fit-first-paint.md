---
'react-brackets': patch
---

`mode="fit"` and `mode="pan-zoom"` no longer collapse before they measure. Server-rendered HTML keeps the tree at its natural size, so the page doesn't jump open on load.
