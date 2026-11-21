import { Select } from '@radix-ui/themes'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LOCALES, type Locale, storeLocale } from '@/shared/i18n/index.ts'
import styles from './language-select.module.css'

/**
 * Seletor de português, inglês e espanhol.
 * @param className - Classe visual do gatilho, usada no mastro escuro.
 * @returns Controle que persiste o idioma no navegador.
 */
export function LanguageSelect({ className }: { className?: string }) {
  /** Valor valor. */
  const { t, i18n } = useTranslation()
  /** Valor current. */
  const current = (LOCALES as readonly string[]).includes(i18n.language) ? i18n.language : 'pt-BR'

  /**
   * Grava o idioma escolhido e troca a interface.
   * @param value - Código vindo do seletor.
   */
  function change(value: string) {
    /** Valor locale. */
    const locale = LOCALES.find((item) => item === value)
    if (!locale) return
    storeLocale(locale)
    void i18n.changeLanguage(locale)
  }

  return (
    <Select.Root value={current} onValueChange={change}>
      <Select.Trigger aria-label={t('language.label')} className={className} />
      <Select.Content align="end" position="popper">
        {LOCALES.map((locale) => (
          <Select.Item key={locale} value={locale}>
            <span className={styles.option}>
              <LanguageFlag locale={locale} />
              {t(`language.${locale}`)}
            </span>
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}

/**
 * Bandeira do idioma, só como apoio visual ao nome.
 * @param locale - Idioma da opção.
 * @returns Desenho da bandeira.
 */
function LanguageFlag({ locale }: { locale: Locale }): ReactNode {
  switch (locale) {
    case 'pt-BR':
      return (
        <svg className={styles.flag} viewBox="0 0 20 14" aria-hidden="true">
          <rect width="20" height="14" fill="#009B3A" />
          <polygon points="10,1.4 18.6,7 10,12.6 1.4,7" fill="#FEDD00" />
          <circle cx="10" cy="7" r="3.1" fill="#002776" />
        </svg>
      )
    case 'en':
      return (
        <svg className={styles.flag} viewBox="0 0 20 14" aria-hidden="true">
          <rect width="20" height="14" fill="#FFFFFF" />
          <rect width="20" height="2" fill="#B22234" />
          <rect y="4" width="20" height="2" fill="#B22234" />
          <rect y="8" width="20" height="2" fill="#B22234" />
          <rect y="12" width="20" height="2" fill="#B22234" />
          <rect width="8" height="7" fill="#3C3B6E" />
        </svg>
      )
    case 'es':
      return (
        <svg className={styles.flag} viewBox="0 0 20 14" aria-hidden="true">
          <rect width="20" height="14" fill="#C60B1E" />
          <rect y="3.5" width="20" height="7" fill="#FFC400" />
        </svg>
      )
    default: {
      /** Valor unreachable. */
      const unreachable: never = locale
      return unreachable
    }
  }
}
