# @react-brackets/native

Tournament brackets for React Native and Expo, from the same core as [react-brackets](https://react-brackets.oulabi.dev).

- **Native feel.** Swipes, the change of round, pinch and zoom all run on the UI thread with Reanimated and Gesture Handler. React re-renders only once a swipe lands.
- **Lines that never trail.** Connectors are plain views moved by the same transforms as the cards, in the same frame, and stay sharp at any zoom. Dash, dot, colour or point each one with `renderConnector`, or draw your own.
- **Still a bracket on a phone.** Narrow screens page through one round at a time, with the next round and its lines at the edge, or as plain lists. Wide screens get the whole tree, scrolled, fitted or zoomed, standard or mirrored.
- **Right to left.** Follows your app's direction, or `dir="rtl"`: the first round on the right, swiped the other way.
- **Every format.** Single and double elimination, round robin, Swiss and your own data, with results that move winners on.
- **Styled your way.** A light and dark theme out of the box, and a `style` on every part that can depend on its state, for StyleSheet, Uniwind, NativeWind or Unistyles.

## Install

```bash
npx expo install @react-brackets/native react-native-reanimated react-native-worklets react-native-gesture-handler
```

It needs React Native's New Architecture, Reanimated 4 and Gesture Handler 3. Expo Go includes all of them.

## Use

```tsx
import { Bracket, singleElimination } from '@react-brackets/native';

const stage = singleElimination([
  { id: 'falcons', name: 'Falcons' },
  { id: 'wolves', name: 'Wolves' },
  { id: 'herons', name: 'Herons' },
  { id: 'lynx', name: 'Lynx' },
]);

export function Screen() {
  return <Bracket stage={stage} />;
}
```

Wrap your app in `GestureHandlerRootView`, as Gesture Handler asks. Inside a scrolling screen, use Gesture Handler's `ScrollView`, so a swipe across the bracket and a scroll down the page never fight over the same touch.

## Layouts

```tsx
<Bracket stage={stage} />                          // a round at a time, as a bracket
<Bracket stage={stage} compact="list" />           // a round at a time, as plain lists
<Bracket stage={stage} compactBelow={0} mode="pan-zoom" />  // the whole tree, to pinch and zoom
<Bracket stage={stage} dir="rtl" />                // right to left
```

## Your own cards

```tsx
<Bracket
  stage={stage}
  renderMatch={() => (
    <Bracket.Match style={({ live }) => [styles.card, live && styles.live]}>
      <Bracket.Participant slot={0} style={({ winner }) => winner && styles.winner} />
      <Bracket.Participant slot={1} style={({ winner }) => winner && styles.winner} />
    </Bracket.Match>
  )}
/>;
```

`Bracket.Participant` also takes a function as its child, to draw anything from the participant's state.

## Your own controls

```tsx
<Bracket.Root stage={stage} zoom={{ maxScale: 3 }} swipe={{ elasticity: 0 }}>
  <Bracket.Viewport mode="pan-zoom" controls={false} />
  <Bracket.Pagination>
    <Bracket.PreviousPage />
    <Bracket.PageIndicator />
    {stage.groups[0].rounds.map((round, index) => (
      <Bracket.PageButton key={round.id} index={index} />
    ))}
    <Bracket.NextPage />
  </Bracket.Pagination>
  <Bracket.ZoomControls />
</Bracket.Root>;
```

`usePagination()` and `useZoom()` drive your own buttons from anywhere inside `Bracket.Root`; `position` and `scale` are shared values, so what you draw follows a swipe or a pinch on the UI thread. On `<Bracket>`, `renderPagination` and `renderZoomControls` swap just those.

## Theme

```tsx
<Bracket stage={stage} theme={{ colors: { accent: '#ea580c' }, radius: 14 }} />;
```

Or set one for every bracket with `BracketThemeProvider` and `createTheme`. With Unistyles, `withUnistyles(Bracket, (theme) => ({ theme: { colors: theme.bracket } }))` keeps the bracket in step with your themes. With Uniwind, `withUniwind(Bracket.Match)` gives a card a `className`.

## Smoothest in a development build

Reanimated can move views without a layout pass. Turn it on in your app's `package.json`, then rebuild:

```json
{
  "reanimated": {
    "staticFeatureFlags": {
      "IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS": true,
      "ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS": true
    }
  }
}
```

The bracket only animates transforms and opacity, and its presses use Gesture Handler, so it is ready for this fast path.

## Examples

[`examples/native`](https://github.com/MohOulabi/react-brackets/tree/main/examples/native) is an Expo app with every example in the docs, from a quick start to an esports bracket you can play. See them recorded on an iPhone, with their code, at [react-brackets.oulabi.dev/examples/native](https://react-brackets.oulabi.dev/examples/native).

## License

MIT
