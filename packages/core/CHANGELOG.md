# @react-brackets/core

## 2.0.1

### Patch Changes

- ea88990: Faster live updates on large brackets. Results keep every match, round and group they don't change as the same object, connector lines are measured again only when the layout changes, and only the cards whose match changed re-render, as long as `renderMatch` keeps its identity. On a 256-team bracket, a score update now takes React about a tenth of the time it did.
