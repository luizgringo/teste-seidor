# Estado

Há quatro lugares, e cada um guarda uma coisa só.

- O rascunho da resposta fica no `useState` do compositor. Um evento que chega não zera esse texto.
- O filtro da busca fica na URL, em `q` e `done`.
- Tickets, mensagens e status ficam no cache do TanStack Query, na chave `workspace`.
- A sessão GitHub e a persona ficam num cookie `HttpOnly`. O React só recebe o que `GET /api/session` devolve.

O socket não cria um segundo cache. `reduceWorkspace` aplica o evento nesse mesmo cache e ignora um `id` que já foi visto.
