import { expect, test } from '@playwright/test'
import { selectAndClear } from './utils'

test.describe('ContentEditable Browser Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('basic text deletion works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()

    await editor.click()
    await expect(editor).toBeFocused()

    await page.keyboard.press('ControlOrMeta+a')

    await page.keyboard.press('Delete')

    await expect(editor).toHaveText('')
  })

  test('basic text input works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello World')

    await expect(editor).toHaveText('Hello World')
  })

  test('selection and deletion work', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello World')

    // Select "World"
    await page.keyboard.press('Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft')
    await page.keyboard.press('Delete')

    await expect(editor).toHaveText('Hello ')
  })

  test('copy and paste work', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello World')

    // Select all and copy
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+c')

    // Move to end and paste
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press(' ')
    await page.keyboard.press('ControlOrMeta+v')

    await expect(editor).toHaveText('Hello World Hello World')
  })

  test('undo and redo work', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello')
    await editor.type(' World')

    // Undo
    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('Hello')

    await editor.click()

    // Redo
    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect(editor).toHaveText('Hello World')
  })

  test('emoji input works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Type some emoji
    await editor.type('Hello 😀👋🌍')
    await expect(editor).toHaveText('Hello 😀👋🌍')
  })

  test('backspace deletes correctly', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello World')

    // Backspace should delete one character
    await page.keyboard.press('Backspace')
    await expect(editor).toHaveText('Hello Worl')

    // Multiple backspaces
    await page.keyboard.press('Backspace')
    await page.keyboard.press('Backspace')
    await page.keyboard.press('Backspace')
    await expect(editor).toHaveText('Hello W')
  })

  test('word deletion works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello Beautiful World')

    // Delete word backward
    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'
    await page.keyboard.press(deleteWordKey)
    await expect(editor).toHaveText('Hello Beautiful ')

    await page.keyboard.press(deleteWordKey)
    await expect(editor).toHaveText('Hello ')
  })

  test('line breaks work in multiline mode', async ({ page }) => {
    // Find the multiline editor
    const multilineEditor = page.locator('[role="textbox"][aria-multiline="true"]').first()
    await selectAndClear(page, multilineEditor)
    await multilineEditor.type('Line 1')
    await page.keyboard.press('Enter')
    await multilineEditor.type('Line 2')

    await expect(multilineEditor).toHaveText('Line 1\nLine 2')
  })

  test('line breaks are prevented in singleline mode', async ({ page }) => {
    // Find the singleline editor
    const singlelineEditor = page.locator('[role="textbox"][aria-multiline="false"]').first()
    if ((await singlelineEditor.count()) > 0) {
      await selectAndClear(page, singlelineEditor)
      await singlelineEditor.type('Line 1')
      await page.keyboard.press('Enter')
      await singlelineEditor.type('Line 2')

      // Should not contain newline
      await expect(singlelineEditor).toHaveText('Line 1Line 2')
    }
  })

  test('arrow key navigation works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello World')

    // Move to beginning
    await page.keyboard.press('Home')
    await editor.type('Hi ')

    await expect(editor).toHaveText('Hi Hello World')
  })

  test('special characters work', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    const specialChars = '`~!@#$%^&*()_+-=[]{}|;:\'",./<>?'
    await editor.type(specialChars)

    await expect(editor).toHaveText(specialChars)
  })

  test('international characters work', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Test various international characters
    const texts = [
      'Héllo Wörld', // Latin with diacritics
      'Привет мир', // Cyrillic
      '你好世界', // Chinese
      'こんにちは', // Japanese
      '안녕하세요', // Korean
      'مرحبا', // Arabic
      'שלום', // Hebrew
    ]

    for (const text of texts) {
      await selectAndClear(page, editor)
      await editor.type(text)
      await expect(editor).toHaveText(text)
    }
  })

  test('handles rapid typing', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Type quickly
    const text = 'The quick brown fox jumps over the lazy dog'
    await editor.type(text, { delay: 10 })

    await expect(editor).toHaveText(text)
  })

  test('handles cut operation', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello World')

    // Select "World" and cut
    await page.keyboard.press('Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft')
    await page.keyboard.press('ControlOrMeta+x')

    await expect(editor).toHaveText('Hello ')

    // Paste it back
    await page.keyboard.press('ControlOrMeta+v')
    await expect(editor).toHaveText('Hello World')
  })

  test('maintains focus when typing', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Editor should be focused
    await expect(editor).toBeFocused()

    await editor.type('Test')

    // Should still be focused after typing
    await expect(editor).toBeFocused()
  })

  test('visual cursor position is correct', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello World')

    // Move cursor to middle
    await page.keyboard.press('Home')
    await page.keyboard.press('ArrowRight+ArrowRight+ArrowRight+ArrowRight+ArrowRight')

    // Type character - should insert in middle
    await editor.type('X')
    await expect(editor).toHaveText('HelloX World')
  })

  test('word deletion works with languages without spaces', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'
    
    // Test Thai text (no spaces between words)
    await selectAndClear(page, editor)
    await editor.type('ภาษาไทย') // "Thai language"
    
    // Delete word backward should delete the last word
    await page.keyboard.press(deleteWordKey)
    // Due to Thai word segmentation, it should delete "ไทย" (Thai)
    await expect(editor).toHaveText('ภาษา')
    
    // Test Chinese text (no spaces between words)
    await selectAndClear(page, editor)
    await editor.type('中文测试') // "Chinese test"
    
    // Delete word backward should delete based on word boundaries
    await page.keyboard.press(deleteWordKey)
    // Should delete "测试" (test)
    await expect(editor).toHaveText('中文')
    
    // Test Lao text (no spaces between words)
    await selectAndClear(page, editor)
    await editor.type('ພາສາລາວ') // "Lao language"
    
    // Delete word backward
    await page.keyboard.press(deleteWordKey)
    // Should delete the last word based on Lao word segmentation
    const laoText = await editor.textContent()
    expect(laoText).not.toBe('ພາສາລາວ') // Should have deleted something
    expect(laoText.length).toBeLessThan(7) // Original length is 7
  })

  test('word deletion forward works with languages without spaces', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    const deleteWordForwardKey = process.platform === 'darwin' ? 'Alt+Delete' : 'Control+Delete'
    
    // Test Thai text
    await selectAndClear(page, editor)
    await editor.type('ภาษาไทย') // "Thai language"
    await page.keyboard.press('Home') // Move to beginning
    
    // Delete word forward should delete the first word
    await page.keyboard.press(deleteWordForwardKey)
    // Should delete "ภาษา" (language)
    await expect(editor).toHaveText('ไทย')
    
    // Test Chinese text
    await selectAndClear(page, editor)
    await editor.type('中文测试') // "Chinese test"
    await page.keyboard.press('Home')
    
    // Delete word forward
    await page.keyboard.press(deleteWordForwardKey)
    // Should delete "中文" (Chinese)
    await expect(editor).toHaveText('测试')
  })

  test('mixed language word deletion works correctly', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'
    
    // Test mixed English and Chinese
    await selectAndClear(page, editor)
    await editor.type('Hello世界World')
    
    // Delete word backward should delete "World"
    await page.keyboard.press(deleteWordKey)
    await expect(editor).toHaveText('Hello世界')
    
    // Delete again should delete "世界"
    await page.keyboard.press(deleteWordKey)
    await expect(editor).toHaveText('Hello')
    
    // Test mixed with spaces
    await selectAndClear(page, editor)
    await editor.type('Test 中文 Word')
    
    // Delete word backward should delete "Word"
    await page.keyboard.press(deleteWordKey)
    await expect(editor).toHaveText('Test 中文 ')
    
    // Delete again should delete "中文" along with trailing space
    await page.keyboard.press(deleteWordKey)
    await expect(editor).toHaveText('Test ')
  })
})
