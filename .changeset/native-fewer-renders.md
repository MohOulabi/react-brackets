---
"@react-brackets/native": patch
---

Faster live updates on large brackets. Only the cards whose match changed redraw on a new result, as long as `renderMatch` keeps its identity, and an inline `theme`, `labels`, `onMatchPress` or `onHighlightChange` no longer redraws every card on each render.
