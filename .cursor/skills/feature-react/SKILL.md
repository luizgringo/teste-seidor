---

name: feature-react
description: Use when adding a page, hook, API module, schema, or test to this React app.
---

# Feature slice

Add the file to the feature that owns the behavior.

- `pages` compose the screen.
- `hooks` talk to TanStack Query.
- `api` performs HTTP.
- `schemas` validate input with Zod.
- `domain` stays free of React.

Export the page from the feature only if another feature or the router needs it. Prefer composing in `src/app/router.tsx`.

Run `pnpm exec biome check --write` on the files you touched. Add a test when the change is a rule, not when it is only spacing.
