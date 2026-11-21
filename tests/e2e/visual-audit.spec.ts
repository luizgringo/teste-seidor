import { expect, test } from '@playwright/test'
import { PAYROLL_TITLE } from '../../server/data/blueprint.ts'

const marina = '11111111-1111-4111-8111-000000000002'

test('layout stays inside the phone and the desktop desk', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.request.post('/auth/test-session', { data: { personaId: marina } })
  await page.goto('/queue')
  await expect(page.getByRole('region', { name: 'Perto de estourar' })).toBeVisible()
  expect(await overflow(page)).toBeLessThanOrEqual(0)
  await page.getByRole('link', { name: new RegExp(PAYROLL_TITLE) }).click()
  const heading = page.getByRole('heading', { name: PAYROLL_TITLE })
  await expect(heading).toBeInViewport()
  expect(await overflow(page)).toBeLessThanOrEqual(0)
  await page.getByRole('button', { name: 'Marina Costa' }).click()
  const menu = page.getByRole('menu')
  await expect(menu).toBeVisible()
  const box = await menu.boundingBox()
  expect(box).not.toBeNull()
  if (box) {
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(390)
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.context().clearCookies()
  await page.goto('/login')
  await page.getByRole('combobox', { name: 'Idioma' }).click()
  const languages = await page.getByRole('listbox').boundingBox()
  expect(languages?.height ?? 999).toBeLessThan(160)
  await page.keyboard.press('Escape')
  await page.request.post('/auth/test-session', { data: { personaId: marina } })
  await page.goto('/session')
  await expect(page.getByText('Prévia local')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Nenhum chamado aberto' })).toHaveCount(0)
  await page.goto('/queue')
  await expect(page.getByRole('heading', { name: 'Nenhum chamado aberto' })).toBeVisible()
})

async function overflow(page: import('@playwright/test').Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
}
