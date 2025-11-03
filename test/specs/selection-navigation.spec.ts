import { expect, test } from '@playwright/test'
import { moveCaretToEnd, moveCaretToStart, selectAndClear, setup } from './utils'

/**
 * Selection and Navigation Tests
 * Tests text selection, cursor movement, and navigation functionality without keyboard bindings
 */
test.describe('ContentEditable - Selection & Navigation', () => {
  test(
    'selection works with double-click',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      await page.dblclick('[role="textbox"]', { position: { x: 30, y: 10 } })
      await editor.pressSequentially('Hi')
      await expect(editor).toHaveText('Hi World')
    }),
  )

  test(
    'maintains focus when typing',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      await expect(editor).toBeFocused()

      await editor.fill('Test')

      await expect(editor).toBeFocused()
    }),
  )

  test(
    'programmatic navigation works',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      await moveCaretToStart(editor)
      await editor.pressSequentially('Start ')
      await expect(editor).toHaveText('Start Hello World')

      await moveCaretToEnd(editor)
      await editor.pressSequentially(' End')
      await expect(editor).toHaveText('Start Hello World End')
    }),
  )

  test(
    'selection persists with double-click and typing',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      // Double-click to select a word
      await page.dblclick('[role="textbox"]', { position: { x: 30, y: 10 } })

      // Type to replace selected word
      await editor.pressSequentially('Beautiful')

      await expect(editor).toHaveText('Hello Beautiful')
    }),
  )
})