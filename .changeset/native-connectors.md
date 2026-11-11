---
'@react-brackets/native': minor
---

Custom connector lines. `renderConnector` draws each line with `Bracket.Connector`, which takes a colour, width and turns per line as a style or a function of the line's state, `dash` for dashed and dotted lines, `arrow` for an arrowhead and `flow` to move the pattern along the line. The lines still move by transforms alone, in the same frame as the cards. Anything else you return is drawn as your own line, from `points`, a shared value with where it starts and ends, and `connectorPath` gives the default elbow as SVG path data.
