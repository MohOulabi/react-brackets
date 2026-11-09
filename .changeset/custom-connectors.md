---

## 'react-brackets': minor

Draw your own connector lines. `Bracket.Connectors` takes a function as children and a `defs` prop, and the new `Bracket.Connector` part renders one line with any SVG attribute, like `strokeDasharray`, `markerEnd` or your own `d`. `<Bracket>` gets matching `renderConnector` and `connectorDefs` props, and `useConnector()` reads the line inside your own component.

A swipe or pan released outside the bracket now ends instead of sticking to the pointer.
