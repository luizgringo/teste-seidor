import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from '@/app/router.tsx'
import { MotionRoot } from '@/shared/motion/MotionRoot.tsx'

/** Cliente de cache compartilhado pelas telas. */
const queryClient = new QueryClient()

/** Raiz da aplicação: cache do servidor, movimento e rotas. */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionRoot>
        <AppRouter />
      </MotionRoot>
    </QueryClientProvider>
  )
}
