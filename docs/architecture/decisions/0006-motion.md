# ADR-0006: Motion para microinterações

- Status: Accepted
- Data: 2026-11-20

## Contexto

O console já tem tipografia, cor e densidade definidas: Fraunces no nome, IBM Plex Sans no texto, IBM Plex Mono nos números e prazos. Faltava resposta ao gesto: troca de chamado, hover da fila, abertura de diálogo e entrada da mesa. A pesquisa de novembro de 2026 comparou as bibliotecas estáveis para interação rica em React.

## Decisão

Usar Motion 14, o pacote `motion` (a continuação do Framer Motion), com `MotionConfig reducedMotion="user"`. A duração padrão é 0,22 s. A biblioteca anima estado da interface: entrada do painel, mensagens, cartões e linhas da equipe. Hover e clique de botão simples continuam em CSS, para não haver dois donos do mesmo elemento.

## Alternativas

- GSAP entra quando a animação é uma linha do tempo longa ou presa à rolagem. Este console não tem página de marketing.
- React Spring resolve física por hooks, e a troca de layout e a saída de um painel pedem mais código do que no Motion.
- AutoAnimate anima lista com uma linha, e não cobre diálogo, gesto nem a entrada do chamado selecionado.
- Só CSS cobre hover e fade. Não cobre a saída do painel quando o chamado muda, nem o respeito centralizado a `prefers-reduced-motion`.

## Consequências

O bundle do cliente cresce com o runtime do Motion. Quem pede menos movimento no sistema operacional vê a tela sem deslocamento. A paleta, a fonte e o espaçamento do console não mudam por causa da biblioteca.
