import { expect, test } from '@playwright/test'
import { moveCaretToEnd, moveCaretToStart, selectAll, selectAndClear, setup } from './utils'

/**
 * Selection and Navigation Tests
 * Tests text selection, cursor movement, and navigation functionality
 */
test.describe('ContentEditable - Selection & Navigation', () => {
  test(
    'arrow key navigation',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      await moveCaretToStart(editor)
      await editor.pressSequentially('Hi ')
      await expect(editor).toHaveText('Hi Hello World')
    }),
  )

  test(
    'cursor position is correct after deletion',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      await moveCaretToStart(editor)
      await page.keyboard.press('ArrowRight+ArrowRight+ArrowRight+ArrowRight+ArrowRight')

      await editor.pressSequentially('X')
      await expect(editor).toHaveText('HelloX World')
    }),
  )

  test(
    'visual cursor position is correct',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      await moveCaretToStart(editor)
      await page.keyboard.press('ArrowRight+ArrowRight+ArrowRight+ArrowRight+ArrowRight')

      await editor.pressSequentially('X')
      await expect(editor).toHaveText('HelloX World')
    }),
  )

  test('selection works with double-click', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello World')

    await page.dblclick('[role="textbox"]', { position: { x: 30, y: 10 } })
    await editor.pressSequentially('Hi')
    await expect(editor).toHaveText('Hi World')
  })

  test('copy and paste operations', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello World')

    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+c')

    await page.keyboard.press('ArrowRight')
    await editor.pressSequentially(' ')
    await page.keyboard.press('ControlOrMeta+v')

    await expect(editor).toHaveText('Hello World Hello World')
  })

  test('selection and deletion work', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello World')

    await page.keyboard.press('Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft')
    await page.keyboard.press('Delete')

    await expect(editor).toHaveText('Hello ')
  })

  test('handles cut operation', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello World')

    await page.keyboard.press('Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft')
    await page.keyboard.press('ControlOrMeta+x')

    await expect(editor).toHaveText('Hello ')

    await page.keyboard.press('ControlOrMeta+v')
    await expect(editor).toHaveText('Hello World')
  })

  test('maintains focus when typing', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await expect(editor).toBeFocused()

    await editor.fill('Test')

    await expect(editor).toBeFocused()
  })

  test(
    'home and end keys work',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      await moveCaretToStart(editor)
      await editor.pressSequentially('Start ')
      await expect(editor).toHaveText('Start Hello World')

      await moveCaretToEnd(page, editor)
      await editor.pressSequentially(' End')
      await expect(editor).toHaveText('Start Hello World End')
    }),
  )

  test(
    'shift+arrow selection works',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      // Select all and replace with 'Goodbye'
      await selectAll(page, editor)
      await editor.pressSequentially('Goodbye')
      await expect(editor).toHaveText('Goodbye')

      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      // Select all text from start to end
      await selectAll(page, editor)
      await editor.pressSequentially('Replaced')
      await expect(editor).toHaveText('Replaced')
    }),
  )

  test('ctrl+a selects all text', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello World')

    await page.keyboard.press('ControlOrMeta+a')
    await editor.pressSequentially('New')
    await expect(editor).toHaveText('New')
  })

  test('arrow keys with ctrl/alt for word navigation', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello Beautiful World')

    // Word navigation left
    const wordLeftKey = process.platform === 'darwin' ? 'Alt+ArrowLeft' : 'Control+ArrowLeft'
    await page.keyboard.press(wordLeftKey)
    await editor.pressSequentially('Amazing ')
    await expect(editor).toHaveText('Hello Beautiful Amazing World')
  })

  test('handles large text selection', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    const largeText = 'Lorem ipsum '.repeat(100)
    await editor.fill(largeText)

    await page.keyboard.press('ControlOrMeta+a')
    await editor.pressSequentially('Replaced')
    await expect(editor).toHaveText('Replaced')
  })

  test(
    'selection persists across operations',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')

      await page.dblclick('[role="textbox"]', { position: { x: 30, y: 10 } })

      // Copy selected word
      await page.keyboard.press('ControlOrMeta+c')

      // Move to end and paste
      await moveCaretToEnd(page, editor)
      await editor.pressSequentially(' ')
      await page.keyboard.press('ControlOrMeta+v')

      await expect(editor).toHaveText('Hello World Hello')
    }),
  )
})
