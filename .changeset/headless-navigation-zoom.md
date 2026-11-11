---
'react-brackets': minor
---

Round navigation and zoom are fully headless. `Bracket.Pagination` takes children, built from the new `Bracket.PageButton`, `Bracket.PreviousPage`, `Bracket.NextPage` and `Bracket.PageIndicator` parts or `usePagination()`. Zoom controls are parts too, `Bracket.ZoomControls`, `Bracket.ZoomIn`, `Bracket.ZoomOut`, `Bracket.ZoomReset` and `Bracket.ZoomLevel`, which work anywhere inside the root, as does `useZoom()` for controls of your own. `<Bracket>` takes `renderPagination` and `renderZoomControls`.

Every pan and zoom behaviour is an option of the new `zoom` prop: the limits, the step, where the tree starts and rests, pan, pinch, wheel, double tap, momentum, edge elasticity, pinch overshoot, the keyboard, and `onZoomChange`. A drag now glides on and springs back at the edges, a double click zooms in and back out, and `+`, `-`, `0` and the arrow keys work while the viewport has focus. The `swipe` prop tunes the paged view: how much of the width the round in focus takes, how far a drag must go, how far a flick carries, and the elasticity at the first and last round. Existing code keeps working as it did.
