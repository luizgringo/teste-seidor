# HTTP

Todas as rotas exigem o cookie, menos saúde, configuração e o início do login.

- `GET /api/health`
- `GET /api/config`
- `GET /api/session`
- `POST /api/session/persona` com `{ personaId }`
- `POST /api/session/logout`
- `GET /auth/github` e `GET /auth/github/callback`
- `POST /auth/test-session` só com `E2E_SESSION=1`
- `GET /api/workspace`
- `GET /api/team` só para `manager`
- `POST /api/tickets`
- `POST /api/tickets/:ticketId/messages`
- `POST /api/tickets/:ticketId/status`
- `POST /api/tickets/:ticketId/take`
- `POST /api/tickets/:ticketId/assign`
- `GET /ws` e `GET /api/ws`

Erro de validação responde 400. Ação fora do papel responde 403. Ticket ausente responde 404.
