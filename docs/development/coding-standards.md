# Código

TypeScript `strict`, com `noUncheckedIndexedAccess`. Toda função, tipo, hook, classe e variável de produção tem TSDoc em português, verificado por `pnpm tsdoc`.

A interface usa i18next. O padrão é português do Brasil, com inglês e espanhol no seletor.

CSS Modules, com nomes de bloco, elemento e modificador. Sem utilitário Tailwind no `className`.

A regra de negócio nova entra em `domain` e ganha um teste que falha se a regra quebrar. Componente só desenha o que a capacidade já calculou.
