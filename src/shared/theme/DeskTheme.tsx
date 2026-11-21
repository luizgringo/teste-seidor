import { Theme } from '@radix-ui/themes'
import type { ReactNode } from 'react'

/**
 * Tema da mesa: teal alinhado à marca, raio largo e painel sólido.
 * @param children - Árvore já dentro do cache de servidor.
 * @returns A mesma árvore com diálogo, campo, botão e menu na mesma escala.
 */
export function DeskTheme({ children }: { children: ReactNode }) {
  return (
    <Theme accentColor="teal" grayColor="slate" panelBackground="solid" radius="large">
      {children}
    </Theme>
  )
}
