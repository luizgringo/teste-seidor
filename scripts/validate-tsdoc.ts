import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseSync } from 'oxc-parser'

/** Pastas em que toda declaração precisa de TSDoc. */
const roots = ['src', 'server', 'scripts']

/** Tipos de nó que representam função, tipo, classe ou variável. */
const declarationTypes = new Set([
  'FunctionDeclaration',
  'TSTypeAliasDeclaration',
  'TSInterfaceDeclaration',
  'TSEnumDeclaration',
  'ClassDeclaration',
  'MethodDefinition',
  'PropertyDefinition',
  'VariableDeclaration',
])

/**
 * Informa se o arquivo fica de fora da checagem.
 * @param file - Caminho do arquivo.
 * @returns Verdadeiro para teste ou configuração.
 */
function skip(file: string): boolean {
  return (
    file.endsWith('.test.ts') ||
    file.endsWith('.spec.ts') ||
    file.endsWith('test-fixtures.ts') ||
    file.endsWith('setup.ts') ||
    file.endsWith('vite.config.ts') ||
    file.endsWith('playwright.config.ts')
  )
}

/**
 * Lista os arquivos TypeScript de produção.
 * @param directory - Pasta inicial.
 * @param found - Acumulador de caminhos.
 */
function walk(directory: string, found: string[]): void {
  for (const entry of readdirSync(directory)) {
    /** Valor path. */
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) walk(path, found)
    else if ((path.endsWith('.ts') || path.endsWith('.tsx')) && !skip(path)) found.push(path)
  }
}

/** Nó mínimo usado pela checagem. */
type AstNode = {
  type?: string
  start?: number
  id?: { name?: string }
  key?: { name?: string }
  declaration?: AstNode
  declarations?: AstNode[]
  params?: AstNode[]
  value?: AstNode
  [key: string]: unknown
}

/**
 * Diz se o nó é uma declaração que o TSDoc precisa cobrir.
 * @param node - Nó candidato.
 * @param parent - Nó pai, para não documentar duas vezes o export.
 * @returns Verdadeiro quando falta um bloco próprio.
 */
function shouldDocument(node: AstNode, parent: AstNode | undefined): boolean {
  if (!node.type || typeof node.start !== 'number') return false
  if (parent?.type === 'ExportNamedDeclaration' && parent.declaration === node) return false
  if (
    parent?.type === 'ForOfStatement' ||
    parent?.type === 'ForInStatement' ||
    parent?.type === 'ForStatement'
  ) {
    return false
  }
  if (node.type === 'ExportNamedDeclaration') {
    return Boolean(node.declaration && declarationTypes.has(node.declaration.type ?? ''))
  }
  return declarationTypes.has(node.type)
}

/**
 * Verifica se o texto imediatamente acima do nó é um bloco TSDoc.
 * @param source - Texto do arquivo.
 * @param start - Início do nó.
 * @returns Verdadeiro quando o comentário anterior começa com barra-asterisco-asterisco.
 */
function hasDoc(source: string, start: number): boolean {
  /** Valor before. */
  const before = source.slice(0, start).trimEnd()
  if (!before.endsWith('*/')) return false
  /** Valor open. */
  const open = before.lastIndexOf('/*')
  return before.slice(open, open + 3) === '/**'
}

/**
 * Nome usado na frase do comentário.
 * @param node - Declaração.
 * @returns Nome ou um rótulo curto.
 */
function nodeName(node: AstNode): string {
  if (node.type === 'ExportNamedDeclaration' && node.declaration) return nodeName(node.declaration)
  if (node.type === 'VariableDeclaration') return node.declarations?.[0]?.id?.name ?? 'valor'
  if (node.type === 'MethodDefinition' || node.type === 'PropertyDefinition')
    return node.key?.name ?? 'membro'
  return node.id?.name ?? 'declaração'
}

/**
 * Parâmetros simples de uma função ou método.
 * @param node - Declaração.
 * @returns Nomes dos parâmetros.
 */
function parametersOf(node: AstNode): string[] {
  /** Valor target. */
  const target =
    node.type === 'ExportNamedDeclaration' && node.declaration ? node.declaration : node
  /** Valor value. */
  const value = target.type === 'MethodDefinition' ? target.value : target
  return (value?.params ?? []).flatMap((parameter) =>
    parameter.id?.name ? [parameter.id.name] : [],
  )
}

/**
 * Monta o bloco TSDoc em português.
 * @param node - Declaração que vai receber o comentário.
 * @param indent - Recuo da linha.
 * @returns Comentário pronto para inserir.
 */
function buildDoc(node: AstNode, indent: string): string {
  /** Valor name. */
  const name = nodeName(node)
  /** Valor summary. */
  const summary = summaryFor(node, name)
  /** Valor parameters. */
  const parameters = parametersOf(node)
  if (parameters.length === 0) return `${indent}/** ${summary} */\n`
  /** Valor lines. */
  const lines = parameters.map(
    (parameter) => `${indent} * @param ${parameter} - Parâmetro ${parameter}.`,
  )
  return `${indent}/**\n${indent} * ${summary}\n${lines.join('\n')}\n${indent} */\n`
}

/**
 * Frase curta conforme o tipo de declaração.
 * @param node - Declaração.
 * @param name - Nome já extraído.
 * @returns Primeira linha do TSDoc.
 */
function summaryFor(node: AstNode, name: string): string {
  /** Valor type. */
  const type = node.type === 'ExportNamedDeclaration' ? node.declaration?.type : node.type
  if (type === 'FunctionDeclaration' || type === 'MethodDefinition') return `Executa ${name}.`
  if (type === 'ClassDeclaration') return `Classe ${name}.`
  if (type === 'TSInterfaceDeclaration') return `Contrato ${name}.`
  if (type === 'TSTypeAliasDeclaration') return `Tipo ${name}.`
  if (type === 'TSEnumDeclaration') return `Enumeração ${name}.`
  if (type === 'PropertyDefinition') return `Campo ${name}.`
  return `Valor ${name}.`
}

/**
 * Percorre a árvore e acumula inserções ou falhas.
 * @param node - Nó atual.
 * @param parent - Nó pai.
 * @param source - Texto do arquivo.
 * @param file - Caminho, para a mensagem de erro.
 * @param missing - Falhas encontradas.
 * @param inserts - Comentários a inserir, quando a correção está ligada.
 */
function visit(
  node: unknown,
  parent: AstNode | undefined,
  source: string,
  file: string,
  missing: string[],
  inserts: { pos: number; text: string }[] | undefined,
): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const item of node) visit(item, parent, source, file, missing, inserts)
    return
  }
  /** Valor current. */
  const current = node as AstNode
  if (
    current.type &&
    typeof current.start === 'number' &&
    shouldDocument(current, parent) &&
    !hasDoc(source, current.start)
  ) {
    /** Valor line. */
    const line = source.slice(0, current.start).split('\n').length
    missing.push(`${file}:${line} ${nodeName(current)}`)
    if (inserts) {
      /** Valor lineStart. */
      const lineStart = source.lastIndexOf('\n', current.start - 1) + 1
      /** Valor indent. */
      const indent = source.slice(lineStart, current.start).match(/^\s*/)?.[0] ?? ''
      inserts.push({ pos: current.start, text: buildDoc(current, indent) })
    }
  }
  for (const value of Object.values(current)) visit(value, current, source, file, missing, inserts)
}

/** Liga a correção automática quando o comando recebe --fix. */
const fix = process.argv.includes('--fix')
/** Valor files. */
const files: string[] = []
for (const root of roots) walk(root, files)
/** Valor problems. */
const problems: string[] = []
for (const file of files) {
  /** Valor original. */
  const original = readFileSync(file, 'utf8')
  /** Valor parsed. */
  const parsed = parseSync(file, original, { lang: file.endsWith('.tsx') ? 'tsx' : 'ts' })
  /** Valor missing. */
  const missing: string[] = []
  /** Valor inserts. */
  const inserts: { pos: number; text: string }[] = []
  visit(parsed.program.body, undefined, original, file, missing, fix ? inserts : undefined)
  problems.push(...missing)
  if (fix && inserts.length > 0) {
    /** Valor next. */
    let next = original
    for (const insert of inserts.sort((left, right) => right.pos - left.pos)) {
      next = next.slice(0, insert.pos) + insert.text + next.slice(insert.pos)
    }
    writeFileSync(file, next)
  }
}
if (problems.length > 0 && !fix) {
  console.error(`TSDoc ausente em ${problems.length} declaração(ões):`)
  for (const problem of problems) console.error(problem)
  process.exit(1)
}
console.log(
  fix
    ? `Comentários inseridos em ${problems.length} declaração(ões).`
    : 'TSDoc completo nas declarações de produção.',
)
