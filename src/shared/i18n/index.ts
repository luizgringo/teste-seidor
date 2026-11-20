import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './en.ts'
import { es } from './es.ts'
import { ptBR } from './pt-BR.ts'

/** Idiomas que o seletor oferece. */
export const LOCALES = ['pt-BR', 'en', 'es'] as const

/** Um idioma suportado pela interface. */
export type Locale = (typeof LOCALES)[number]

/** Chave do idioma escolhido no navegador. Não guarda segredo. */
export const LOCALE_STORAGE_KEY = 'northline:locale'

/** Lê o idioma salvo ou devolve português do Brasil. */
export function readStoredLocale(): Locale {
  /** Valor stored. */
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored === 'en' || stored === 'es' || stored === 'pt-BR') return stored
  return 'pt-BR'
}

/** Guarda o idioma e atualiza o atributo lang do documento. */
export function storeLocale(locale: Locale): void {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  document.documentElement.lang = locale
}

/** Instância única do i18next, com português como idioma de partida. */
export const i18nInstance = i18n.use(initReactI18next)

void i18nInstance.init({
  resources: {
    'pt-BR': { translation: ptBR },
    en: { translation: en },
    es: { translation: es },
  },
  lng: readStoredLocale(),
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
})

storeLocale(readStoredLocale())
