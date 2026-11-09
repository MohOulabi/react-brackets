---
'react-brackets': patch
---

Smoother swiping on phones, especially iOS Safari.

- The paged bracket follows the finger without re-rendering, pages on a quick flick, and glides on from where the finger lifts instead of jumping back first.
- Connector lines move and fade with their cards on every frame, instead of disappearing while cards move.
- The page no longer scrolls up and down during a sideways swipe.
- Swiping on touch screens no longer jumps a round at once (a regression in 2.1.1).
- Cards no longer stay hidden when the bracket re-renders mid-animation, like when a live score lands.
- The scrolling tree no longer triggers the browser's back gesture when it reaches its edge.
