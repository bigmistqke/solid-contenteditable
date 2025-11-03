import { expect, test } from '@playwright/test'
import { selectAndClear, simulateComposition } from './utils'

/**
 * History and Undo/Redo Tests
 * Tests undo/redo functionality and history management
 */
test.describe('ContentEditable - History (Undo/Redo)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('basic undo and redo', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await expect(editor).toHaveText('')

    await editor.fill('Hello')
    await expect(editor).toHaveText('Hello')

    await editor.pressSequentially(' World')
    await expect(editor).toHaveText('Hello World')

    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('Hello')

    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect(editor).toHaveText('Hello World')
  })

  test('historyUndo and historyRedo work correctly', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()

    await selectAndClear(page, editor)
    await expect(editor).toHaveText('')

    await editor.fill('Hello')
    await expect(editor).toHaveText('Hello')

    await editor.pressSequentially(' World')
    await expect(editor).toHaveText('Hello World')

    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('Hello')

    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect(editor).toHaveText('Hello World')
  })

  test('undo respects caret position', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello World')

    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')

    await editor.pressSequentially('X')
    await expect(editor).toHaveText('Hello XWorld')

    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('Hello World')
  })

  test('caret movements are tracked in history', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello World')

    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')

    await editor.pressSequentially('X')
    await expect(editor).toHaveText('Hello XWorld')

    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('Hello World')
  })

  test('multiple undo operations', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await editor.fill('One')
    await editor.pressSequentially(' Two')
    await editor.pressSequentially(' Three')

    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('One Two')

    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('One')

    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('')
  })

  test('redo after multiple undos', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await editor.fill('One Two Three')

    await page.keyboard.press('ControlOrMeta+z')
    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('One')

    await page.keyboard.press('ControlOrMeta+Shift+z')
    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect(editor).toHaveText('One Two Three')
  })

  test('history is cleared after new input', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await editor.fill('Original')
    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('')

    await editor.fill('New')
    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect(editor).toHaveText('New')
  })

  test('composition events integrate with history', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await editor.fill('Hello ')
    await simulateComposition(page, '[role="textbox"]', ['世界'], '世界')
    await expect(editor).toHaveText('Hello 世界')

    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('Hello ')

    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect(editor).toHaveText('Hello 世界')
  })

  test('deletion operations can be undone', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello World')

    await page.keyboard.press('Backspace')
    await expect(editor).toHaveText('Hello Worl')

    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('Hello World')
  })

  test('word deletion can be undone', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello Beautiful World')

    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'
    await page.keyboard.press(deleteWordKey)
    await expect(editor).toHaveText('Hello Beautiful ')

    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('Hello Beautiful World')
  })

  test('paste operations can be undone', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello')

    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+c')
    await page.keyboard.press('ArrowRight')
    await editor.pressSequentially(' ')
    await page.keyboard.press('ControlOrMeta+v')

    await expect(editor).toHaveText('Hello Hello')

    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('Hello ')
  })

  test('cut operations can be undone', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello World')

    await page.dblclick('[role="textbox"]', { position: { x: 80, y: 10 } })
    await page.keyboard.press('ControlOrMeta+x')
    await expect(editor).toHaveText('Hello ')

    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('Hello World')
  })
})