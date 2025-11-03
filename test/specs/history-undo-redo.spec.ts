import { expect, test } from '@playwright/test'
import { getCaretPosition, redo, selectAndClear, setup, simulateComposition, undo } from './utils'

/**
 * History and Undo/Redo Tests
 * Tests undo/redo functionality and history management
 */
test.describe('ContentEditable - History (Undo/Redo)', () => {
  test(
    'basic undo and redo',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await expect(editor).toHaveText('')

      await editor.fill('Hello')
      await expect(editor).toHaveText('Hello')

      await editor.pressSequentially(' World')
      await expect(editor).toHaveText('Hello World')

      // Use input event for undo - all insertText operations are grouped
      await undo(page)
      await expect(editor).toHaveText('') // All insertText grouped together

      // Use input event for redo
      await redo(page)
      await expect(editor).toHaveText('Hello World')
    }),
  )

  test(
    'historyUndo and historyRedo work correctly',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()

      await selectAndClear(page, editor)
      await expect(editor).toHaveText('')

      await editor.fill('Hello')
      await expect(editor).toHaveText('Hello')

      await editor.pressSequentially(' World')
      await expect(editor).toHaveText('Hello World')

      await undo(page)
      await expect(editor).toHaveText('') // All insertText grouped together

      await redo(page)
      await expect(editor).toHaveText('Hello World')
    }),
  )

  test(
    'undo respects caret position',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      for (let i = 0; i < 'World'.length; i++) {
        await page.keyboard.press('ArrowLeft')
      }

      await editor.pressSequentially('X')
      await expect(editor).toHaveText('Hello XWorld')

      await undo(page)
      await expect(editor).toHaveText('Hello World') // Undo just the "X" insertion
    }),
  )

  test(
    'multiple undo operations',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      await editor.fill('One')
      await editor.pressSequentially(' Two')
      await editor.pressSequentially(' Three')

      // All insertText operations are grouped together with new behavior
      await undo(page)
      await expect(editor).toHaveText('') // All text operations grouped

      // No more undo operations after this
      await undo(page)
      await expect(editor).toHaveText('') // Still empty

      await undo(page)
      await expect(editor).toHaveText('') // Still empty
    }),
  )

  test(
    'redo after multiple undos',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      await editor.fill('One')
      await editor.pressSequentially(' Two')
      await editor.pressSequentially(' Three')

      // Single undo removes all text (grouped)
      await undo(page)
      await expect(editor).toHaveText('')

      // Second undo has no effect
      await undo(page)
      await expect(editor).toHaveText('')

      // Single redo restores all text
      await redo(page)
      await expect(editor).toHaveText('One Two Three')

      // Second redo has no effect
      await redo(page)
      await expect(editor).toHaveText('One Two Three')
    }),
  )

  test(
    'history is cleared after new input',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      await editor.fill('Original')
      await undo(page)
      await expect(editor).toHaveText('')

      await editor.fill('New')
      await redo(page)
      await expect(editor).toHaveText('New')
    }),
  )

  test(
    'composition events integrate with history',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      await editor.fill('Hello ')
      await simulateComposition(page, '[role="textbox"]', ['世界'], '世界')
      await expect(editor).toHaveText('Hello 世界')

      await undo(page)
      await expect(editor).toHaveText('Hello ') // Undo just the composition

      await redo(page)
      await expect(editor).toHaveText('Hello 世界')
    }),
  )

  test(
    'deletion operations can be undone',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      await page.keyboard.press('Backspace')
      await expect(editor).toHaveText('Hello Worl')

      await undo(page)
      await expect(editor).toHaveText('Hello World')
    }),
  )

  test(
    'word deletion can be undone',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello Beautiful World')

      const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'
      await page.keyboard.press(deleteWordKey)
      await expect(editor).toHaveText('Hello Beautiful ') // This should fail due to delete-word bug

      await undo(page)
      await expect(editor).toHaveText('Hello Beautiful World')
    }),
  )

  test(
    'paste operations can be undone',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello')

      await page.keyboard.press('ControlOrMeta+a')
      await page.keyboard.press('ControlOrMeta+c')
      await page.keyboard.press('ArrowRight')
      await editor.pressSequentially(' ')
      await page.keyboard.press('ControlOrMeta+v')

      await expect(editor).toHaveText('Hello Hello')

      await undo(page)
      await expect(editor).toHaveText('Hello ')
    }),
  )

  test(
    'cut operations can be undone',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      await page.dblclick('[role="textbox"]', { position: { x: 80, y: 10 } })
      await page.keyboard.press('ControlOrMeta+x')
      await expect(editor).toHaveText('Hello ')

      await undo(page)
      await expect(editor).toHaveText('Hello World')
    }),
  )

  test(
    'multiple undos and redos should restore caret position correctly',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      // Type first word
      await editor.pressSequentially('Hello')
      await expect(editor).toHaveText('Hello')
      expect(await getCaretPosition(page, '[role="textbox"]')).toBe(5)

      // Add space and second word (different typing session)
      await page.waitForTimeout(100) // Small delay to potentially separate operations
      await editor.pressSequentially(' World')
      await expect(editor).toHaveText('Hello World')
      expect(await getCaretPosition(page, '[role="textbox"]')).toBe(11)

      // Delete some characters
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace')
      await page.keyboard.press('Backspace')
      await expect(editor).toHaveText('Hello Wo')
      expect(await getCaretPosition(page, '[role="textbox"]')).toBe(8)

      // Now test undo/redo cycle
      await undo(page) // Should undo the deletions
      await expect(editor).toHaveText('Hello World')
      expect(await getCaretPosition(page, '[role="textbox"]')).toBe(11)

      await undo(page) // Should undo all grouped text entry
      await expect(editor).toHaveText('') // All insertText operations are grouped
      expect(await getCaretPosition(page, '[role="textbox"]')).toBe(0)

      // Test redo
      await redo(page) // Should restore the grouped text operations
      await expect(editor).toHaveText('Hello World')
      expect(await getCaretPosition(page, '[role="textbox"]')).toBe(11)

      await redo(page) // Should restore the deletions
      await expect(editor).toHaveText('Hello Wo')
      expect(await getCaretPosition(page, '[role="textbox"]')).toBe(8)
    }),
  )
})
