import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import styles from './timeline.module.css'

/** Tipo de fato na linha do tempo. */
type TimelineKind = 'message' | 'note' | 'update'

/**
 * Lista vertical dos fatos de um chamado, ligados por uma linha.
 * @param children - Itens na ordem em que aconteceram.
 * @returns A linha do tempo.
 */
export function Timeline({ children }: { children: ReactNode }) {
  return <ol className={styles.timeline}>{children}</ol>
}

/**
 * Um fato na linha do tempo.
 * @param children - Conteúdo do fato.
 * @param kind - Mensagem, nota interna ou atualização de status.
 * @returns O item com o ponto na linha.
 */
export function TimelineItem({
  children,
  kind = 'message',
}: {
  children: ReactNode
  kind?: TimelineKind
}) {
  return (
    <motion.li
      className={itemClass(kind)}
      layout="position"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <span className={styles.node} aria-hidden="true" />
      <div>{children}</div>
    </motion.li>
  )
}

/**
 * Classe do item conforme o tipo de fato.
 * @param kind - Tipo do fato.
 * @returns Classes CSS do item.
 */
function itemClass(kind: TimelineKind): string {
  if (kind === 'note') return `${styles.item} ${styles.note}`
  if (kind === 'update') return `${styles.item} ${styles.update}`
  return styles.item ?? ''
}
