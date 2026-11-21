import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import styles from './not-found.module.css'

/**
 * Tela para um caminho que não existe.
 * @param homeTo - Rota do botão de volta.
 * @param homeLabel - Texto desse botão.
 * @returns A página 404.
 */
export function NotFoundPage({ homeTo, homeLabel }: { homeTo: string; homeLabel: string }) {
  /** Valor valor. */
  const { t } = useTranslation()
  return (
    <div className={styles.page}>
      <motion.section
        className={styles.card}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className={styles.code}>{t('notFound.code')}</p>
        <h1>{t('notFound.title')}</h1>
        <p>{t('notFound.body')}</p>
        <Link className={styles.home} to={homeTo}>
          {homeLabel}
        </Link>
      </motion.section>
    </div>
  )
}
