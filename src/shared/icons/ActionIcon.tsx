import type { ReactNode } from 'react'
import styles from './action-icon.module.css'

/** Ações que ganham o mesmo desenho em qualquer tela. */
export const ACTION_ICONS = [
  'edit',
  'trash',
  'check',
  'x',
  'send',
  'reply',
  'note',
  'status',
  'reopen',
  'take',
  'reassign',
  'plus',
  'eye',
  'eyeOff',
  'user',
  'swap',
  'signOut',
  'board',
  'calendar',
  'clock',
  'refresh',
  'flag',
] as const

/** Nome de uma ação com ícone. */
export type ActionIconName = (typeof ACTION_ICONS)[number]

/**
 * Ícone e texto de uma ação, no mesmo ritmo em todo o sistema.
 * @param name - Ação desenhada à esquerda do texto.
 * @param children - Rótulo já traduzido.
 * @returns Conteúdo alinhado do botão ou do item.
 */
export function ActionLabel({ name, children }: { name: ActionIconName; children: ReactNode }) {
  return (
    <span className={styles.label}>
      <ActionIcon name={name} />
      {children}
    </span>
  )
}

/**
 * Desenho de uma ação. A cor vem do botão.
 * @param name - Ação a desenhar.
 * @returns Ícone decorativo.
 */
function ActionIcon({ name }: { name: ActionIconName }) {
  return (
    <svg
      aria-hidden="true"
      className={styles.icon}
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 16 16"
      width="14"
    >
      {shape(name)}
    </svg>
  )
}

/**
 * Traços de cada ação.
 * @param name - Ação a desenhar.
 * @returns Caminhos do ícone.
 */
function shape(name: ActionIconName): ReactNode {
  switch (name) {
    case 'edit':
      return <path d="M9.5 3.5 12.5 6.5 6 13H3v-3z" />
    case 'trash':
      return (
        <>
          <path d="M3.5 4.5h9" />
          <path d="M6.5 4.5V3h3v1.5" />
          <path d="M5 4.5 5.5 13h5L11 4.5" />
        </>
      )
    case 'check':
      return <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
    case 'x':
      return (
        <>
          <path d="M4 4 12 12" />
          <path d="M12 4 4 12" />
        </>
      )
    case 'send':
      return <path d="M2.5 8 13.5 3 9.5 13 7.5 9z" />
    case 'reply':
      return <path d="M3 3.5h10v6.5H6.5L3 12.5z" />
    case 'note':
      return (
        <>
          <path d="M4 2.5h5.5L12 5v8.5H4z" />
          <path d="M9.5 2.5V5H12" />
        </>
      )
    case 'status':
      return (
        <>
          <path d="M2 4h12M2 8h12M2 12h12" />
          <circle cx="6" cy="4" r="1.3" />
          <circle cx="10" cy="8" r="1.3" />
          <circle cx="7" cy="12" r="1.3" />
        </>
      )
    case 'reopen':
      return (
        <>
          <path d="M3.5 8a4.5 4.5 0 1 0 1.4-3.2" />
          <path d="M3.5 3.2V7H7" />
        </>
      )
    case 'take':
      return (
        <>
          <circle cx="6" cy="5" r="2" />
          <path d="M3 13c.4-2 1.8-3 3-3s2.6 1 3 3" />
          <path d="M10.5 7.5 12 9l2.5-2.5" />
        </>
      )
    case 'reassign':
      return (
        <>
          <circle cx="5" cy="5" r="1.5" />
          <circle cx="11" cy="5" r="1.5" />
          <path d="M2.8 12c.3-1.5 1.4-2.3 2.2-2.3S6.9 10.5 7.2 12" />
          <path d="M8.8 12c.3-1.5 1.4-2.3 2.2-2.3s1.9.8 2.2 2.3" />
        </>
      )
    case 'plus':
      return (
        <>
          <path d="M8 3v10" />
          <path d="M3 8h10" />
        </>
      )
    case 'eye':
      return (
        <>
          <path d="M2 8s2.4-3.5 6-3.5S14 8 14 8s-2.4 3.5-6 3.5S2 8 2 8" />
          <circle cx="8" cy="8" r="1.4" />
        </>
      )
    case 'eyeOff':
      return (
        <>
          <path d="M3 3.5 13 12.5" />
          <path d="M6.2 6.3A2 2 0 0 0 8 10.2" />
          <path d="M2 8s2.4-3.5 6-3.5c.8 0 1.5.2 2.2.5M14 8s-.8 1.2-2.2 2.2" />
        </>
      )
    case 'user':
      return (
        <>
          <circle cx="8" cy="5.5" r="2.2" />
          <path d="M3.5 13c.6-2.2 2.3-3.3 4.5-3.3s3.9 1.1 4.5 3.3" />
        </>
      )
    case 'swap':
      return (
        <>
          <path d="M3 6h9l-2-2" />
          <path d="M13 10H4l2 2" />
        </>
      )
    case 'signOut':
      return (
        <>
          <path d="M6 3H3.5v10H6" />
          <path d="M7 8h6" />
          <path d="M11 5.5 13.5 8 11 10.5" />
        </>
      )
    case 'board':
      return (
        <>
          <path d="M2.5 3.5h3v9h-3z" />
          <path d="M6.5 3.5h3v6h-3z" />
          <path d="M10.5 3.5h3v7.5h-3z" />
        </>
      )
    case 'calendar':
      return (
        <>
          <path d="M3.5 4.5h9v8h-9z" />
          <path d="M3.5 7h9" />
          <path d="M6 3v2.5M10 3v2.5" />
        </>
      )
    case 'clock':
      return (
        <>
          <circle cx="8" cy="8" r="5" />
          <path d="M8 5.5V8l2.2 1.4" />
        </>
      )
    case 'refresh':
      return (
        <>
          <path d="M12.8 6.2A4.8 4.8 0 1 0 11.6 11" />
          <path d="M12.8 3.2v3h-3" />
        </>
      )
    case 'flag':
      return (
        <>
          <path d="M4 2.5v11" />
          <path d="M4 3.5h7.2L9.2 6.2l2 2.6H4" />
        </>
      )
    default: {
      /** Valor unreachable. */
      const unreachable: never = name
      return unreachable
    }
  }
}
