import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from '@/app/router.tsx'

/** Valor queryClient. */
const queryClient = new QueryClient()

/** Raiz da aplicação: cache do servidor e rotas. */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  )
}
