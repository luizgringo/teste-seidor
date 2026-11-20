import { useTranslation } from 'react-i18next'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router'
import { Shell } from '@/app/Shell.tsx'
import { LoginPage } from '@/features/auth/LoginPage.tsx'
import { SessionPage } from '@/features/auth/SessionPage.tsx'
import { useSession } from '@/features/auth/useSession.ts'
import { CustomerTicketPage } from '@/features/portal/CustomerTicketPage.tsx'
import { NewTicketPage } from '@/features/portal/NewTicketPage.tsx'
import { PortalPage } from '@/features/portal/PortalPage.tsx'
import { TeamPage } from '@/features/team/TeamPage.tsx'
import { QueuePage } from '@/features/tickets/pages/QueuePage.tsx'

/** Routes for the desk. Persona choice decides which screen a path renders. */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/session" element={<SessionPage />} />
        <Route element={<RequirePersona />}>
          <Route path="/" element={<HomeSwitch />} />
          <Route path="/queue" element={<QueueSwitch />} />
          <Route path="/tickets/new" element={<NewTicketPage />} />
          <Route path="/tickets/:ticketId" element={<TicketSwitch />} />
          <Route path="/team" element={<TeamPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

/** Executa RequirePersona. */
function RequirePersona() {
  /** Valor valor. */
  const { t } = useTranslation()
  /** Valor session. */
  const session = useSession()
  if (session.isLoading) return <p>{t('common.loadingDesk')}</p>
  if (!session.data) return <Navigate to="/login" replace />
  if (!session.data.persona) return <Navigate to="/session" replace />
  return (
    <Shell>
      <Outlet />
    </Shell>
  )
}

/** Executa HomeSwitch. */
function HomeSwitch() {
  /** Valor session. */
  const session = useSession()
  /** Valor role. */
  const role = session.data?.persona?.role
  return <Navigate to={role === 'manager' ? '/team' : '/queue'} replace />
}

/** Executa QueueSwitch. */
function QueueSwitch() {
  /** Valor session. */
  const session = useSession()
  if (session.data?.persona?.role === 'customer') return <PortalPage />
  return <QueuePage />
}

/** Executa TicketSwitch. */
function TicketSwitch() {
  /** Valor session. */
  const session = useSession()
  if (session.data?.persona?.role === 'customer') return <CustomerTicketPage />
  return <QueuePage />
}
