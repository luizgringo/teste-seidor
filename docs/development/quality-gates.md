# Quality gates

Antes de integrar: `biome ci`, `tsc -b`, `vitest run --coverage` e `playwright test`, depois `pnpm build`.

O Biome substitui ESLint e Prettier neste repositório. A decisão está no ADR 0003.
