# ADR-0005: Mock no lugar do WeTransfer

- Status: Accepted
- Data: 2026-11-20

## Contexto

O `dados.json` do teste estava num link expirado.

## Decisão

`buildState` gera um tenant determinístico com offsets relativos ao boot.

## Consequências

O volume e as situações do enunciado existem. Os identificadores não são os do arquivo original, porque esse arquivo não pôde ser lido.
