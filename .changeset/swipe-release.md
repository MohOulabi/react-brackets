---
'react-brackets': minor
---

Swiping the paged bracket now moves under the finger: the next round tightens into focus while the one before slides away, and letting go finishes the move or takes it back. A long or fast swipe crosses several rounds at once; the new `maxSwipeRounds` prop limits that, and `maxSwipeRounds={1}` pages one round at a time. Quick flicks page reliably, since a release is judged by where the finger was heading, and the list view slides from wherever the finger let go instead of jumping.
