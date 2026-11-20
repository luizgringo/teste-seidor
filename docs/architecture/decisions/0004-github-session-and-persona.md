# ADR-0004: Sessão GitHub separada da persona

- Status: Accepted
- Data: 2026-11-20

## Contexto

O acesso humano é GitHub. As rotinas avaliadas são de Marina, Ricardo e Helena, que não são contas GitHub.

## Decisão

O cookie guarda o login GitHub e, depois, o `personaId`. A autorização usa a persona.

## Consequências

A mesma pessoa consegue ver as três telas. A API continua filtrando pelo papel da persona, não pelo botão.
