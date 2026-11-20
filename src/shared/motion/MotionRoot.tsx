import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Liga o Motion em toda a árvore e respeita a preferência de menos movimento.
 * @param children - Aplicação já dentro dos providers de dados.
 * @returns A mesma árvore, com transições curtas por padrão.
 */
export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </MotionConfig>
  )
}
