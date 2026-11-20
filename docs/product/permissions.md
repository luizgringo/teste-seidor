# Permissões

A mesma função `capabilitiesFor` decide o botão e a API recusa com 403 quando a ação não cabe.

- Cliente lê e escreve só nos próprios tickets, e só texto público. Reabre o que está `closed`.
- Consultor lê o grupo, pega ticket sem dono desse grupo, responde, grava nota interna e muda status.
- Gestor lê tudo, redistribui e vê `/team`.

`presentWorkspace` tira prioridade, grupo e nota interna antes de serializar a resposta da Helena. Esconder o campo só no React não basta, porque o JSON também sai.
