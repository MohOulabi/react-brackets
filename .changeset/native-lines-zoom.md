---
'@react-brackets/native': patch
---

Connector lines are drawn whole on every screen: lines meet their rounded corners edge to edge, keep their length on Android screens with fractional pixel ratios, and corners keep the line's full width without Android's hairlines. The full tree no longer shakes on Android, and a drag pans a zoomed tree the moment the finger moves.
