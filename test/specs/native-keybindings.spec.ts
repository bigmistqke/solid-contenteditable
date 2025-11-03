import { expect, test } from '@playwright/test'
import { getCaretPosition, selectAndClear, setup } from './utils'

/**
 * Native Keybindings Tests
 * Tests browser-specific keyboard navigation behavior
 * These tests document the differences between browsers and are expected to have different results
 */
test.describe('ContentEditable - Native Keybindings', () => {
  test(
    'Home key navigation',
    setup(async ({ page, browserName }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      // Move cursor to middle
      await page.keyboard.press('ArrowLeft+ArrowLeft+ArrowLeft')

      // Test Home key
      await page.keyboard.press('Home')

      const position = await getCaretPosition(page, '[role="textbox"]')

      // Different browsers may behave differently
      if (browserName === 'firefox') {
        // Document Firefox behavior - may not move to beginning
        console.log(`Firefox Home key position: ${position}`)
      } else {
        // Chromium/Webkit typically moves to beginning
        expect(position).toBe(0)
      }
    }),
  )

  test(
    'End key navigation',
    setup(async ({ page, browserName }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      // Move cursor to beginning
      await page.keyboard.press('ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft')

      // Test End key
      await page.keyboard.press('End')

      const position = await getCaretPosition(page, '[role="textbox"]')
      const text = await editor.textContent()

      if (browserName === 'firefox') {
        // Document Firefox behavior - may not move to end
        console.log(`Firefox End key position: ${position}, text length: ${text?.length}`)
      } else {
        // Chromium/Webkit typically moves to end
        expect(position).toBe(text?.length || 0)
      }
    }),
  )

  test(
    'Ctrl/Meta+A select all',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      // Test select all
      await page.keyboard.press('ControlOrMeta+a')

      // Type to replace - this should work consistently across browsers
      await page.keyboard.type('X')
      await expect(editor).toHaveText('X')
    }),
  )

  test(
    'Arrow key navigation',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello')

      let position = await getCaretPosition(page, '[role="textbox"]')
      expect(position).toBe(5) // At end

      // Move left
      await page.keyboard.press('ArrowLeft')
      position = await getCaretPosition(page, '[role="textbox"]')
      expect(position).toBe(4)

      // Move right
      await page.keyboard.press('ArrowRight')
      position = await getCaretPosition(page, '[role="textbox"]')
      expect(position).toBe(5)
    }),
  )

  test(
    'Shift+Arrow selection',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      // Position cursor at beginning
      await page.keyboard.press(
        'ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft',
      )

      // Select with Shift+ArrowRight
      await page.keyboard.press('Shift+ArrowRight+ArrowRight+ArrowRight+ArrowRight+ArrowRight')

      // Type to replace selection
      await page.keyboard.type('Hi')
      await expect(editor).toHaveText('Hi World')
    }),
  )
})
