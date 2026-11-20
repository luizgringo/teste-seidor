# ADR-0002: Organização por feature

- Status: Accepted
- Data: 2026-11-20

## Contexto

O produto vai crescer por anos em volta de tickets, equipe e portal.

## Decisão

Código de um domínio fica na feature. `shared` não conhece feature.

## Alternativas

Feature-Sliced acrescenta camadas para um time só. Pastas globais por tipo espalham a regra de permissão.

## Consequências

A rota compõe as páginas. A permissão fica numa função pura.
