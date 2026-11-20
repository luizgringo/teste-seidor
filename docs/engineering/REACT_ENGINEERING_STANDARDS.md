# React Engineering Standards

**Padrão de arquitetura, desenvolvimento, qualidade, testes e documentação**  
**Status:** baseline recomendado para novos projetos  
**Última revisão das referências:** 20 de novembro de 2026

> Este documento define convenções de engenharia para aplicações React com TypeScript. Os números de LOC e cobertura são _guard rails_ adotados pelo projeto: são parâmetros de governança e não leis universais da engenharia de software. Exceções devem ser justificadas, revisadas e registradas.

---

## Índice

1. [Objetivos e princípios](#1-objetivos-e-princípios)
2. [Decisão de stack](#2-decisão-de-stack)
3. [Arquitetura e estrutura de diretórios](#3-arquitetura-e-estrutura-de-diretórios)
4. [Regras de dependência entre camadas](#4-regras-de-dependência-entre-camadas)
5. [Nomenclatura](#5-nomenclatura)
6. [Componentes, Hooks e composição](#6-componentes-hooks-e-composição)
7. [Gerenciamento de estado](#7-gerenciamento-de-estado)
8. [Integração com APIs e validação](#8-integração-com-apis-e-validação)
9. [Estilos e acessibilidade](#9-estilos-e-acessibilidade)
10. [Política de LOC e complexidade](#10-política-de-loc-e-complexidade)
11. [Estratégia e cobertura de testes](#11-estratégia-e-cobertura-de-testes)
12. [Qualidade estática, segurança e desempenho](#12-qualidade-estática-segurança-e-desempenho)
13. [Documentação e ADRs](#13-documentação-e-adrs)
14. [Git, commits, Pull Requests e CI/CD](#14-git-commits-pull-requests-e-cicd)
15. [Bootstrap de um projeto](#15-bootstrap-de-um-projeto)
16. [Definition of Done](#16-definition-of-done)
17. [Governança e evolução deste padrão](#17-governança-e-evolução-deste-padrão)
18. [Referências, autores e leituras](#18-referências-autores-e-leituras)

---

## 1. Objetivos e princípios

O objetivo é manter o código **compreensível, modular, testável, seguro e sustentável**, tanto em projetos pequenos quanto em aplicações corporativas que evoluem por vários anos.

### 1.1 Princípios obrigatórios

1. **Separação de responsabilidades:** cada camada possui uma função clara e não deve absorver responsabilidades de outra camada.
2. **Organização por funcionalidade:** o código de um domínio de negócio deve ficar agrupado em sua feature sempre que possível.
3. **Dependências explícitas:** módulos dependem de contratos públicos, não de detalhes internos de outras features.
4. **Estado mínimo:** armazenar somente o estado necessário; derivar valores calculáveis.
5. **Validação nas fronteiras:** validar dados recebidos de APIs, URL, storage e outras fontes externas.
6. **Testes orientados ao comportamento:** verificar resultados e interações relevantes, evitando acoplamento a detalhes de implementação.
7. **Complexidade controlada:** acompanhar LOC, complexidade de fluxo e responsabilidades, sem transformar métricas em objetivos artificiais.
8. **Documentação útil e versionada:** documentar como executar, como contribuir e por que decisões arquiteturais foram tomadas.
9. **Automação:** lint, typecheck, testes, cobertura e build devem ser executados no fluxo de integração contínua.
10. **Evolução incremental:** adicionar pastas, dependências e abstrações quando houver necessidade real, não por antecipação.

### 1.2 O que é política e o que é recomendação

- **Política:** regra que deve ser atendida para integrar código, salvo exceção aprovada.
- **Meta:** alvo de qualidade esperado, acompanhado por métricas.
- **Heurística:** sinal para revisão humana; não prova, isoladamente, que o código está ruim.
- **Sugestão:** prática recomendada que pode ser adaptada ao contexto.

Os limites numéricos deste documento são uma baseline interna. Devem ser recalibrados com dados do próprio projeto após alguns ciclos de desenvolvimento.

---

## 2. Decisão de stack

### 2.1 Escolha do modelo de aplicação

A documentação oficial do React recomenda começar aplicações novas com um framework. Construir a aplicação do zero com uma ferramenta como Vite continua sendo uma opção válida quando o projeto precisa de uma SPA/client-side app controlada pela equipe, quando há restrições específicas ou quando se deseja compor explicitamente as ferramentas.

| Cenário                                                              | Direção recomendada                                                                 |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Dashboard interno, SPA autenticada, ferramenta administrativa        | React + TypeScript + Vite pode ser uma boa escolha                                  |
| Site público com SEO, renderização no servidor ou conteúdo indexável | Avaliar framework React com SSR/SSG, como Next.js ou React Router em Framework Mode |
| Produto full-stack com rotas e operações servidoras integradas       | Avaliar framework full-stack antes de montar uma SPA manualmente                    |
| Aplicativo mobile                                                    | React Native, normalmente com Expo                                                  |

A decisão de Vite neste padrão pressupõe uma aplicação web client-side. Registrar a escolha e suas consequências em um ADR.

### 2.2 Stack de referência

| Responsabilidade              | Tecnologia de referência                       | Quando utilizar                                                                |
| ----------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| UI                            | React                                          | Base de interface                                                              |
| Linguagem                     | TypeScript                                     | Para aplicações profissionais, usar modo `strict`                              |
| Build e dev server            | Vite                                           | Quando a escolha for SPA/client-side                                           |
| Rotas                         | React Router                                   | Escolher o modo apropriado: Declarative, Data ou Framework                     |
| Estado remoto/cache           | TanStack Query                                 | Quando houver dados remotos com cache, invalidação e revalidação               |
| Estado global do cliente      | Zustand                                        | Somente quando o estado precisar ser compartilhado fora de uma subárvore local |
| Validação runtime             | Zod                                            | Nas fronteiras de dados e formulários relevantes                               |
| Testes unitários e integração | Vitest + React Testing Library                 | Padrão para lógica e interface React                                           |
| Testes E2E                    | Playwright                                     | Fluxos críticos do usuário                                                     |
| Lint                          | ESLint + typescript-eslint                     | Erros, regras de React e consistência                                          |
| Formatação                    | Prettier                                       | Formatação automática e uniforme                                               |
| Documentação visual de UI     | Storybook                                      | Opcional; recomendado para design systems e bibliotecas de componentes         |
| Qualidade e métricas          | SonarQube/SonarCloud ou ferramenta equivalente | Opcional; útil para governança, dívida técnica e cobertura de código novo      |

**Não instalar toda a stack automaticamente.** Cada dependência deve resolver uma necessidade concreta. React Context pode ser suficiente para estado compartilhado limitado; Zustand não é obrigatório. TanStack Query é útil para estado do servidor, mas pode ser desnecessário em uma aplicação sem dados remotos relevantes.

### 2.3 Dependências e versões

- Usar versões estáveis e compatíveis entre si no momento da criação do projeto.
- Manter o lockfile versionado (`package-lock.json`, `pnpm-lock.yaml` ou equivalente).
- Preferir atualizações regulares e pequenas a grandes saltos acumulados.
- Revisar changelogs e guias de migração antes de atualizar dependências centrais.
- Evitar bibliotecas que dupliquem capacidades já cobertas pela stack.

---

## 3. Arquitetura e estrutura de diretórios

### 3.1 Organização por funcionalidades

Adotar **Feature-Based Architecture** combinada com uma camada compartilhada.

A feature concentra os arquivos relacionados a um domínio funcional. A pasta `shared` contém recursos genéricos, sem regras específicas de uma feature.

Estrutura de referência:

```text
project/
├── public/
├── docs/
│   ├── architecture/
│   │   ├── overview.md
│   │   ├── folder-structure.md
│   │   ├── state-management.md
│   │   ├── testing-strategy.md
│   │   └── decisions/
│   │       ├── 0001-frontend-stack.md
│   │       ├── 0002-feature-based-architecture.md
│   │       └── 0003-state-management.md
│   ├── development/
│   │   ├── coding-standards.md
│   │   ├── git-workflow.md
│   │   └── quality-gates.md
│   └── api/
├── src/
│   ├── app/
│   │   ├── providers/
│   │   │   ├── AppProviders.tsx
│   │   │   └── QueryProvider.tsx
│   │   ├── router/
│   │   │   └── router.tsx
│   │   ├── layouts/
│   │   │   ├── MainLayout.tsx
│   │   │   └── AuthLayout.tsx
│   │   └── App.tsx
│   ├── features/
│   │   ├── authentication/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── domain/          # regras puras da feature, quando existirem
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   ├── schemas/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── users/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   ├── schemas/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   └── products/
│   │       ├── api/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── pages/
│   │       ├── schemas/
│   │       ├── types/
│   │       ├── utils/
│   │       └── index.ts
│   ├── shared/
│   │   ├── ui/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   └── Table/
│   │   ├── api/
│   │   │   └── httpClient.ts
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── lib/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── config/
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   ├── styles/
│   │   ├── globals.css
│   │   ├── tokens.css
│   │   └── typography.css
│   ├── test/
│   │   └── setup.ts
│   └── main.tsx
├── tests/
│   └── e2e/
├── .github/
│   ├── workflows/
│   └── pull_request_template.md
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── eslint.config.js
├── tsconfig.json
├── vite.config.ts
├── package.json
├── README.md
├── CONTRIBUTING.md
└── CHANGELOG.md
```

A estrutura é um ponto de partida. Não criar diretórios vazios por antecipação; introduzir cada pasta quando houver arquivos com aquela responsabilidade.

### 3.2 Responsabilidade de cada camada

| Camada                           | Responsabilidade                                                                          | Não deve fazer                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `app/`                           | Inicialização, providers, composição de layouts e configuração de rotas                   | Conter regras específicas de domínio ou detalhes internos de features                                              |
| `features/<feature>/pages/`      | Compor a tela, conectar Hooks e componentes e tratar estados de página                    | Concentrar lógica de negócio complexa ou implementar chamadas HTTP diretamente                                     |
| `features/<feature>/components/` | Renderizar JSX, receber props, emitir eventos e compor UI da feature                      | Implementar transporte HTTP ou regras de negócio complexas                                                         |
| `features/<feature>/hooks/`      | Orquestrar estado da interface, efeitos, validação de fluxo e uso de queries              | Renderizar JSX, conhecer CSS ou implementar o transporte HTTP                                                      |
| `features/<feature>/api/`        | Declarar operações remotas da feature e adaptar contratos de API                          | Importar componentes React ou estilos                                                                              |
| `features/<feature>/domain/`     | Regras puras do domínio necessárias à experiência do cliente, cálculos e políticas locais | Conhecer React, CSS, DOM ou detalhes de transporte HTTP; o backend continua sendo a autoridade das regras críticas |
| `features/<feature>/schemas/`    | Validar dados em runtime                                                                  | Conter lógica de apresentação                                                                                      |
| `features/<feature>/types/`      | Definir tipos, DTOs e contratos TypeScript                                                | Conter lógica executável                                                                                           |
| `features/<feature>/utils/`      | Transformações e funções puras específicas da feature                                     | Gerenciar estado React ou acessar diretamente o DOM                                                                |
| `shared/ui/`                     | Componentes visuais genéricos e reutilizáveis                                             | Conhecer regras de negócio de uma feature                                                                          |
| `shared/api/`                    | Cliente HTTP e infraestrutura compartilhada de comunicação                                | Conhecer componentes ou páginas                                                                                    |
| `shared/hooks/`                  | Hooks realmente genéricos                                                                 | Conhecer regras exclusivas de uma feature                                                                          |
| `shared/stores/`                 | Estado global do cliente, quando necessário                                               | Duplicar cache de dados remotos sem justificativa                                                                  |
| `shared/utils/`                  | Funções puras e independentes de domínio                                                  | Conter estado ou dependências de componentes React                                                                 |
| `styles/`                        | Estilos globais e tokens                                                                  | Conter lógica de negócio                                                                                           |

### 3.3 API pública de uma feature

Cada feature deve expor somente o necessário por seu `index.ts`:

```ts
// features/users/index.ts
export { UsersPage } from './pages/UsersPage'
export { UserCard } from './components/UserCard'
export type { User } from './types/user.types'
```

Uso externo:

```tsx
import { UsersPage } from '@/features/users'
```

Evitar importar detalhes internos de outra feature:

```tsx
// Evitar fora da própria feature:
import { UserCard } from '@/features/users/components/UserCard'
```

O `index.ts` representa uma fronteira pública, não uma obrigação de reexportar todos os arquivos do módulo.

---

## 4. Regras de dependência entre camadas

### 4.1 Direção de dependência

A regra central é: **camadas genéricas não dependem de camadas específicas**.

```text
app
 └── features (por interfaces públicas)
       ├── components
       ├── hooks
       ├── api
       ├── schemas / types / utils
       └── shared

shared não depende de app nem de features.
```

Regras:

1. `shared` não importa `features` nem `app`.
2. Uma feature não importa arquivos internos de outra feature.
3. Quando uma feature precisar de informação de outra, preferir composição em `app`/página ou um contrato compartilhado bem definido.
4. `app` pode compor features por suas APIs públicas.
5. Evitar dependências circulares.
6. Não criar um `shared` genérico para esconder código de domínio. Se a regra pertence a uma feature, ela fica nessa feature.
7. Se várias features realmente compartilham a mesma regra de domínio, documentar a extração e definir seu proprietário.

### 4.2 Organização por feature versus organização por tipo

Evitar uma estrutura global em que todos os componentes, Hooks e serviços de todos os domínios ficam misturados em grandes diretórios técnicos. A organização por feature reduz a dispersão de arquivos relacionados e torna mais explícita a fronteira funcional.

---

## 5. Nomenclatura

| Elemento             | Convenção                                   | Exemplo                |
| -------------------- | ------------------------------------------- | ---------------------- |
| Componentes React    | PascalCase                                  | `UserProfile.tsx`      |
| Páginas              | PascalCase + `Page`                         | `UsersPage.tsx`        |
| Layouts              | PascalCase + `Layout`                       | `MainLayout.tsx`       |
| Hooks                | camelCase começando com `use`               | `useUsers.ts`          |
| Funções              | camelCase                                   | `calculateTotalPrice`  |
| Variáveis            | camelCase                                   | `activeUsers`          |
| Constantes globais   | UPPER_SNAKE_CASE                            | `API_BASE_URL`         |
| Types e interfaces   | PascalCase                                  | `User`, `UserResponse` |
| Props                | PascalCase + `Props`                        | `UserCardProps`        |
| Serviços/API         | camelCase                                   | `users.api.ts`         |
| Schemas              | camelCase + `.schema`                       | `user.schema.ts`       |
| Testes               | nome do arquivo + `.test`                   | `UserCard.test.tsx`    |
| Pastas               | kebab-case ou nome de feature em kebab-case | `user-management/`     |
| Rotas/URLs           | kebab-case                                  | `/user-management`     |
| Arquivos CSS Modules | nome do componente + `.module.css`          | `UserCard.module.css`  |

### 5.1 Regras adicionais

- Usar nomes semânticos; evitar `data`, `item`, `temp`, `foo`, `Component1` quando não expressarem intenção.
- Booleanos: `isActive`, `hasPermission`, `canEdit`.
- Handlers internos: `handleSubmit`, `handleClick`.
- Callbacks expostos por props: `onSubmit`, `onChange`.
- Operações de domínio: `createOrder`, `updateProfile`, `calculateDiscount`.
- Não usar prefixos redundantes como `IUser` ou `TUser`.
- Evitar `any`; preferir tipos explícitos ou `unknown` na fronteira de dados desconhecidos.
- Preferir union types para conjuntos simples de valores literais; usar enum quando houver benefício concreto.

### 5.2 BEM e Tailwind

Escolher uma estratégia principal de estilos por projeto:

- **CSS Modules + BEM:** utilizar classes semânticas como `.user-card`, `.user-card__title` e `.user-card--active` (variante de modificador com dois hífens) quando o projeto optar por CSS tradicional.
- **Tailwind CSS:** utilizar classes utilitárias; não tentar reproduzir artificialmente a nomenclatura BEM em cada classe utilitária.

Não misturar Tailwind e CSS Modules sem uma razão documentada. A convenção BEM e a convenção de nomes de arquivos React resolvem problemas diferentes.

---

## 6. Componentes, Hooks e composição

### 6.1 Responsabilidade única e composição

Um componente deve ter uma responsabilidade predominante e uma interface de props previsível. Não concentrar no mesmo componente renderização, chamadas HTTP, regras de negócio, validação de formulário, transformação de dados e controle de fluxo complexo.

Exemplo:

```tsx
import type { User } from '../types/user.types'

type UserProfileProps = {
  user: User
  onEdit: () => void
}

export function UserProfile({ user, onEdit }: UserProfileProps) {
  return (
    <section>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button type="button" onClick={onEdit}>
        Edit profile
      </button>
    </section>
  )
}
```

### 6.2 Componentes controlados

Quando o estado precisa ser compartilhado ou coordenado por um componente pai, preferir componentes controlados:

```tsx
type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  )
}
```

### 6.3 Custom Hooks

Extrair um Hook quando houver lógica stateful reutilizável ou sincronização com um sistema externo. Não criar Hooks apenas para mover poucas linhas de código sem melhorar a compreensão.

Exemplo:

```tsx
import { useMemo, useState } from 'react'

export function useUserFilters(users: User[]) {
  const [search, setSearch] = useState('')

  const filteredUsers = useMemo(
    () => users.filter((user) => user.name.toLowerCase().includes(search.toLowerCase())),
    [users, search],
  )

  return { search, setSearch, filteredUsers }
}
```

### 6.4 Regras do React

- Hooks devem ser chamados no nível superior de componentes ou Hooks personalizados, seguindo as Rules of Hooks.
- Componentes e Hooks devem manter renderização pura e não mutar props ou state.
- Usar keys estáveis em listas; não usar índice como key quando a lista puder mudar de ordem ou conteúdo.
- Preferir composição a componentes com muitas flags e combinações de comportamento.
- Não usar `useEffect` para calcular dados que podem ser derivados durante a renderização.
- Utilizar `useEffect` para sincronizar React com sistemas externos, como subscriptions, APIs imperativas e listeners, incluindo limpeza quando necessário.
- Não adicionar `useMemo`, `useCallback` e `React.memo` indiscriminadamente. Medir primeiro e otimizar gargalos reais.

---

## 7. Gerenciamento de estado

Separar os tipos de estado e escolher a ferramenta de acordo com sua natureza.

| Tipo de estado                 | Exemplos                                                  | Abordagem                         |
| ------------------------------ | --------------------------------------------------------- | --------------------------------- |
| Local de UI                    | Modal aberto, campo de formulário, aba selecionada        | `useState` / `useReducer`         |
| Compartilhado em uma subárvore | Tema, contexto de sessão, configuração de fluxo           | React Context quando suficiente   |
| Global do cliente              | Preferências e estado compartilhado entre áreas distantes | Zustand, quando necessário        |
| Estado remoto/servidor         | Usuários, pedidos, produtos, resultados de API            | TanStack Query, quando necessário |
| Estado navegável               | Filtros, ordenação, paginação, pesquisa compartilhável    | URL / Search Params               |

### 7.1 Regras

1. Manter uma única fonte de verdade sempre que possível.
2. Não armazenar valores que possam ser calculados a partir de props ou de outro estado.
3. Não duplicar o cache do TanStack Query em Zustand sem uma razão explícita.
4. Manter stores pequenos e orientados a responsabilidades.
5. Utilizar estado local sempre que o dado pertencer a um único componente.
6. Utilizar parâmetros de URL para estado que deve sobreviver a refresh, ser compartilhável ou participar da navegação.
7. A autorização deve ser garantida pelo backend; esconder botões na interface não protege recursos.

Exemplo de Zustand, somente quando houver estado global de cliente:

```tsx
import { create } from 'zustand'

type PreferencesState = {
  compactMode: boolean
  setCompactMode: (value: boolean) => void
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  compactMode: false,
  setCompactMode: (compactMode) => set({ compactMode }),
}))
```

---

## 8. Integração com APIs e validação

### 8.1 Fluxo recomendado

```text
React component / page
        ↓
Feature hook (query / mutation)
        ↓
Feature API module
        ↓
Shared HTTP client
        ↓
Backend API / external service
```

O componente não deve implementar `fetch` ou conhecer detalhes de endpoints. A página compõe a feature; o Hook trata estado assíncrono/cache; o módulo `api` executa a operação remota.

### 8.2 Cliente HTTP compartilhado

Manter configuração comum em `shared/api/httpClient.ts` ou equivalente:

- base URL;
- headers comuns;
- autenticação conforme a estratégia de sessão;
- timeout;
- cancelamento por `AbortSignal`;
- tratamento padronizado de erros;
- serialização/deserialização;
- observabilidade sem registrar dados sensíveis.

### 8.3 Validar dados externos

TypeScript não valida dados em runtime. Validar respostas externas quando a integridade do contrato for relevante, especialmente em integrações de terceiros, dados não confiáveis ou sistemas com contratos instáveis.

```tsx
import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  isActive: z.boolean(),
})

export type User = z.infer<typeof userSchema>
```

Evitar duplicar manualmente schemas e tipos quando um puder ser inferido do outro. A validação no frontend melhora a experiência e a robustez, mas não substitui a validação e autorização no backend.

---

## 9. Estilos e acessibilidade

### 9.1 Estilos

- Definir tokens para cores, espaçamentos, tipografia, bordas e breakpoints.
- Manter estilos globais em `src/styles/`.
- Manter CSS Modules junto ao componente correspondente quando adotados.
- Evitar seletores globais frágeis e dependência de estrutura profunda do DOM.
- Não misturar lógica de domínio nos estilos.
- Tratar estados de hover, focus, disabled, loading e erro de forma consistente.

### 9.2 Acessibilidade

Acessibilidade deve ser critério de desenvolvimento, não uma etapa tardia. Usar WCAG 2.2 como referência:

- HTML semântico;
- navegação por teclado;
- foco visível e ordem lógica;
- labels e nomes acessíveis para controles;
- mensagens de erro associadas aos campos;
- contraste adequado;
- textos alternativos para imagens informativas;
- modais com gerenciamento correto de foco;
- não depender exclusivamente de cor para transmitir informação.

Usar elementos nativos (`button`, `a`, `label`, `input`, `nav`, `main`, etc.) sempre que possível. Não substituir controles semânticos por `div` clicável.

---

## 10. Política de LOC e complexidade

### 10.1 Objetivo

Controlar tamanho e complexidade para evitar componentes difíceis de ler, arquivos que acumulam responsabilidades e funções que concentram muitos caminhos de execução.

**LOC não é meta de produtividade.** Reduzir o número de linhas artificialmente, fragmentando código em arquivos minúsculos ou criando abstrações desnecessárias, não é melhoria arquitetural.

### 10.2 Faixas oficiais de LOC

Adotar exatamente os seguintes limites como baseline do projeto:

| Tipo de arquivo              | Faixa saudável | Limite de alerta | Limite máximo |
| ---------------------------- | -------------: | ---------------: | ------------: |
| Componente UI pequeno        |     30–100 LOC |          150 LOC |       200 LOC |
| Página, tela ou container    |    100–200 LOC |          250 LOC |       300 LOC |
| Hook de feature              |     50–150 LOC |          200 LOC |       250 LOC |
| Service/API                  |     50–200 LOC |          250 LOC |       300 LOC |
| Tipos, constantes ou helpers |     30–150 LOC |          200 LOC |       250 LOC |

A faixa saudável é uma referência de tamanho típico, **não um mínimo obrigatório**. Um componente de 12 linhas pode estar perfeitamente adequado; não adicionar linhas apenas para alcançar a faixa.

### 10.3 Como contar LOC

Para esta política, LOC significa linhas físicas de código-fonte não vazias e não compostas exclusivamente por comentários.

- Contar linhas de TypeScript, JavaScript e JSX/TSX que contenham código ou markup.
- Ignorar linhas vazias.
- Ignorar linhas compostas exclusivamente por comentários.
- Não ignorar linhas de código apenas porque contêm comentário inline.
- Não contar arquivos gerados, bundles, artefatos de build ou dependências em `node_modules`.
- Manter testes fora do indicador de LOC de produção; testes continuam sujeitos a revisão de legibilidade e manutenção.
- Arquivos CSS, documentação, configuração e stories devem ser acompanhados nas ferramentas próprias; a tabela acima não define limite numérico para essas categorias.

A contagem deve ser feita de forma consistente em CI e localmente. ESLint `max-lines` com `skipBlankLines` e `skipComments` pode aplicar os limites máximos nos arquivos TS/TSX. Relatório por diretório/camada deve complementar a regra.

### 10.4 Classificação por camada

| Diretório/tipo                                              | Categoria LOC                                                                                         |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `components/`                                               | Componente UI pequeno                                                                                 |
| `pages/`                                                    | Página, tela ou container                                                                             |
| `hooks/`                                                    | Hook de feature                                                                                       |
| `api/` ou `services/`                                       | Service/API                                                                                           |
| `domain/` (funções puras), `types/`, `constants/`, `utils/` | Tipos, constantes ou helpers para fins de LOC; regras de domínio mantêm a meta de cobertura mais alta |

Regras adicionais:

1. Cada arquivo é contabilizado em uma única categoria.
2. Não utilizar média da feature para justificar um arquivo acima do limite.
3. Não misturar código de apresentação, acesso a dados e regras de negócio no mesmo arquivo.
4. Arquivos `schemas/` são classificados na categoria “Tipos, constantes ou helpers” para LOC; continuam sujeitos à meta de cobertura de schemas. Funções puras em `domain/` usam a mesma faixa de LOC, mas permanecem sujeitas à meta de cobertura de Business/Domain Logic.
5. A soma de LOC por camada é útil para observar concentração e crescimento, mas não deve gerar uma quota fixa de linhas por feature.

### 10.5 Níveis de ação

- **Dentro da faixa saudável:** nenhuma ação específica, desde que a responsabilidade esteja clara.
- **Acima da faixa saudável, antes do alerta:** revisar durante code review se o arquivo continua coeso.
- **No limite de alerta ou acima dele:** revisar oportunidades de extração, composição e simplificação; registrar justificativa se a manutenção do tamanho for intencional.
- **Acima do limite máximo:** refatorar antes de integrar, salvo exceção técnica formal, aprovada por responsável técnico e registrada no Pull Request/ADR quando relevante.

### 10.6 Métricas complementares

LOC não mede sozinho a dificuldade de compreensão. Acompanhar também:

| Métrica                             |       Referência inicial | Ação                                                    |
| ----------------------------------- | -----------------------: | ------------------------------------------------------- |
| Complexidade ciclomática por função |                   Até 10 | Acima de 10 exige revisão                               |
| Aninhamento de blocos               |             Até 3 níveis | Acima de 3 exige revisão                                |
| Parâmetros por função               |                    Até 3 | Acima de 3 avaliar objeto de parâmetros ou decomposição |
| Linhas por função                   | Preferencialmente até 50 | Acima de 50 revisar coesão e extração                   |

Esses valores são heurísticas internas, não leis universais. Complexidade cognitiva (por exemplo, a métrica da Sonar) pode complementar a complexidade ciclomática, especialmente para condicionais e fluxo de controle difíceis de acompanhar.

### 10.7 Exemplo de refatoração

Evitar uma página que concentra busca, carregamento, filtragem, paginação, validação, API, modal e tabela. Distribuir as responsabilidades:

```text
features/users/
├── api/
│   └── users.api.ts
├── domain/
│   └── calculateUserEligibility.ts
├── components/
│   ├── UserFilters.tsx
│   ├── UserTable.tsx
│   └── UserModal.tsx
├── hooks/
│   ├── useUsers.ts
│   ├── useUserFilters.ts
│   └── useUserPagination.ts
├── pages/
│   └── UsersPage.tsx
├── schemas/
│   └── user.schema.ts
└── types/
    └── user.types.ts
```

A extração deve melhorar coesão, isolamento ou testabilidade. Não dividir arquivos somente para reduzir o número de linhas.

---

## 11. Estratégia e cobertura de testes

### 11.1 Objetivo e filosofia

A cobertura é um indicador de áreas executadas pelos testes, não uma medida completa da qualidade deles. Uma linha coberta pode não ter uma asserção significativa. Usar cobertura junto com análise de risco, revisão dos casos não cobertos, testes de integração e, em áreas críticas, mutation testing.

Priorizar o que pode causar impacto real: regras de negócio, autorização, cálculos, transformações, contratos, falhas de integração e jornadas críticas.

### 11.2 Ferramentas

| Tipo                         | Ferramenta                                | Uso                                                                |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| Unitário                     | Vitest                                    | Funções puras, utilitários, regras de domínio                      |
| Componentes/integração React | React Testing Library + Vitest            | Interações observáveis na interface e colaboração entre módulos    |
| E2E                          | Playwright                                | Jornadas críticas no navegador                                     |
| Mutation testing             | StrykerJS                                 | Verificar se testes detectam alterações deliberadamente incorretas |
| Cobertura e Quality Gate     | Vitest + SonarQube/Codecov ou equivalente | Relatórios globais e cobertura de código novo                      |

### 11.3 Cobertura global mínima

Adotar os seguintes limites globais no relatório consolidado:

| Métrica    | Mínimo global | Meta desejada |
| ---------- | ------------: | ------------: |
| Lines      |           80% |        85–90% |
| Statements |           80% |        85–90% |
| Functions  |           80% |        85–90% |
| Branches   |           70% |        75–80% |

Como referência externa, o artigo do Google Testing Blog apresenta 60% como aceitável, 75% como recomendável e 90% como exemplar, mas ressalta que não existe número ideal universal. A baseline de 80/80/80/70 deste projeto é uma escolha interna mais exigente que o patamar de entrada apresentado naquele artigo, calibrada para equilibrar proteção e custo de manutenção.

### 11.4 Cobertura por camada

As metas por camada evitam que uma média global esconda módulos de alto risco sem testes.

| Camada                  | Lines / Statements / Functions |          Branches | Estratégia                                             |
| ----------------------- | -----------------------------: | ----------------: | ------------------------------------------------------ |
| Components UI           |              Sem mínimo rígido | Sem mínimo rígido | Testar comportamento essencial e interações relevantes |
| Pages / Containers      |                            70% |               60% | Testar estados, composição e caminhos principais       |
| Hooks                   |                            80% |               70% | Testar estados, transições e efeitos relevantes        |
| Services / API          |                            85% |               80% | Testar contratos, transformação, respostas e falhas    |
| Business / Domain Logic |                            90% |               85% | Testar regras, condições, exceções e limites           |
| Utils / Helpers         |                            85% |               80% | Testar entradas, saídas e casos extremos               |
| Schemas                 |                            90% |               85% | Testar dados válidos, inválidos e limites de validação |

Para UI, não exigir teste individual de cada elemento puramente visual. Formulários, modais, tabelas interativas, navegação, permissões visíveis e componentes com estados devem ter testes comportamentais apropriados.

Os percentuais por camada são critérios internos propostos. O time deve revisar sua aplicabilidade com base no risco do módulo, sem reduzir a cobertura de código crítico para cumprir uma média.

### 11.5 Cobertura de código novo

Adotar como Quality Gate para código novo ou alterado:

| Métrica de código novo | Mínimo recomendado |
| ---------------------- | -----------------: |
| Lines                  |                85% |
| Statements             |                85% |
| Functions              |                85% |
| Branches               |                75% |

Regras críticas novas devem buscar 90% ou mais de Lines/Statements/Functions e testar todos os caminhos de negócio relevantes; branches podem exigir 85% ou mais conforme risco.

A cobertura de código novo deve ser calculada pelo recurso de _new code_ ou _diff/patch coverage_ da ferramenta adotada (por exemplo, SonarQube ou Codecov). Vitest gera o relatório de cobertura; o cálculo de cobertura sobre o diff precisa ser configurado na ferramenta de CI correspondente. Não presumir que `thresholds` do Vitest, isoladamente, definem cobertura de código novo.

Para sistemas legados abaixo da meta global, estabelecer melhoria incremental: não permitir que novo código piore a cobertura do diff e criar um plano gradual para aumentar a cobertura global.

### 11.6 Distribuição da suíte: pirâmide de testes

Como orientação de planejamento, utilizar aproximadamente:

| Tipo       |  Proporção de referência |
| ---------- | -----------------------: |
| Unitários  | 60–70% (referência: 65%) |
| Integração | 20–30% (referência: 25%) |
| E2E        |  5–10% (referência: 10%) |

Esses percentuais representam a quantidade aproximada de testes, não a cobertura de LOC, e **não devem ser Quality Gate rígido**. A distribuição real depende da arquitetura e dos riscos. Preferir testes rápidos e focados nos níveis inferiores, adicionando E2E quando ele oferece confiança adicional sobre a jornada do usuário.

Em React, um teste que renderiza vários componentes e verifica interações pode ser classificado como integração, ainda que execute no Vitest e use React Testing Library. Classificar pelo escopo do comportamento, não somente pela ferramenta.

### 11.7 Casos a cobrir

| Camada/elemento | Cenários essenciais                                                                      |
| --------------- | ---------------------------------------------------------------------------------------- |
| Utils           | Entradas válidas, inválidas, limites e casos extremos                                    |
| Business logic  | Regras, combinações, exceções, limites e permissões                                      |
| Schemas         | Dados válidos, inválidos, opcionais e limites                                            |
| Services/API    | Sucesso, erro HTTP, timeout, cancelamento, payload inválido e transformação              |
| Hooks           | Estado inicial, transições, loading, erro, atualização e cleanup                         |
| Components      | Renderização útil, interação, disabled, validação, acessibilidade e callbacks            |
| Pages           | Loading, erro, vazio, conteúdo e integração dos componentes                              |
| E2E             | Login, fluxos críticos do negócio, navegação, submissão e cenários de falha prioritários |

### 11.8 Qualidade dos testes

Cada teste deve:

1. Ter nome que expresse o comportamento esperado.
2. Verificar resultado observável com assertions relevantes.
3. Cobrir cenários positivos, negativos e de borda conforme o risco.
4. Ser independente e determinístico.
5. Não depender da ordem de execução.
6. Evitar mocks excessivos; mockar principalmente fronteiras externas e dependências difíceis de controlar.
7. Evitar testar detalhes internos de implementação quando o comportamento público é suficiente.
8. Usar Arrange-Act-Assert ou Given-When-Then quando isso melhorar a leitura.
9. Limpar recursos e subscriptions quando aplicável.
10. Não criar testes de baixo valor somente para aumentar a porcentagem.

### 11.9 Mutation testing

Mutation testing introduz alterações deliberadas no código e executa os testes. Se os testes continuarem passando, a mutação sobreviveu e pode revelar uma lacuna.

Política sugerida:

- Executar prioritariamente em regras de negócio críticas e módulos de alto risco.
- Meta inicial: mutation score de 70% nas áreas críticas, evoluindo conforme a maturidade.
- Investigar mutações sobreviventes relevantes; mutações equivalentes ou não executáveis podem exigir análise e exclusão documentada.
- Não exigir mutation testing em cada componente visual simples ou em todo commit se o custo for desproporcional.

Mutation score não é sinônimo de cobertura de linhas: são métricas complementares.

### 11.10 Configuração de referência do Vitest

Instalar o provider V8 correspondente à versão do Vitest utilizada. Exemplo ilustrativo de `vite.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.d.ts',
        'src/test/**',
        'src/main.tsx',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,
        'src/features/**/api/**/*.{ts,tsx}': {
          lines: 85,
          statements: 85,
          functions: 85,
          branches: 80,
          perFile: true,
        },
        'src/features/**/hooks/**/*.{ts,tsx}': {
          lines: 80,
          statements: 80,
          functions: 80,
          branches: 70,
          perFile: true,
        },
        'src/features/**/utils/**/*.{ts,tsx}': {
          lines: 85,
          statements: 85,
          functions: 85,
          branches: 80,
          perFile: true,
        },
        'src/features/**/schemas/**/*.{ts,tsx}': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 85,
          perFile: true,
        },
      },
    },
  },
})
```

Notas:

- A configuração deve ser validada com a versão instalada do Vitest e com os padrões de glob do projeto.
- `perFile: true` torna o limite aplicável individualmente aos arquivos correspondentes ao glob.
- Adicionar configuração equivalente para módulos de domínio/negócio, se existirem.
- Não excluir arquivos de regra de negócio, Hooks, API ou utilitários para melhorar artificialmente o percentual.
- Arquivos que não justificam teste individual devem ser excluídos somente com critério documentado.

Arquivo `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

### 11.11 E2E com Playwright

Manter testes E2E em `tests/e2e/`, organizados por jornada ou domínio:

```text
tests/e2e/
├── authentication.spec.ts
├── user-management.spec.ts
└── checkout.spec.ts
```

Seguir as práticas recomendadas pelo Playwright: testar comportamento visível ao usuário, manter testes isolados, usar locators resilientes e evitar dependência entre cenários.

---

## 12. Qualidade estática, segurança e desempenho

### 12.1 TypeScript Strict

Ativar `strict` e avaliar opções adicionais como `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters` e `noFallthroughCasesInSwitch` conforme compatibilidade com o template.

Exemplo de opções relevantes:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

Ajustar ao `tsconfig` gerado pela versão atual do Vite. Não copiar um `tsconfig` parcial por cima do template sem conferir as opções existentes.

### 12.2 ESLint e Prettier

- ESLint deve detectar erros, padrões inseguros e violações das regras de Hooks.
- `typescript-eslint` deve fornecer regras para TypeScript; usar configuração recomendada e avaliar `strict`/`type-checked` conforme custo.
- Prettier deve formatar o código; evitar duplicar regras de estilo do Prettier no ESLint.
- Usar ESLint Flat Config (`eslint.config.js` ou `.mjs`) em projetos novos.
- Adicionar plugin de React Hooks e, se usar TanStack Query, avaliar o plugin ESLint do TanStack Query.

Regras internas de referência:

- evitar `any` sem justificativa;
- proibir imports e variáveis não utilizados;
- seguir Rules of Hooks;
- detectar código inalcançável;
- limitar tamanho de arquivos e funções;
- revisar complexidade e profundidade de aninhamento;
- não permitir `console.log` acidental em produção.

Exemplo ilustrativo de limites no ESLint:

```js
export default [
  {
    files: ['src/features/**/components/**/*.{ts,tsx}'],
    rules: {
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
      complexity: ['warn', 10],
      'max-depth': ['warn', 3],
      'max-params': ['warn', 3],
    },
  },
  {
    files: ['src/features/**/pages/**/*.{ts,tsx}'],
    rules: {
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/features/**/hooks/**/*.{ts,tsx}'],
    rules: {
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/features/**/api/**/*.{ts,tsx}'],
    rules: {
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/features/**/{types,constants,utils}/**/*.{ts,tsx}'],
    rules: {
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
    },
  },
]
```

O exemplo aplica o limite máximo, não o limite de alerta. Alertas intermediários devem ser gerados por um relatório LOC por camada ou por uma regra/script complementar. Não configurar `max-lines` com o limite de alerta como erro, pois isso bloquearia arquivos que ainda estão abaixo do máximo aprovado.

### 12.3 Segurança

- Não incluir segredos, senhas ou chaves privadas em código frontend.
- Considerar toda variável `VITE_*` pública: ela é incorporada ao bundle acessível pelo cliente.
- Validar e normalizar dados externos conforme o contexto.
- Evitar `dangerouslySetInnerHTML`; se HTML fornecido por usuários for requisito, sanitizar com biblioteca mantida e política explícita.
- Não confiar em autorização implementada somente na UI; validar permissões no servidor.
- Usar HTTPS e política de cookies segura, conforme arquitetura de autenticação.
- Não armazenar tokens de sessão ou credenciais sensíveis em `localStorage`; considerar cookies `HttpOnly`, `Secure` e `SameSite` com desenho coordenado com o backend.
- Não registrar tokens, credenciais, dados pessoais ou payloads sensíveis em logs.
- Manter dependências atualizadas e revisar vulnerabilidades.

### 12.4 Desempenho

- Medir antes de otimizar.
- Dividir bundles por rota/feature quando o tamanho justificar.
- Evitar carregamento inicial de módulos pesados desnecessários.
- Usar paginação, virtualização ou carregamento incremental em coleções grandes.
- Controlar re-renderizações por meio de profiling, seletor de estado e composição.
- Usar cache de servidor apropriado, sem duplicar dados em múltiplos stores.
- Definir metas reais de Web Vitals conforme o público e o tipo de aplicação.

---

## 13. Documentação e ADRs

### 13.1 README.md

O README deve ser a porta de entrada do repositório e conter:

1. Nome e objetivo do sistema.
2. Funcionalidades principais.
3. Stack tecnológica.
4. Pré-requisitos.
5. Instalação e execução local.
6. Variáveis de ambiente.
7. Scripts disponíveis.
8. Estrutura de diretórios.
9. Estratégia e execução de testes.
10. Processo de contribuição.
11. Links para documentação complementar.

### 13.2 CONTRIBUTING.md

Documentar:

- convenção de branches;
- Conventional Commits;
- nomenclatura e organização de features;
- comandos de lint, typecheck e testes;
- critérios para Pull Requests;
- política de LOC e cobertura;
- como registrar decisões arquiteturais;
- como lidar com exceções.

### 13.3 Documentação arquitetural

Manter em `docs/architecture/` documentos curtos e atualizados, por exemplo:

```text
docs/architecture/
├── overview.md
├── folder-structure.md
├── state-management.md
├── api-integration.md
├── testing-strategy.md
├── security.md
└── decisions/
    ├── 0001-frontend-stack.md
    ├── 0002-feature-based-architecture.md
    ├── 0003-state-management.md
    └── 0004-testing-coverage-policy.md
```

### 13.4 Architecture Decision Records (ADR)

Usar ADR para registrar decisões que afetam estrutura, dependências, integrações, segurança, desempenho ou padrões de construção.

Modelo:

```md
# ADR-0001: Título da decisão

- Status: Proposed | Accepted | Superseded | Deprecated
- Data: YYYY-MM-DD
- Responsáveis: equipe ou responsável técnico

## Contexto

Quais forças, necessidades e restrições motivaram a decisão?

## Decisão

O que será adotado e por quê?

## Alternativas consideradas

Quais opções foram avaliadas e por que não foram escolhidas?

## Consequências

Quais são os efeitos positivos, negativos e trade-offs?

## Referências

Links, artigos, documentação ou evidências utilizadas.
```

ADRs são curtos, versionados e numerados sequencialmente. Não apagar um ADR substituído: marcar seu status como `Superseded` e apontar para o novo registro.

### 13.5 Comentários no código

Comentar o motivo de decisões não óbvias, invariantes, regras de negócio complexas e limitações externas. Evitar comentários que apenas traduzam a instrução linha a linha. Preferir código expressivo e nomes semânticos.

### 13.6 Storybook

Avaliar Storybook para design systems, bibliotecas de UI ou aplicações com muitos componentes reutilizáveis. Stories documentam estados e variações dos componentes e podem apoiar testes visuais/interativos. Não é requisito obrigatório para uma aplicação pequena.

---

## 14. Git, commits, Pull Requests e CI/CD

### 14.1 Conventional Commits

Formato:

```text
<type>[optional scope]: <description>
```

Tipos comuns:

| Tipo       | Uso                                                     |
| ---------- | ------------------------------------------------------- |
| `feat`     | Nova funcionalidade                                     |
| `fix`      | Correção de defeito                                     |
| `refactor` | Reestruturação sem mudança intencional de comportamento |
| `docs`     | Documentação                                            |
| `test`     | Testes                                                  |
| `style`    | Formatação/estilos sem alteração funcional              |
| `perf`     | Desempenho                                              |
| `chore`    | Manutenção/configuração                                 |

Exemplos:

```text
feat(users): add user registration
fix(auth): handle expired sessions
refactor(products): extract product API module
docs(architecture): define feature boundaries
test(checkout): cover payment validation
```

### 14.2 Fluxo de branches

Para a maioria dos projetos, adotar um fluxo simples semelhante ao GitHub Flow:

1. Criar branch curta a partir da branch principal.
2. Implementar uma mudança coesa.
3. Criar commits pequenos e descritivos.
4. Abrir Pull Request.
5. Executar CI e revisão de código.
6. Corrigir apontamentos.
7. Integrar somente após todos os Quality Gates obrigatórios.

Exemplos de branch:

```text
feature/user-registration
feature/product-management
fix/authentication-error
refactor/api-services
```

### 14.3 Template de Pull Request

Criar `.github/pull_request_template.md`:

```md
## Descrição

O que foi alterado?

## Motivação

Por que a mudança é necessária?

## Alterações

- [ ] Implementação concluída
- [ ] Testes adicionados ou atualizados
- [ ] Documentação atualizada
- [ ] Acessibilidade considerada
- [ ] Responsabilidades respeitam as camadas
- [ ] LOC revisado por camada
- [ ] Cobertura e complexidade revisadas
- [ ] Nenhuma dependência desnecessária adicionada

## Testes realizados

Como a alteração foi validada?

## Evidências visuais

Adicionar screenshots ou gravações quando aplicável.

## Riscos / migrações

Descrever impactos e passos necessários.

## Issues relacionadas

Referências:
```

### 14.4 Pipeline de CI

Executar em Pull Requests e, conforme o fluxo de release, antes de publicar:

```text
Pull Request
    ↓
Install (lockfile)
    ↓
Prettier check + ESLint
    ↓
TypeScript typecheck
    ↓
Unit + Integration tests
    ↓
Coverage global + por camada + diff coverage
    ↓
LOC + complexidade
    ↓
E2E dos fluxos críticos
    ↓
Production build
    ↓
Review / merge
```

### 14.5 Quality Gates

Bloquear integração quando ocorrer:

- teste obrigatório falhando;
- erro de TypeScript;
- erro de lint configurado como bloqueante;
- build de produção falhando;
- cobertura global abaixo do mínimo;
- cobertura de código novo abaixo do mínimo acordado;
- arquivo acima do LOC máximo sem exceção aprovada;
- regra crítica sem teste adequado;
- violação arquitetural relevante ou dependência circular.

Falhas de E2E não críticas ou flakiness devem ser tratadas como defeitos do pipeline e não silenciadas indefinidamente. Exceções precisam de responsável e prazo para correção.

---

## 15. Bootstrap de um projeto

### 15.1 Criar aplicação SPA com Vite

Quando Vite for adequado ao cenário:

```bash
npm create vite@latest my-project -- --template react-ts
cd my-project
npm install
```

Para projetos com SEO, SSR, SSG ou integração server-side mais profunda, reavaliar a decisão e começar com um framework React adequado.

### 15.2 Instalar dependências opcionais da stack

```bash
# Routing
npm install react-router

# Server state/cache (quando necessário)
npm install @tanstack/react-query

# Client global state (quando necessário)
npm install zustand

# Runtime validation (quando necessário)
npm install zod
```

Ferramentas de desenvolvimento e testes:

```bash
npm install -D \
  vitest \
  @vitest/coverage-v8 \
  jsdom \
  @testing-library/react \
  @testing-library/dom \
  @testing-library/user-event \
  @testing-library/jest-dom \
  @playwright/test \
  prettier \
  eslint \
  typescript-eslint
```

Adicionar o plugin React do ESLint e o plugin oficial de React Hooks conforme a configuração Flat Config adotada. Se utilizar TanStack Query, avaliar também `@tanstack/eslint-plugin-query`.

### 15.3 Scripts sugeridos

Ajustar os scripts à versão e à configuração reais do template:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc -b",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

### 15.4 Alias de imports

Usar alias como `@/` para reduzir caminhos relativos longos. Configurar de forma consistente no TypeScript e no Vite (ou na ferramenta de build escolhida). O alias não é recurso automático do React.

Exemplo de uso:

```tsx
import { Button } from '@/shared/ui/Button'
import { UsersPage } from '@/features/users'
```

### 15.5 Variáveis de ambiente

Exemplo de `.env.example`:

```dotenv
VITE_APP_NAME=My Application
VITE_API_URL=http://localhost:3000/api
```

- Versionar `.env.example` sem segredos.
- Ignorar arquivos locais que possam conter valores privados.
- Considerar todo valor com prefixo `VITE_` público e acessível pelo navegador.
- Nunca armazenar senha de banco, segredo de assinatura, API key privada ou credencial administrativa no frontend.

---

## 16. Definition of Done

Uma funcionalidade é considerada concluída quando os critérios aplicáveis forem atendidos:

### Arquitetura e código

- [ ] Código organizado na feature e camada corretas.
- [ ] Responsabilidades separadas e dependências respeitam as fronteiras.
- [ ] Nomenclatura consistente e semanticamente clara.
- [ ] LOC individual e por camada revisado.
- [ ] Arquivos acima dos alertas revisados; nenhum acima do máximo sem exceção aprovada.
- [ ] Complexidade ciclomática/aninhamento revisados.
- [ ] Sem `any` injustificado, código morto ou duplicação relevante.

### Qualidade e testes

- [ ] TypeScript sem erros.
- [ ] ESLint sem erros bloqueantes.
- [ ] Testes unitários relevantes implementados.
- [ ] Testes de integração implementados quando há colaboração entre componentes/camadas.
- [ ] Fluxos críticos protegidos por E2E.
- [ ] Cobertura global e por camada atendida.
- [ ] Cobertura de código novo atendida ou exceção aprovada.
- [ ] Casos positivos, negativos e de borda considerados.
- [ ] Testes independentes e determinísticos.

### Experiência e segurança

- [ ] Loading, erro, vazio e sucesso tratados quando aplicável.
- [ ] Responsividade verificada.
- [ ] Acessibilidade básica validada.
- [ ] Dados externos validados conforme o risco.
- [ ] Nenhum segredo exposto no bundle ou nos logs.
- [ ] Autorização verificada no backend.

### Entrega e documentação

- [ ] Documentação atualizada.
- [ ] Variáveis de ambiente documentadas.
- [ ] Pull Request revisado e aprovado.
- [ ] CI concluído.
- [ ] Build de produção aprovado.
- [ ] ADR criado ou atualizado quando a decisão arquitetural justificar.

---

## 17. Governança e evolução deste padrão

1. Tratar este documento como baseline do repositório, versionado junto ao código.
2. Registrar exceções relevantes no Pull Request; exceções duradouras devem ter ADR ou issue de dívida técnica.
3. Revisar os limites de LOC, cobertura e complexidade após os primeiros ciclos de desenvolvimento, usando dados reais de manutenção e defeitos.
4. Não reduzir cobertura ou excluir arquivos apenas para fazer o pipeline passar.
5. Não criar abstrações apenas para atingir LOC ou cobertura.
6. Atualizar a bibliografia quando decisões importantes forem alteradas.
7. Revisar links e versões das ferramentas periodicamente; a documentação online é mutável.
8. Ao substituir uma decisão, registrar a nova decisão e marcar a anterior como superada, preservando o histórico.

---

## 18. Referências, autores e leituras

**Data de consulta das páginas online:** 20 de novembro de 2026.  
A documentação oficial de ferramentas é viva e pode mudar. Antes de iniciar uma implementação, consultar a versão correspondente à dependência instalada.

### 18.1 React, TypeScript e ferramentas de aplicação

1. **React Team / Meta — “Creating a React App”.** Orienta a escolha entre framework React e configuração do zero.  
   https://react.dev/learn/creating-a-react-app
2. **React Team / Meta — “Thinking in React”.** Decomposição de UI, fluxo de dados e estado mínimo.  
   https://react.dev/learn/thinking-in-react
3. **React Team / Meta — “Choosing the State Structure”.** Evitar estado redundante e duplicado.  
   https://react.dev/learn/choosing-the-state-structure
4. **React Team / Meta — “Managing State”.** Organização e compartilhamento de estado.  
   https://react.dev/learn/managing-state
5. **React Team / Meta — “useEffect”.** Sincronização com sistemas externos e critérios de uso de Effects.  
   https://react.dev/reference/react/useEffect
6. **React Team / Meta — “Components and Hooks must be pure”.** Pureza, imutabilidade e efeitos colaterais.  
   https://react.dev/reference/rules/components-and-hooks-must-be-pure
7. **Microsoft — TypeScript Handbook / TSConfig Reference.** Tipagem, compilador e modo strict.  
   https://www.typescriptlang.org/docs/handbook/compiler-options.html
8. **Vite Team — “Env Variables and Modes”.** Disponibilização de variáveis `VITE_*` e cuidados com segredos.  
   https://vite.dev/guide/env-and-mode
9. **React Router Team — “Installation / Modes”.** Modos Declarative, Data e Framework e instalação atual.  
   https://reactrouter.com/start/data/installation
10. **TanStack — “React Query Quick Start”.** Queries, mutations e invalidação de cache.  
    https://tanstack.com/query/latest/docs/framework/react/quick-start
11. **Zustand / pmndrs — “Introduction”.** Stores e estado global baseado em Hooks.  
    https://zustand.docs.pmnd.rs/learn/getting-started/introduction
12. **Zod — “Basic usage”.** Schemas, validação em runtime e inferência de tipos.  
    https://zod.dev/basics

### 18.2 Qualidade estática e LOC

13. **ESLint Team — “max-lines”.** Regra para limitar linhas por arquivo; a própria documentação observa que não há número objetivo universal.  
    https://eslint.org/docs/latest/rules/max-lines
14. **ESLint Team — “max-lines-per-function”.** Regra para limitar tamanho de funções.  
    https://eslint.org/docs/latest/rules/max-lines-per-function
15. **ESLint Team — “complexity”.** Regra de complexidade ciclomática.  
    https://eslint.org/docs/latest/rules/complexity
16. **typescript-eslint Team — “Shared Configurations”.** Configurações recomendadas e estritas para TypeScript.  
    https://typescript-eslint.io/users/configs/
17. **Prettier Team — “Configuration File”.** Configuração reprodutível de formatação.  
    https://prettier.io/docs/configuration
18. **G. Ann Campbell / SonarSource — “Cognitive Complexity”.** Métrica orientada à compreensibilidade do código.  
    https://www.sonarsource.com/resources/cognitive-complexity/
19. **G. Ann Campbell — “Cognitive Complexity: An Overview and Evaluation”.** Artigo apresentado na International Conference on Technical Debt, 2018.  
    https://doi.org/10.1145/3194164.3194186

### 18.3 Testes, cobertura e mutation testing

20. **Carlos Arguelles, Marko Ivanković e Adam Bender — “Code Coverage Best Practices”, Google Testing Blog, 7 de agosto de 2020.** Referência para uso pragmático de cobertura, faixas indicativas de 60/75/90, código novo, risco e limitações da métrica.  
    https://testing.googleblog.com/2020/08/code-coverage-best-practices.html
21. **Martin Fowler — “The Practical Test Pyramid”.** Distribuição, custo de manutenção e foco em testes de níveis inferiores quando oferecem confiança suficiente.  
    https://martinfowler.com/articles/practical-test-pyramid.html
22. **Vitest Team — “Coverage Configuration”.** Providers, relatórios, thresholds globais e por glob/per-file.  
    https://vitest.dev/config/coverage
23. **Testing Library Team — “React Testing Library”.** Testes orientados à forma como o usuário utiliza a interface, evitando detalhes de implementação.  
    https://testing-library.com/docs/react-testing-library/intro/
24. **Playwright Team — “Best Practices”.** Testes de comportamento visível, isolamento e locators resilientes.  
    https://playwright.dev/docs/best-practices
25. **Stryker Mutator Team — “What is mutation testing?”.** Mutantes, mutações sobreviventes e mutation score.  
    https://stryker-mutator.io/docs/
26. **SonarSource — “Understanding measures and metrics”.** Indicadores de cobertura, complexidade, linhas executáveis e métricas de código novo.  
    https://docs.sonarsource.com/sonarqube-server/user-guide/code-metrics/metrics-definition/
27. **SonarSource — “About new code”.** Definição de código novo em análises e Pull Requests.  
    https://docs.sonarsource.com/sonarqube-server/10.7/core-concepts/clean-as-you-code/about-new-code

### 18.4 Arquitetura, documentação e convenções

28. **Michael Nygard — “Documenting Architecture Decisions”, 15 de novembro de 2011.** Artigo original que popularizou o formato leve de Architecture Decision Records (ADR).  
    https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
29. **Martin Fowler — “Architecture Decision Record”, 24 de março de 2026.** Contexto, decisão e consequências; recomenda manter registros curtos e superseder decisões antigas em vez de apagá-las.  
    https://martinfowler.com/bliki/ArchitectureDecisionRecord.html
30. **Government Digital Service (GDS), UK Cabinet Office — “Documenting architecture decisions”.** Recomenda registrar decisões no controle de versão e apresenta o ciclo de vida de ADRs.  
    https://gds-way.digital.cabinet-office.gov.uk/standards/architecture-decisions.html
31. **BEM / Yandex — “Naming convention”.** Convenção Block–Element–Modifier para nomes de classes CSS.  
    https://en.bem.info/methodology/naming-convention/
32. **Conventional Commits Contributors — “Conventional Commits 1.0.0”.** Formato padronizado de mensagens de commit.  
    https://www.conventionalcommits.org/en/v1.0.0/
33. **Storybook Team — “Component tests”.** Stories, estados de componentes e testes interativos/visuais.  
    https://storybook.js.org/docs/writing-tests/component-testing

### 18.5 Segurança e acessibilidade

34. **OWASP Foundation — “HTML5 Security Cheat Sheet”.** Riscos de armazenamento de dados sensíveis em `localStorage` e APIs de armazenamento do navegador.  
    https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
35. **OWASP Foundation — “Cross Site Scripting Prevention Cheat Sheet”.** Output encoding, sanitização e riscos de APIs que inserem HTML.  
    https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
36. **W3C — “Web Content Accessibility Guidelines (WCAG) 2.2”, W3C Recommendation, 12 de dezembro de 2024.** Critérios de acessibilidade para conteúdo web.  
    https://www.w3.org/TR/WCAG/

### 18.6 Livros complementares recomendados

Os limites numéricos de LOC e cobertura deste documento **não foram extraídos diretamente de livros**. Os livros abaixo são leituras complementares para aprofundar arquitetura, refatoração e evolução de software:

- **Robert C. Martin — _Clean Architecture: A Craftsman's Guide to Software Structure and Design_ (2017).** Princípios de dependência, limites e separação de responsabilidades.
- **Martin Fowler — _Refactoring: Improving the Design of Existing Code_, 2ª edição (2018).** Técnicas para melhorar a estrutura interna sem alterar o comportamento observável.
- **Andrew Hunt e David Thomas — _The Pragmatic Programmer_, 2ª edição (2019).** Práticas de desenvolvimento, automação e manutenção profissional.
- **Mark Richards e Neal Ford — _Fundamentals of Software Architecture_ (2020).** Trade-offs arquiteturais e avaliação de atributos de qualidade.

### 18.7 Como as referências sustentam as decisões

| Decisão deste padrão                                  | Base principal                                                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Framework versus React + Vite                         | React — Creating a React App; Vite docs                                                               |
| Separar estado local, remoto e compartilhado          | React — Managing State; TanStack Query; Zustand                                                       |
| Evitar estado redundante e Effects desnecessários     | React — Choosing the State Structure; useEffect                                                       |
| Validar dados de fronteira                            | Zod docs; TypeScript docs                                                                             |
| Limitar LOC sem tratar número como verdade absoluta   | ESLint `max-lines`; Google Code Coverage Best Practices como referência de uso pragmático de métricas |
| Complementar LOC com complexidade                     | ESLint `complexity`; G. Ann Campbell / SonarSource Cognitive Complexity                               |
| Distribuir testes por níveis                          | Martin Fowler — Practical Test Pyramid                                                                |
| Usar cobertura como indicador, não prova de qualidade | Carlos Arguelles, Marko Ivanković e Adam Bender — Google Testing Blog                                 |
| Metas de cobertura configuráveis                      | Vitest Coverage; SonarQube metrics                                                                    |
| Testar o comportamento do usuário                     | React Testing Library; Playwright Best Practices                                                      |
| Validar qualidade dos próprios testes                 | Stryker Mutation Testing                                                                              |
| Registrar decisões e preservar histórico              | Michael Nygard; Martin Fowler; GDS Way                                                                |
| Convenção de nomes CSS                                | BEM / Yandex                                                                                          |
| Proteção de dados e XSS                               | OWASP Cheat Sheets                                                                                    |
| Acessibilidade web                                    | W3C WCAG 2.2                                                                                          |

---

## Resumo executivo dos padrões adotados

| Área                     | Padrão                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Arquitetura              | Feature-Based Architecture + Shared                                                |
| Tipagem                  | TypeScript `strict`                                                                |
| Componentes              | Composição e responsabilidade predominante única                                   |
| Nomenclatura             | PascalCase, camelCase, UPPER_SNAKE_CASE e kebab-case conforme o elemento           |
| Estado local             | React Hooks                                                                        |
| Estado global            | Zustand somente quando necessário                                                  |
| Estado remoto            | TanStack Query quando necessário                                                   |
| Validação runtime        | Zod quando necessário                                                              |
| API                      | Módulos por feature + cliente HTTP compartilhado                                   |
| LOC                      | Faixas por tipo de arquivo e por camada, conforme seção 10                         |
| Complexidade             | Ciclomática até 10 como referência; revisão de aninhamento e compreensão           |
| Cobertura global         | Lines 80%, Statements 80%, Functions 80%, Branches 70%                             |
| Cobertura de código novo | Lines/Statements/Functions 85%, Branches 75%                                       |
| Cobertura crítica        | Regras de negócio com metas de 90% ou mais e análise de branches                   |
| Mix de testes            | Referência 65% unitários, 25% integração, 10% E2E; não é gate rígido               |
| Testes                   | Vitest + React Testing Library + Playwright                                        |
| Mutation testing         | Stryker em regras críticas; meta inicial de 70%                                    |
| Qualidade                | ESLint + typescript-eslint + Prettier                                              |
| Documentação             | README + CONTRIBUTING + docs + ADRs                                                |
| Versionamento            | Conventional Commits + Pull Requests                                               |
| CI/CD                    | Lint + typecheck + testes + cobertura + LOC + build                                |
| Segurança                | OWASP; não expor segredos no bundle nem armazenar tokens sensíveis em localStorage |
| Acessibilidade           | WCAG 2.2 como referência                                                           |

**Diretriz final:** otimizar para clareza e manutenção, não para atingir métricas isoladas. LOC, cobertura, complexidade e quantidade de testes devem orientar discussões técnicas e decisões de revisão. A aprovação final deve considerar risco de negócio, comportamento observado, qualidade dos testes e coerência arquitetural.
