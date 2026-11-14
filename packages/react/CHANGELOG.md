# react-brackets

## 2.4.3

### Patch Changes

- 3de42b7: Smoother paged view on phones. A card that grows by itself, like a roster opening with a CSS transition, no longer makes the bracket run the same move twice, resizing the window no longer animates the cards, and a card wider than its round's column no longer spills over the next round: the theme keeps cards within their column, so the gap between rounds always holds.

## 2.4.2

### Patch Changes

- ea88990: Faster live updates on large brackets. Results keep every match, round and group they don't change as the same object, connector lines are measured again only when the layout changes, and only the cards whose match changed re-render, as long as `renderMatch` keeps its identity. On a 256-team bracket, a score update now takes React about a tenth of the time it did.
- Updated dependencies [ea88990]
  - @react-brackets/core@2.0.1

## 2.4.1

### Patch Changes

- 088b9f0: Install with npm again. Since 2.2.0 (and native 0.1.0) the published packages listed `@react-brackets/core` as `workspace:*`, a range only a monorepo understands, so `npm install` failed with `EUNSUPPORTEDPROTOCOL`. They now depend on `^2.0.0`.

## 2.4.0

### Minor Changes

- a84f963: Round navigation and zoom are fully headless. `Bracket.Pagination` takes children, built from the new `Bracket.PageButton`, `Bracket.PreviousPage`, `Bracket.NextPage` and `Bracket.PageIndicator` parts or `usePagination()`. Zoom controls are parts too, `Bracket.ZoomControls`, `Bracket.ZoomIn`, `Bracket.ZoomOut`, `Bracket.ZoomReset` and `Bracket.ZoomLevel`, which work anywhere inside the root, as does `useZoom()` for controls of your own. `<Bracket>` takes `renderPagination` and `renderZoomControls`.
  
  Every pan and zoom behaviour is an option of the new `zoom` prop: the limits, the step, where the tree starts and rests, pan, pinch, wheel, double tap, momentum, edge elasticity, pinch overshoot, the keyboard, and `onZoomChange`. A drag now glides on and springs back at the edges, a double click zooms in and back out, and `+`, `-`, `0` and the arrow keys work while the viewport has focus. The `swipe` prop tunes the paged view: how much of the width the round in focus takes, how far a drag must go, how far a flick carries, and the elasticity at the first and last round. Existing code keeps working as it did.

## 2.3.0

### Minor Changes

- dbcbbbf: The paged view no longer cuts off the taller round while it slides away or in: it stays tall enough for both rounds during the move and settles to the new round's height as it lands. `pageHeight="follow"` brings back the height that blends under the finger.

## 2.2.0

### Minor Changes

- af6ace7: Swiping the paged bracket now moves under the finger: the next round tightens into focus while the one before slides away, and letting go finishes the move or takes it back. A long or fast swipe crosses several rounds at once; the new `maxSwipeRounds` prop limits that, and `maxSwipeRounds={1}` pages one round at a time. Quick flicks page reliably, since a release is judged by where the finger was heading, and the list view slides from wherever the finger let go instead of jumping.

## 2.1.2

### Patch Changes

- 5ac602b: Smoother swiping on phones, especially iOS Safari.
  
  - The paged bracket follows the finger without re-rendering, pages on a quick flick, and glides on from where the finger lifts instead of jumping back first.
  - Connector lines move and fade with their cards on every frame, instead of disappearing while cards move.
  - The page no longer scrolls up and down during a sideways swipe.
  - Swiping on touch screens no longer jumps a round at once (a regression in 2.1.1).
  - Cards no longer stay hidden when the bracket re-renders mid-animation, like when a live score lands.
  - The scrolling tree no longer triggers the browser's back gesture when it reaches its edge.

## 2.1.1

### Patch Changes

- 8b75a6e: `mode="fit"` and `mode="pan-zoom"` no longer collapse before they measure. Server-rendered HTML keeps the tree at its natural size, so the page doesn't jump open on load.

## 2.1.0

### Minor Changes

- e021e7a: Draw your own connector lines. `Bracket.Connectors` takes a function as children and a `defs` prop, and the new `Bracket.Connector` part renders one line with any SVG attribute, like `strokeDasharray`, `markerEnd` or your own `d`. `<Bracket>` gets matching `renderConnector` and `connectorDefs` props, and `useConnector()` reads the line inside your own component.
  
  A swipe or pan released outside the bracket now ends instead of sticking to the pointer.
