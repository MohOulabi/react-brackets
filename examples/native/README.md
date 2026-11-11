# React Native example

An Expo app with every `@react-brackets/native` example from the docs: the paged bracket and plain lists, the full tree, every format, right to left, custom cards and titles, live scores, an esports bracket you can play, and theming with Tailwind (Uniwind) and Unistyles. Each example is one file in `src/examples`, listed in `src/catalog.ts`.

It reads the library from its source in this repository, so changes show without a build.

## Run it

From the repository root, after `bun install`:

```bash
cd examples/native
```

```bash
bun run ios
```

Or, with the Android SDK and an emulator running:

```bash
bun run android
```

That makes a development build, which Unistyles needs and which turns on Reanimated's fast path for moving views (see `reanimated.staticFeatureFlags` in `package.json`). For the smoothest feel, build the release configuration:

```bash
npx expo run:ios --configuration Release
```

```bash
npx expo run:android --variant release
```

Every example opens straight from a link, which is handy for recording one:

```bash
xcrun simctl openurl booted "dev.oulabi.reactbrackets://example/esports"
```

```bash
adb shell am start -a android.intent.action.VIEW -d "dev.oulabi.reactbrackets://example/esports"
```

Without Unistyles, `bun run start` and Expo Go are enough for the other demos.
