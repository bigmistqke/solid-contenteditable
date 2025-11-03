import { expect, test } from '@playwright/test'
import { dispatchBeforeInputEvent, log, selectAndClear, selectLastWord, setup } from './utils'

/**
 * Input Event Types Tests
 * Tests all beforeinput event types for proper handling
 */
test.describe('ContentEditable - Input Event Types', () => {
  setup(test)

  test('insertText input type', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello')
    await expect(editor).toHaveText('Hello')
    await editor.pressSequentially(' 123!@#')
    await expect(editor).toHaveText('Hello 123!@#')
  })

  test('deleteContentBackward input type', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello World')
    await page.keyboard.press('Backspace')
    await expect(editor).toHaveText('Hello Worl')
    await page.keyboard.press('Backspace')
    await expect(editor).toHaveText('Hello Wor')
  })

  test(
    'deleteContentForward input type',
    log(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World')
      await page.keyboard.press('Home')
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('ArrowRight')
      }
      await page.keyboard.press('Delete')
      await expect(editor).toHaveText('HelloWorld')
    }),
  )

  test('deleteWordBackward input type', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello Beautiful World')
    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'
    await page.keyboard.press(deleteWordKey)
    await expect(editor).toHaveText('Hello Beautiful ')
    await page.keyboard.press(deleteWordKey)
    await expect(editor).toHaveText('Hello ')
  })

  test(
    'deleteWordForward input type',
    log(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello Beautiful World')
      await page.keyboard.press('Home')
      const deleteWordForwardKey = process.platform === 'darwin' ? 'Alt+Delete' : 'Control+Delete'

      const initialText = await editor.textContent()
      await page.keyboard.press(deleteWordForwardKey)
      const afterFirstDelete = await editor.textContent()

      if (afterFirstDelete === initialText) {
        await dispatchBeforeInputEvent(page, '[role="textbox"]', 'deleteWordForward')
        const text = await editor.textContent()
        expect(text || '').not.toBe('Hello Beautiful World')
        expect((text || '').startsWith('Beautiful') || (text || '').startsWith(' Beautiful')).toBe(
          true,
        )
      } else {
        expect(afterFirstDelete || '').not.toBe(initialText || '')
        expect((afterFirstDelete || '').length).toBeLessThan((initialText || '').length)
      }
    }),
  )

  test('deleteSoftLineBackward input type', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello World. This is a test.')

    await dispatchBeforeInputEvent(page, '[role="textbox"]', 'deleteSoftLineBackward')

    const text = await editor.textContent()
    expect(text || '').not.toBe('Hello World. This is a test.')
    expect((text || '').length).toBeLessThan('Hello World. This is a test.'.length)
  })

  test(
    'deleteSoftLineForward input type',
    log(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)
      await editor.fill('Hello World. This is a test.')
      await page.keyboard.press('Home')

      await dispatchBeforeInputEvent(page, '[role="textbox"]', 'deleteSoftLineForward')

      const text = await editor.textContent()
      expect(text || '').not.toBe('Hello World. This is a test.')
      expect((text || '').length).toBeLessThan('Hello World. This is a test.'.length)
    }),
  )

  test('deleteByCut input type', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello World')

    // Select the last word "World" using keyboard navigation
    await selectLastWord(page, editor)

    await page.keyboard.press('ControlOrMeta+x')

    const textAfterCut = await editor.textContent()
    expect(textAfterCut).toBe('Hello ')

    await page.keyboard.press('ControlOrMeta+v')
    const textAfterPaste = await editor.textContent()
    expect(textAfterPaste).toBe('Hello World')
  })

  test('insertFromPaste input type', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello')

    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+c')

    await page.keyboard.press('ArrowRight')
    await editor.pressSequentially(' ')
    await page.keyboard.press('ControlOrMeta+v')

    await expect(editor).toHaveText('Hello Hello')
  })

  test('insertReplacementText input type', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello World')

    // Select the last word "World" using keyboard navigation
    await selectLastWord(page, editor)

    await dispatchBeforeInputEvent(page, '[role="textbox"]', 'insertReplacementText', {
      data: 'Universe',
      dataTransferData: 'Universe',
    })

    await expect(editor).toHaveText('Hello Universe')
  })

  test('insertLineBreak in multiline mode', async ({ page }) => {
    const multilineEditor = page.locator('[role="textbox"][aria-multiline="true"]').first()
    await selectAndClear(page, multilineEditor)
    await multilineEditor.fill('First line')

    await page.keyboard.press('Enter')
    await multilineEditor.pressSequentially('Second line')

    await expect(multilineEditor).toHaveText('First line\nSecond line')
  })

  test('insertLineBreak blocked in singleline mode', async ({ page }) => {
    const singlelineEditor = page.locator('[role="textbox"][aria-multiline="false"]').first()
    if ((await singlelineEditor.count()) > 0) {
      await selectAndClear(page, singlelineEditor)
      await singlelineEditor.fill('Single line')

      await page.keyboard.press('Enter')
      await singlelineEditor.pressSequentially('Still same line')

      await expect(singlelineEditor).toHaveText('Single lineStill same line')
    }
  })

  test('insertParagraph input type', async ({ page }) => {
    const multilineEditor = page.locator('[role="textbox"][aria-multiline="true"]').first()
    await selectAndClear(page, multilineEditor)
    await multilineEditor.fill('First paragraph')

    await dispatchBeforeInputEvent(
      page,
      '[role="textbox"][aria-multiline="true"]',
      'insertParagraph',
    )

    await multilineEditor.pressSequentially('Second paragraph')

    await expect(multilineEditor).toHaveText('First paragraph\nSecond paragraph')
  })

  test('selection deletion with deleteContentBackward', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()

    await selectAndClear(page, editor)
    await editor.fill('Hello World')
    await page.keyboard.press('Shift+Home')
    await page.keyboard.press('Backspace')
    await expect(editor).toHaveText('')
  })

  test(
    'selection deletion with deleteContentForward',
    log(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()

      await selectAndClear(page, editor)
      await editor.fill('Hello World')
      await page.keyboard.press('Home')
      await page.keyboard.press('Shift+End')
      await page.keyboard.press('Delete')
      await expect(editor).toHaveText('')
    }),
  )

  test('selection deletion with deleteWordBackward', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.fill('Hello Beautiful World')
    await page.keyboard.press('Shift+Home')

    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'
    await page.keyboard.press(deleteWordKey)
    await expect(editor).toHaveText('')
  })
})
