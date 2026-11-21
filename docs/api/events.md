# Eventos

Todo evento tem `id`, `type`, `occurredAt` e `payload`. O mesmo `id` pode chegar duas vezes.

| Enunciado original    | Este projeto                                                      |
| --------------------- | ----------------------------------------------------------------- |
| `chamado.aberto`      | `ticket.opened`                                                   |
| `chamado.atribuido`   | `ticket.assigned` com `ticketId` e `consultantId`                 |
| `mensagem.adicionada` | `message.added`                                                   |
|                       | `message.edited` com a mensagem já alterada                       |
|                       | `message.removed` com `messageId`, `ticketId` e `visibility`      |
| `status.alterado`     | `status.changed` com `ticketId`, `from`, `to`, `reason`, `userId` |
| `ocorrido_em`         | `occurredAt`                                                      |

O payload de `ticket.opened` que chega no navegador já é um `WireTicket`. Para a Helena, `priority` e `groupId` vêm `null`.
