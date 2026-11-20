# Northline Support

Área de tickets de um ITSM novo. Três pessoas usam o mesmo sistema com rotinas diferentes: Marina na fila, Ricardo na equipe e Helena nos próprios pedidos. A interface, as rotas e o contrato estão em inglês.

[![Node](https://img.shields.io/badge/node-24_LTS-339933)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9-f69220)](https://pnpm.io/)
[![React](https://img.shields.io/badge/react-19.3.1-149eca)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-7.0.2-3178c6)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/vite-8.3.8-646cff)](https://vite.dev/)
[![React Router](https://img.shields.io/badge/react_router-8.5.2-ca4245)](https://reactrouter.com/)
[![TanStack Query](https://img.shields.io/badge/tanstack_query-5.108.2-ff4154)](https://tanstack.com/query)
[![Zod](https://img.shields.io/badge/zod-4.6.7-3e67b1)](https://zod.dev/)
[![Hono](https://img.shields.io/badge/hono-4.13.19-e36002)](https://hono.dev/)
[![Biome](https://img.shields.io/badge/biome-2.6.8-60a5fa)](https://biomejs.dev/)
[![Playwright](https://img.shields.io/badge/playwright-1.65.1-2ead33)](https://playwright.dev/)
[![lines](https://img.shields.io/badge/coverage_lines-94.77%25-brightgreen)](docs/development/testing.md)
[![statements](https://img.shields.io/badge/coverage_statements-90.62%25-brightgreen)](docs/development/testing.md)
[![functions](https://img.shields.io/badge/coverage_functions-97.97%25-brightgreen)](docs/development/testing.md)
[![branches](https://img.shields.io/badge/coverage_branches-83.11%25-brightgreen)](docs/development/testing.md)

## O que esta fatia faz

- Abrir um ticket.
- Encontrar um ticket e ver a conversa, o status, quem atende e o prazo.
- Pegar um ticket para atender.
- Trocar mensagens públicas e notas internas.
- Mudar o status com um motivo, inclusive reabrir um ticket fechado.
- Acompanhar a carga e o tempo ocioso de um grupo de consultores.
- Refletir, na tela aberta, o que outra pessoa fez.

## Dados de exemplo

O arquivo `dados.json` deste teste estava num link do WeTransfer que já tinha expirado na hora do download. A base em `server/data/blueprint.ts` foi reconstruída a partir do contexto do enunciado: volume de um tenant, três perfis, notas internas, prazos perto de estourar e histórico de atribuição. Os instantes são relativos ao boot do servidor, então a fila de Marina continua com ticket a minutos do prazo quando o projeto é aberto outro dia. O detalhe está em [docs/data/mock-dataset.md](docs/data/mock-dataset.md).

O contrato original em português foi traduzido. O mapa está em [docs/api/events.md](docs/api/events.md).

## Pré-requisitos

- Node.js 24 LTS
- pnpm 9

## Executar

```bash
pnpm install
pnpm dev
```

`pnpm dev` sobe dois processos:

- Vite em http://localhost:5173
- API e WebSocket em http://localhost:8787

O Vite encaminha `/api`, `/auth` e `/ws` para a API. O navegador fala só com a porta 5173, e o cookie de sessão fica no mesmo endereço.

Abra http://localhost:5173/login. Neste ambiente local o GitHub ainda não está configurado. Use **Preview the desk** e escolha a persona:

| Persona         | O que a tela mostra                                                 |
| --------------- | ------------------------------------------------------------------- |
| Marina Costa    | Fila ordenada pelo prazo, com o que está prestes a estourar no topo |
| Ricardo Alves   | Carga da equipe, risco de SLA e tempo sem ticket                    |
| Helena Carvalho | Só os pedidos dela, em linguagem simples                            |

Depois do login dá para trocar a persona no menu do nome, em **Switch persona**.

## GitHub OAuth

Crie um OAuth App em GitHub → Settings → Developer settings → OAuth Apps.

- Homepage URL: `http://localhost:5173`
- Callback URL: `http://localhost:5173/auth/github/callback`

Copie `.env.example` para `.env` e preencha:

```bash
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
SESSION_SECRET=
APP_URL=http://localhost:5173
```

`.env` não entra no git. Com as duas chaves do GitHub preenchidas, o botão **Continue with GitHub** aparece. A conta GitHub autentica a pessoa. Marina, Ricardo e Helena continuam sendo uma escolha de persona, gravada na sessão do servidor.

Em produção a variável `E2E_SESSION` não existe. O botão de preview local some.

## Variáveis

| Nome                                                  | Uso                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| `SESSION_SECRET`                                      | Assina o cookie. Obrigatório na Vercel, com pelo menos 16 caracteres |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`           | Login GitHub. Ficam só no servidor                                   |
| `APP_URL`                                             | Callback do OAuth                                                    |
| `E2E_SESSION`                                         | Liga o preview local e o endpoint de teste. Não usar em produção     |
| `SIMULATOR`                                           | `on` emite respostas enquanto a tela está aberta. `off` nos testes   |
| `PORT`                                                | Porta da API. Padrão `8787`                                          |
| `SEED_VERSION`                                        | Recria o mock no Redis quando o valor muda                           |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Estado compartilhado na Vercel                                       |

## Scripts

```bash
pnpm dev            # Vite + API
pnpm build          # typecheck e build de produção
pnpm lint           # Biome
pnpm typecheck
pnpm test           # Vitest
pnpm test:coverage  # linhas, statements, functions e branches
pnpm test:e2e       # Playwright
```

## Cobertura medida

`pnpm test:coverage` em 20 de novembro de 2026, sobre domínio, schemas e o gerador do mock:

- Lines: 94.77%
- Statements: 90.62%
- Functions: 97.97%
- Branches: 83.11%

A jornada no navegador está em `tests/e2e/desk.spec.ts`. O critério do que entra na porcentagem está em [docs/development/testing.md](docs/development/testing.md).

## Endereço público

A demonstração está em https://teste-seidor-navy.vercel.app. A proteção de acesso da Vercel está desligada. O login da aplicação ainda depende de um OAuth App do GitHub: sem `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` no painel da Vercel, a tela abre e avisa que o GitHub não está configurado. O preview local não existe nesse endereço.

Quando o OAuth App existir, a callback de produção é `https://teste-seidor-navy.vercel.app/auth/github/callback`.

## Onde ler o resto

[docs/README.md](docs/README.md) aponta cada fluxo, a matriz de permissão e as decisões de arquitetura.
