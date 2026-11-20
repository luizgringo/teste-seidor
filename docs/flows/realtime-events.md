# Tempo real

```mermaid
sequenceDiagram
  participant Actor
  participant Store
  participant Hub
  participant OtherBrowser
  Actor->>Store: commit
  Store->>Hub: DomainEvent
  Hub->>Hub: id já enviado?
  Hub->>OtherBrowser: ClientEvent filtrado
  OtherBrowser->>OtherBrowser: reduceWorkspace
```

O mesmo `id` entregue de novo não acrescenta outra mensagem. `POST /api/test/replay` reenvia o último evento quando `E2E_SESSION=1`, e a tela continua com uma cópia só.

Na Vercel cada conexão fica na instância que a aceitou. O Redis guarda o snapshot e a lista de eventos para as outras instâncias enxergarem a mesma mudança. Sem as variáveis do Upstash, o processo usa memória, o que basta para um processo local.
