import { expect, test } from '@playwright/test'
import { selectAndClear } from './utils'

/**
 * Basic ContentEditable Functionality Tests
 * Tests core features: input, deletion, focus, rapid typing
 */
test.describe('ContentEditable - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('basic text input and output', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello World')
    await expect(editor).toHaveText('Hello World')
  })

  test('basic text deletion', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello World')
    await page.keyboard.press('Backspace')
    await expect(editor).toHaveText('Hello Worl')
  })

  test('focus management', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await editor.click()
    await expect(editor).toBeFocused()
    await editor.fill('Test')
    await expect(editor).toBeFocused()
  })

  test('handles empty input', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await expect(editor).toHaveText('')
  })

  test('handles rapid typing', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    const text = 'The quick brown fox jumps over the lazy dog'
    await editor.fill(text)
    await expect(editor).toHaveText(text)
  })

  test('handles special characters', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    const specialChars = '`~!@#$%^&*()_+-=[]{}|;:\'",./<>?'
    await editor.fill(specialChars)
    await expect(editor).toHaveText(specialChars)
  })

  test('handles very long text input', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    const longText = 'A'.repeat(1000)
    await editor.fill(longText)
    await expect(editor).toHaveText(longText)
  })

  test('handles empty operations gracefully', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Try to delete when empty
    await page.keyboard.press('Backspace')
    await page.keyboard.press('Delete')
    await expect(editor).toHaveText('')

    // Try to undo when no history
    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('')
  })

  test('maintains focus during complex operations', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await editor.fill('Hello')
    await expect(editor).toBeFocused()

    await page.keyboard.press('ControlOrMeta+a')
    await expect(editor).toBeFocused()

    await page.keyboard.press('ControlOrMeta+c')
    await expect(editor).toBeFocused()

    await page.keyboard.press('ControlOrMeta+v')
    await expect(editor).toBeFocused()
  })

  test('handles rapid operations', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Rapid typing and deleting
    for (let i = 0; i < 10; i++) {
      await editor.fill('Test')
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace')
    }

    await expect(editor).toHaveText('')
  })
})