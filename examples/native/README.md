# React Native example

An Expo app showing `@react-brackets/native`: the paged bracket, the full tree in its three modes, custom cards with a live match, and theming with Tailwind (Uniwind) and Unistyles.

It reads the library from its source in this repository, so changes show without a build.

## Run it

From the repository root, after `bun install`:

```bash
cd examples/native
```

```bash
bun run ios
```

That makes a development build, which Unistyles needs and which turns on Reanimated's fast path for moving views (see `reanimated.staticFeatureFlags` in `package.json`). For the smoothest feel, build the release configuration:

```bash
npx expo run:ios --configuration Release
```

Without Unistyles, `bun run start` and Expo Go are enough for the other demos.
