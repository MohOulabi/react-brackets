# react-brackets

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
