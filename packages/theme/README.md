# @react-brackets/theme

The optional default theme for [react-brackets](https://github.com/MohOulabi/react-brackets): one stylesheet driven by CSS variables, with light and dark built in.

```bash
npm install @react-brackets/theme
```

```ts
import '@react-brackets/theme/theme.css';
```

Override any variable to restyle it:

```css
.my-bracket {
  --rb-accent: #ea580c;
  --rb-radius: 14px;
}
```

Every rule has zero specificity and sits in the `components` cascade layer, so your own CSS and Tailwind classes always win. Add `unstyled` to a `<Bracket>` to opt one out.

[Documentation](https://github.com/MohOulabi/react-brackets) · MIT
