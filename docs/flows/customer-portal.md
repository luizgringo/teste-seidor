# Portal da cliente

A Helena não vê categoria, grupo nem prioridade. O status vira uma frase: `Waiting for someone to pick this up`, `Someone is on it`, `We need you`, `Resolved`, `Closed`.

Ao abrir um pedido, a primeira leitura guarda o horário anterior e desenha `Since your last visit` antes da primeira mensagem nova.

No formulário novo, `suggestReopen` compara as palavras do rascunho com os pedidos fechados dela. Se a sobreposição passa de 0.45, a tela oferece reabrir aquele pedido em vez de abrir outro igual.
