# Arquitetura

Northline é uma SPA React. O navegador não fala com um banco. Ele fala com um BFF em Hono, no mesmo endereço, por causa do proxy do Vite. O BFF guarda o tenant, aplica as regras e publica eventos no WebSocket.

```mermaid
flowchart LR
  page [Page] --> featureHook [FeatureHook]
  featureHook --> featureApi [FeatureApi]
  featureApi --> bff [BffHono]
  wsClient [WebSocket] --> applyEvent [ApplyEvent]
  applyEvent --> cache [TanStackQuery]
  bff --> store [TicketStore]
  bff --> hub [WebSocketHub]
```

A página compõe a tela. O hook lê o TanStack Query e assina o socket. O módulo de API faz o `fetch`. A regra de quem pode ver ou mudar um ticket mora em `src/features/tickets/domain` e não importa React. O servidor chama essa mesma regra antes de gravar.

`shared` não importa feature. Uma feature não importa arquivo interno de outra. A rota, em `src/app/router.tsx`, escolhe a página da Marina, do Ricardo ou da Helena.
