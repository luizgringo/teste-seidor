# ADR-0007: Radix Themes para os controles

- Status: Accepted
- Data: 2026-11-20

## Contexto

O diálogo de status, os campos e os botões foram desenhados um a um. O painel do diálogo não tinha escala interna, o fundo disputava camada com o mastro, e os recuos iam de 8 px a 48 px sem uma sequência. O Motion já cobre o gesto da fila e do chamado. Faltava um sistema para o que a pessoa aperta.

## Decisão

Usar Radix Themes 3 nos controles: botão, campo, área de texto, seletor, diálogo, menu e aviso. O tema usa o acento teal com `--accent-9` na cor da marca (`#0f6e78`), raio largo e as fontes Fraunces, IBM Plex Sans e IBM Plex Mono. O layout da fila, do portal e da equipe continua em CSS Modules.

## Alternativas

- shadcn/ui, Aceternity UI e Magic UI entregam o controle em Tailwind. Este repositório não coloca utilitário Tailwind no `className`.
- Mantine também padroniza modal e espaço, e substitui a paleta e o tipo que a mesa já tem.
- Seguir só com CSS Modules deixava cada tela inventar o próprio recuo. O diálogo quebrado veio desse caminho.

## Consequências

O diálogo abre com foco, camada e rolagem próprios, e fecha ao salvar. O Motion permanece na entrada do chamado, na fila, nas personas e na equipe. Quem pede menos movimento continua atendido pelo Motion e pelas animações curtas do tema.
