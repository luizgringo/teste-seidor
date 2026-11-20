# Fila e equipe

A Marina abre `/queue`. `queueSections` separa três blocos: o que está estourado ou vence em até duas horas, o que não tem dono no grupo dela, e o resto atribuído a ela. Resolvido e fechado ficam de fora até alguém pedir.

O Ricardo abre `/team`. Cada linha tem a quantidade em aberto, quantos vencem em duas horas e os minutos da última semana em que o consultor ficou sem atribuição. O tempo ocioso sai dos intervalos em `assignments`, não de um campo solto. Paulo Neri está sem ticket de propósito, para o contraste aparecer.

Redistribuir é `POST /api/tickets/:id/assign`. Só o gestor passa dessa porta.
