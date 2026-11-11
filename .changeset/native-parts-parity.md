---
'@react-brackets/native': minor
---

Closer to the web parts. `Bracket.RoundTitle` takes a style and children as functions of `{ round, index, current }`, and draws itself when rendered inside `renderRoundTitle` instead of calling it again. `Bracket.Pagination`, `Bracket.PageIndicator` and `Bracket.ZoomControls` take a style function too, and `usePagination()` returns `paged`. A card built from `Bracket.Match` now takes `colors.surfacePressed` while pressed with `onMatchPress`, as the theme says, with `pressed` in its state; other cards still fade. A controlled `page` now holds: a swipe or tab that `onPageChange` doesn't follow goes back to it. Highlighted lines are drawn over the others in the paged view, as in the tree.
