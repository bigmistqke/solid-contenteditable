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

  test(
    'Ctrl/Meta+ArrowLeft word navigation',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello wonderful world test')

      // Start at end
      let position = await getCaretPosition(page, '[role="textbox"]')
      expect(position).toBe(24) // At end

      // Move left by word
      await page.keyboard.press('ControlOrMeta+ArrowLeft')
      position = await getCaretPosition(page, '[role="textbox"]')

      // Should move to beginning of "test"
      expect(position).toBe(20)

      // Move left by word again
      await page.keyboard.press('ControlOrMeta+ArrowLeft')
      position = await getCaretPosition(page, '[role="textbox"]')

      // Should move to beginning of "world"
      expect(position).toBe(14)
    }),
  )

  test(
    'Ctrl/Meta+ArrowRight word navigation',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello wonderful world test')

      // Start at beginning
      await page.keyboard.press('Home')
      let position = await getCaretPosition(page, '[role="textbox"]')
      expect(position).toBe(0)

      // Move right by word
      await page.keyboard.press('ControlOrMeta+ArrowRight')
      position = await getCaretPosition(page, '[role="textbox"]')

      // Should move to end of "Hello"
      expect(position).toBe(5)
    }),
  )

  test(
    'ArrowUp/ArrowDown line navigation',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      // Create multi-line content
      await editor.fill('First line of text')
      await page.keyboard.press('Enter')
      await page.keyboard.type('Second line here')
      await page.keyboard.press('Enter')
      await page.keyboard.type('Third line content')

      // Move to middle of second line
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('ArrowLeft+ArrowLeft+ArrowLeft')

      let position = await getCaretPosition(page, '[role="textbox"]')
      const middlePosition = position

      // Move up to first line
      await page.keyboard.press('ArrowUp')
      position = await getCaretPosition(page, '[role="textbox"]')

      // Should move up but try to maintain horizontal position
      expect(position).toBeLessThan(middlePosition)

      // Move down to second line
      await page.keyboard.press('ArrowDown')
      position = await getCaretPosition(page, '[role="textbox"]')

      // Should move back to approximately the same position
      expect(position).toBeGreaterThan(17) // After first line + newline
    }),
  )

  test(
    'Ctrl/Meta+Home/End document navigation',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      // Create multi-line content
      await editor.fill('First line')
      await page.keyboard.press('Enter')
      await page.keyboard.type('Second line')
      await page.keyboard.press('Enter')
      await page.keyboard.type('Third line')

      // Move to middle
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('ArrowLeft+ArrowLeft')

      // Test Ctrl/Meta+Home (go to document beginning)
      await page.keyboard.press('ControlOrMeta+Home')
      let position = await getCaretPosition(page, '[role="textbox"]')

      expect(position).toBe(0)

      // Test Ctrl/Meta+End (go to document end)
      await page.keyboard.press('ControlOrMeta+End')
      position = await getCaretPosition(page, '[role="textbox"]')
      const text = await editor.textContent()

      expect(position).toBe(text?.length || 0)
    }),
  )

  test(
    'Shift+Ctrl/Meta+Arrow word selection',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello wonderful world')

      // Position cursor at beginning of "wonderful"
      await page.keyboard.press('Home')
      await page.keyboard.press('ControlOrMeta+ArrowRight')

      // Select word to the right
      await page.keyboard.press('Shift+ControlOrMeta+ArrowRight')

      // Type to replace selection
      await page.keyboard.type('amazing')

      await expect(editor).toHaveText('Hello amazing world')
    }),
  )
})
