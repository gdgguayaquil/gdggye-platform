# @gdggye/config

Shared configuration consumed by every workspace in `gdggye-platform`.

## What lives here

| File                 | Purpose                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| `tsconfig.base.json` | Strict TS base. Every other `tsconfig.json` extends it.                   |
| `eslint/base.mjs`    | ESLint flat-config base. Apps add framework-specific presets on top.      |
| `prettier/index.js`  | Prettier config (referenced from root `package.json`).                    |
| `tailwind/preset.js` | Tailwind preset placeholder. Filled in by Step 3 once design tokens land. |

## Consuming it

```jsonc
// tsconfig.json in any workspace
{ "extends": "@gdggye/config/tsconfig.base.json" }
```

```js
// tailwind.config.js in any app
module.exports = { presets: [require("@gdggye/config/tailwind/preset")] };
```

This package emits no JS — it's pure config.
