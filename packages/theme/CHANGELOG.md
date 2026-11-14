# @react-brackets/theme

## 2.1.1

### Patch Changes

- ea88990: Keep lines, borders and text colours in production builds of pages that set no `color-scheme`. Vite and Tailwind v4 rewrite `light-dark()` for older browsers in a way that needs one, so the theme now defaults to light at the lowest priority, and any `color-scheme` the page sets still wins.

## 2.1.0

### Minor Changes

- a84f963: The zoom controls show the zoom level between zoom out and zoom in, in one pill, with fitting as its own round button, and dim at the limits. Styles for the new `page-indicator` and `zoom-level` parts, and focus rings on every control.

## 2.0.1

### Patch Changes

- 06a8987: Card shadows and focus rings at the edge of a bracket are no longer cut off, and a pan and zoom bracket starts clear of its frame.
