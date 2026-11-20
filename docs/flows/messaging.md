# Mensagens

Uma resposta pública usa `visibility: public`. Uma nota interna usa `internal`. A Helena não recebe a nota nem no JSON.

```mermaid
sequenceDiagram
  participant Marina
  participant Bff
  participant Store
  participant Helena
  Marina->>Bff: POST /api/tickets/:id/messages
  Bff->>Store: addMessage
  Store-->>Bff: message.added
  Bff->>Marina: socket com a mensagem
  Bff--xHelena: nota interna não sai
```

Se a mensagem é pública e o ticket é dela, o socket da Helena recebe o evento. O rascunho que ela esteja escrevendo continua no estado local do compositor.
