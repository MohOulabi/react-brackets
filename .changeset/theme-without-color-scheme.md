---
"@react-brackets/theme": patch
---

Keep lines, borders and text colours in production builds of pages that set no `color-scheme`. Vite and Tailwind v4 rewrite `light-dark()` for older browsers in a way that needs one, so the theme now defaults to light at the lowest priority, and any `color-scheme` the page sets still wins.
