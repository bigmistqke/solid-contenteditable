import { expect, test } from '@playwright/test'
import { getCaretPosition, moveCaretToStart, selectAndClear, setup } from './utils'

/**
 * Native Keybindings Tests
 * Tests browser-specific keyboard navigation behavior
 * These tests document the differences between browsers and are expected to have different results
 */
test.describe('ContentEditable - Native Keybindings', () => {
  test(
    'Home key navigation',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      // Move cursor to middle
      await page.keyboard.press('ArrowLeft+ArrowLeft+ArrowLeft')

      // Test Home key
      await page.keyboard.press('Home')

      const position = await getCaretPosition(page, '[role="textbox"]')

      expect(position).toBe(0)
    }),
  )

  test(
    'End key navigation',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      // Move cursor to beginning
      await page.keyboard.press('ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft')

      // Test End key
      await page.keyboard.press('End')

      const position = await getCaretPosition(page, '[role="textbox"]')
      const text = await editor.textContent()

      expect(position).toBe(text?.length || 0)
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
      await moveCaretToStart(editor)

      // Select with Shift+ArrowRight
      await page.keyboard.press('Shift+ArrowRight+ArrowRight+ArrowRight+ArrowRight+ArrowRight')

      // Type to replace selection
      await page.keyboard.type('Hi')
      await expect(editor).toHaveText('Hi World')
    }),
  )

  test(
    'Option+ArrowLeft word navigation (macOS) / Ctrl+ArrowLeft (Windows/Linux)',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello wonderful world test')

      // Start at end
      let position = await getCaretPosition(page, '[role="textbox"]')
      expect(position).toBe(26) // At end

      // Move left by word - use different keys for different platforms
      const isMac = process.platform === 'darwin'
      const wordLeftKey = isMac ? 'Alt+ArrowLeft' : 'Ctrl+ArrowLeft'

      await page.keyboard.press(wordLeftKey)
      position = await getCaretPosition(page, '[role="textbox"]')

      // Should move to beginning of "test"
      expect(position).toBe(22)

      // Move left by word again
      await page.keyboard.press(wordLeftKey)
      position = await getCaretPosition(page, '[role="textbox"]')

      // Should move to beginning of "world"
      expect(position).toBe(16)
    }),
  )

  test(
    'Option+ArrowRight word navigation (macOS) / Ctrl+ArrowRight (Windows/Linux)',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello wonderful world test')

      // Start at beginning
      await moveCaretToStart(editor)
      let position = await getCaretPosition(page, '[role="textbox"]')
      expect(position).toBe(0)

      // Move right by word - use different keys for different platforms
      const isMac = process.platform === 'darwin'
      const wordRightKey = isMac ? 'Alt+ArrowRight' : 'Ctrl+ArrowRight'

      await page.keyboard.press(wordRightKey)
      position = await getCaretPosition(page, '[role="textbox"]')

      // Should move to end of "Hello"
      expect(position).toBe(5)
    }),
  )

  test(
    'Meta+ArrowLeft/Right line navigation (macOS) / Ctrl+ArrowLeft/Right word navigation (Windows/Linux)',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello wonderful world test')

      // Start at middle - position at 'l' in "Hello"
      await moveCaretToStart(editor)
      await page.keyboard.press('ArrowRight+ArrowRight+ArrowRight')
      let position = await getCaretPosition(page, '[role="textbox"]')
      expect(position).toBe(3)

      const isMac = process.platform === 'darwin'

      if (isMac) {
        // On macOS: Meta+ArrowLeft should go to line start
        await page.keyboard.press('Meta+ArrowLeft')
        position = await getCaretPosition(page, '[role="textbox"]')
        expect(position).toBe(0) // Beginning of line

        // Meta+ArrowRight should go to line end
        await page.keyboard.press('Meta+ArrowRight')
        position = await getCaretPosition(page, '[role="textbox"]')
        expect(position).toBe(26) // End of line
      } else {
        // On Windows/Linux: Ctrl+ArrowLeft should do word navigation
        await page.keyboard.press('Ctrl+ArrowLeft')
        position = await getCaretPosition(page, '[role="textbox"]')
        expect(position).toBe(0) // Beginning of "Hello"
      }
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
    'Shift+Option+Arrow word selection (macOS) / Shift+Ctrl+Arrow (Windows/Linux)',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello wonderful world')

      // Position cursor at start of "wonderful" (after the space)
      await moveCaretToStart(editor)

      const isMac = process.platform === 'darwin'
      const wordRightKey = isMac ? 'Alt+ArrowRight' : 'Ctrl+ArrowRight'
      const selectWordRightKey = isMac ? 'Shift+Alt+ArrowRight' : 'Shift+Ctrl+ArrowRight'

      // Move to end of "Hello" (position 5), then move one more character to get to start of "wonderful"
      await page.keyboard.press(wordRightKey) // Now at position 5 (end of "Hello")
      await page.keyboard.press('ArrowRight') // Now at position 6 (start of "wonderful")

      // Select word to the right
      await page.keyboard.press(selectWordRightKey)

      // Type to replace selection
      await page.keyboard.type('amazing')

      await expect(editor).toHaveText('Hello amazing world')
    }),
  )

  test(
    'Ctrl/Meta+C and Ctrl/Meta+V copy/paste keybindings',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      await page.keyboard.press('ControlOrMeta+a')
      await page.keyboard.press('ControlOrMeta+c')

      await page.keyboard.press('ArrowRight')
      await editor.pressSequentially(' ')
      await page.keyboard.press('ControlOrMeta+v')

      await expect(editor).toHaveText('Hello World Hello World')
    }),
  )

  test(
    'Shift+Arrow selection keybindings',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      await page.keyboard.press('Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft')
      await page.keyboard.press('Delete')

      await expect(editor).toHaveText('Hello ')
    }),
  )

  test(
    'Ctrl/Meta+X cut keybinding',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      await page.keyboard.press('Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft')
      await page.keyboard.press('ControlOrMeta+x')

      await expect(editor).toHaveText('Hello ')

      await page.keyboard.press('ControlOrMeta+v')
      await expect(editor).toHaveText('Hello World')
    }),
  )

  test(
    'Alt/Ctrl+Arrow word navigation keybindings',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello Beautiful World')

      // Word navigation left
      const wordLeftKey = process.platform === 'darwin' ? 'Alt+ArrowLeft' : 'Control+ArrowLeft'
      await page.keyboard.press(wordLeftKey)
      await editor.pressSequentially('Amazing ')
      await expect(editor).toHaveText('Hello Beautiful Amazing World')
    }),
  )

  test(
    'Ctrl/Meta+A select all with large text',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      const largeText = 'Lorem ipsum '.repeat(100)
      await editor.fill(largeText)

      await page.keyboard.press('ControlOrMeta+a')
      await editor.pressSequentially('Replaced')
      await expect(editor).toHaveText('Replaced')
    }),
  )
})
