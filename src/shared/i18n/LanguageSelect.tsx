import { useTranslation } from 'react-i18next'
import { LOCALES, type Locale, storeLocale } from '@/shared/i18n/index.ts'

/**
 * Seletor de português, inglês e espanhol.
 * @param className - Classe visual do select.
 * @returns Controle que persiste o idioma no navegador.
 */
export function LanguageSelect({ className }: { className?: string }) {
  /** Valor valor. */
  const { t, i18n } = useTranslation()
  /** Valor current. */
  const current = (LOCALES as readonly string[]).includes(i18n.language) ? i18n.language : 'pt-BR'
  return (
    <label>
      <span className="sr-only">{t('language.label')}</span>
      <select
        className={className}
        aria-label={t('language.label')}
        value={current}
        onChange={(event) => {
          /** Valor locale. */
          const locale = event.target.value as Locale
          storeLocale(locale)
          void i18n.changeLanguage(locale)
        }}
      >
        {LOCALES.map((locale) => (
          <option key={locale} value={locale}>
            {t(`language.${locale}`)}
          </option>
        ))}
      </select>
    </label>
  )
}
