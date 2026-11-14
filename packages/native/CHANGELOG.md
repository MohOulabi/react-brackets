# @react-brackets/native

## 0.3.2

### Patch Changes

- 94c6767: Faster live updates on large brackets. Only the cards whose match changed redraw on a new result, as long as `renderMatch` keeps its identity, and an inline `theme`, `labels`, `onMatchPress` or `onHighlightChange` no longer redraws every card on each render.

## 0.3.1

### Patch Changes

- 088b9f0: Install with npm again. Since 2.2.0 (and native 0.1.0) the published packages listed `@react-brackets/core` as `workspace:*`, a range only a monorepo understands, so `npm install` failed with `EUNSUPPORTEDPROTOCOL`. They now depend on `^2.0.0`.

## 0.3.0

### Minor Changes

- cd9957b: Custom connector lines. `renderConnector` draws each line with `Bracket.Connector`, which takes a colour, width and turns per line as a style or a function of the line's state, `dash` for dashed and dotted lines, `arrow` for an arrowhead and `flow` to move the pattern along the line. The lines still move by transforms alone, in the same frame as the cards. Anything else you return is drawn as your own line, from `points`, a shared value with where it starts and ends, and `connectorPath` gives the default elbow as SVG path data.
- cd9957b: Closer to the web parts. `Bracket.RoundTitle` takes a style and children as functions of `{ round, index, current }`, and draws itself when rendered inside `renderRoundTitle` instead of calling it again. `Bracket.Pagination`, `Bracket.PageIndicator` and `Bracket.ZoomControls` take a style function too, and `usePagination()` returns `paged`. A card built from `Bracket.Match` now takes `colors.surfacePressed` while pressed with `onMatchPress`, as the theme says, with `pressed` in its state; other cards still fade. A controlled `page` now holds: a swipe or tab that `onPageChange` doesn't follow goes back to it. Highlighted lines are drawn over the others in the paged view, as in the tree.

## 0.2.0

### Minor Changes

- a5ebef6: Headless navigation and zoom. `Bracket.Root` with `Bracket.Viewport`, `Bracket.GroupTitle`, `Bracket.Pagination` (`PageButton`, `PreviousPage`, `NextPage`, `PageIndicator`) and `Bracket.ZoomControls` (`ZoomIn`, `ZoomOut`, `ZoomLevel`, `ZoomReset`) arrange the bracket your own way; each part draws a default look without children, and takes children, a function of its state, or a style. `usePagination()` and `useZoom()` drive your own controls from anywhere inside the root, with the swipe position and zoom scale as shared values. New `zoom` options (limits, step, where it starts, alignment, pinch, pan, double tap, momentum, elasticity, overshoot, animation, `onZoomChange`) and `swipe` options (focus, commit, projection, elasticity, spring) replace the fixed values, with defaults that keep today's behaviour. `<Bracket>` gains `renderPagination` and `renderZoomControls`, and `labels` gains the strings for the round tabs and zoom buttons. The default zoom controls are a pill of zoom out, the zoom level and zoom in, with a round fit button beside it; each is disabled where it would do nothing.
  
  The default round tabs keep their gap from the bracket on the row's own style, so `style={{ paddingTop: 0, paddingBottom: 12 }}` puts them above it.

### Patch Changes

- ffcb41f: A card that opens or closes moves the cards around it a frame sooner, so it no longer slips under the card below for a moment.
- 1d1b118: Connector lines are drawn whole on every screen: lines meet their rounded corners edge to edge, keep their length on Android screens with fractional pixel ratios, and corners keep the line's full width without Android's hairlines. The full tree no longer shakes on Android, and a drag pans a zoomed tree the moment the finger moves.

## 0.1.0

### Minor Changes

- dc510c5: First release of `@react-brackets/native`: tournament brackets for React Native and Expo from the same core as the web package. Narrow screens page through one round at a time, as a bracket or as plain lists (`compact="list"`), with every swipe, morph and connector line moved on the UI thread with Reanimated and Gesture Handler; wide screens show the whole tree, scrolled, fitted, or panned and zoomed, in the standard or mirrored layout. Right to left follows the app's direction or `dir`. Cards may be any height and change it as they open or close: the bracket makes room and glides into place. Matches and participants take a `style` that can depend on their state, and a theme sets the default look in light and dark.
