# ADR-0001: SPA com BFF

- Status: Accepted
- Data: 2026-11-20

## Contexto

O console fica aberto o dia inteiro, autenticado. O login GitHub precisa de um segredo fora do bundle, e os eventos chegam por WebSocket.

## Decisão

React e Vite na interface. Hono no mesmo repositório para sessão, REST e WebSocket.

## Alternativas

Next.js colocaria o segredo no servidor, e também traria RSC para uma tela que é cliente depois do login.

## Consequências

Dois processos no desenvolvimento, unidos pelo proxy. Na Vercel os dois sobem como services do mesmo projeto.
