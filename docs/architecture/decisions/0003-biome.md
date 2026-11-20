# ADR-0003: Biome no lugar de ESLint e Prettier

- Status: Accepted
- Data: 2026-11-20

## Contexto

O padrão anexado cita ESLint e Prettier. O projeto pediu Biome e Husky.

## Decisão

Biome formata, organiza imports e faz lint. O Husky chama `biome check --staged`. ESLint e Prettier não são instalados.

## Consequências

Um comando só no pre-commit e no CI (`biome ci`).
