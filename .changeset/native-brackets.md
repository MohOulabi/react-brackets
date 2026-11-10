---
'@react-brackets/native': minor
---

First release of `@react-brackets/native`: tournament brackets for React Native and Expo from the same core as the web package. Narrow screens page through one round at a time, as a bracket or as plain lists (`compact="list"`), with every swipe, morph and connector line moved on the UI thread with Reanimated and Gesture Handler; wide screens show the whole tree, scrolled, fitted, or panned and zoomed, in the standard or mirrored layout. Right to left follows the app's direction or `dir`. Cards may be any height and change it as they open or close: the bracket makes room and glides into place. Matches and participants take a `style` that can depend on their state, and a theme sets the default look in light and dark.
