import { expect, test } from '@playwright/test'

const marina = '11111111-1111-4111-8111-000000000002'
const ricardo = '11111111-1111-4111-8111-000000000003'
const helena = '11111111-1111-4111-8111-000000000001'
const lisbonTicket = '33333333-3333-4333-8333-000000000012'

test.describe
  .serial('support desk', () => {
    test('shows the three personas after preview sign-in', async ({ page }) => {
      await page.goto('/login')
      await page.getByRole('button', { name: 'Ver a mesa' }).click()
      await expect(page.getByRole('heading', { name: 'Quem você quer ver?' })).toBeVisible()
      await expect(page.getByRole('button', { name: /Marina Costa/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /Ricardo Alves/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /Helena Carvalho/ })).toBeVisible()
    })

    test('keeps internal notes and taxonomy away from Helena', async ({ page }) => {
      await page.request.post('/auth/test-session', { data: { personaId: helena } })
      await page.goto('/queue')
      await expect(page.getByRole('heading', { name: 'Seus pedidos' })).toBeVisible()
      await expect(page.getByText('Prioridade')).toHaveCount(0)
      await expect(page.getByText('Nota interna')).toHaveCount(0)
      await page.getByRole('link', { name: /VPN from Lisbon fails Alguém está cuidando/ }).click()
      await expect(page.getByRole('heading', { name: 'VPN from Lisbon fails' })).toBeVisible()
      await expect(page.getByText('maintenance window')).toHaveCount(0)
      await expect(page.locator('main')).toContainText('Alguém está cuidando')
    })

    test('lets Marina answer the ticket that is about to breach', async ({ page }) => {
      await page.request.post('/auth/test-session', { data: { personaId: marina } })
      await page.goto('/queue')
      await expect(page.getByRole('region', { name: 'Perto de estourar' })).toBeVisible()
      await page.getByRole('link', { name: /Payroll export fails before the cutoff/ }).click()
      await expect(
        page.getByRole('heading', { name: 'Payroll export fails before the cutoff' }),
      ).toBeVisible()
      await expect(page.getByText('Do not promise a time yet.')).toBeVisible()
      await page.getByLabel('Mensagem').fill('We restarted the export job.')
      await page.getByRole('button', { name: 'Enviar resposta' }).click()
      await expect(page.getByText('We restarted the export job.')).toBeVisible()
    })

    test('does not duplicate a message when the same event is delivered twice', async ({
      page,
    }) => {
      await page.request.post('/auth/test-session', { data: { personaId: marina } })
      await page.goto(`/tickets/${lisbonTicket}`)
      await page.getByLabel('Mensagem').fill('Gateway checked once.')
      await page.getByRole('button', { name: 'Enviar resposta' }).click()
      await expect(page.getByText('Gateway checked once.')).toHaveCount(1)
      await page.request.post('/api/test/replay')
      await expect(page.getByText('Gateway checked once.')).toHaveCount(1)
    })

    test('shows Helena a reply that Marina just sent', async ({ browser }) => {
      const customer = await browser.newContext()
      const consultant = await browser.newContext()
      const helenaPage = await customer.newPage()
      const marinaPage = await consultant.newPage()
      await helenaPage.request.post('/auth/test-session', { data: { personaId: helena } })
      await marinaPage.request.post('/auth/test-session', { data: { personaId: marina } })
      await helenaPage.goto(`/tickets/${lisbonTicket}`)
      await marinaPage.goto(`/tickets/${lisbonTicket}`)
      await marinaPage.getByLabel('Mensagem').fill('The Lisbon gateway is stable again.')
      await marinaPage.getByRole('button', { name: 'Enviar resposta' }).click()
      await expect(helenaPage.getByText('The Lisbon gateway is stable again.')).toBeVisible()
      await customer.close()
      await consultant.close()
    })

    test('lets Marina take an unassigned ticket and record a status reason', async ({ page }) => {
      await page.request.post('/auth/test-session', { data: { personaId: marina } })
      await page.goto('/queue')
      await page.getByRole('link', { name: /Printer on floor 3 is offline/ }).click()
      await expect(
        page.getByRole('heading', { name: 'Printer on floor 3 is offline' }),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Assumir chamado' }).click()
      await expect(page.locator('main')).toContainText('Alguém está cuidando')
      await page.getByRole('button', { name: 'Mudar status' }).click()
      await page.getByLabel('Motivo').fill('The printer queue was cleared.')
      await page.getByRole('button', { name: 'Salvar status' }).click()
      await expect(page.getByText('The printer queue was cleared.')).toBeVisible()
    })

    test('shows Ricardo who is carrying the queue and who is idle', async ({ page }) => {
      await page.request.post('/auth/test-session', { data: { personaId: ricardo } })
      await page.goto('/team')
      await expect(page.getByRole('heading', { name: 'Equipe' })).toBeVisible()
      const marinaRow = page.getByRole('row', { name: /Marina Costa/ })
      const pauloRow = page.getByRole('row', { name: /Paulo Neri/ })
      await expect(marinaRow).toBeVisible()
      await expect(pauloRow).toContainText('0')
    })

    test('suggests reopening a closed ticket when Helena describes the same problem', async ({
      page,
    }) => {
      await page.request.post('/auth/test-session', { data: { personaId: helena } })
      await page.goto('/tickets/new')
      await page.getByLabel('O que quebrou?').fill('VPN from Lisbon fails')
      await page
        .getByLabel('O que aconteceu?')
        .fill('VPN from Lisbon fails when the office network changes again')
      await expect(page.getByText(/já está fechado/)).toBeVisible()
      await page.getByRole('button', { name: 'Abrir chamado' }).click()
      await expect(page.getByRole('heading', { name: 'Seus pedidos' })).toBeVisible()
      await expect(page.getByRole('link', { name: /VPN from Lisbon fails/ }).first()).toBeVisible()
    })
  })
