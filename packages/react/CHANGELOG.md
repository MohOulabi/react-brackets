# react-brackets

## 2.1.1

### Patch Changes

- 8b75a6e: `mode="fit"` and `mode="pan-zoom"` no longer collapse before they measure. Server-rendered HTML keeps the tree at its natural size, so the page doesn't jump open on load.

## 2.1.0

### Minor Changes

- e021e7a: Draw your own connector lines. `Bracket.Connectors` takes a function as children and a `defs` prop, and the new `Bracket.Connector` part renders one line with any SVG attribute, like `strokeDasharray`, `markerEnd` or your own `d`. `<Bracket>` gets matching `renderConnector` and `connectorDefs` props, and `useConnector()` reads the line inside your own component.
  
  A swipe or pan released outside the bracket now ends instead of sticking to the pointer.
