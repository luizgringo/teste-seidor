# Ciclo do ticket

```mermaid
stateDiagram-v2
  [*] --> open
  open --> in_progress
  open --> waiting_on_customer
  open --> closed
  in_progress --> waiting_on_customer
  in_progress --> resolved
  in_progress --> closed
  waiting_on_customer --> in_progress
  waiting_on_customer --> closed
  resolved --> closed
  resolved --> in_progress
  closed --> open
```

Quem atende pode percorrer essas setas. A cliente só percorre `closed` → `open`. Toda mudança exige um motivo com pelo menos três caracteres. O motivo entra em `statusChanges` e aparece na conversa.

Pegar um ticket sem dono emite `ticket.assigned`. Se ele estava `open`, também emite `status.changed` para `in_progress`, com o motivo `Chamado assumido.`.
