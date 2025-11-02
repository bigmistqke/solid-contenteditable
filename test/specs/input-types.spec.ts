import { expect, test } from '@playwright/test'
import { selectAndClear, simulateComposition } from './utils'

test.describe('Input Types Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('insertText input type works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    
    // Type regular text - triggers insertText input events
    await editor.type('Hello')
    await expect(editor).toHaveText('Hello')
    
    // Type special characters
    await editor.type(' 123!@#')
    await expect(editor).toHaveText('Hello 123!@#')
  })

  test('insertCompositionText input type works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    
    // Simulate composition (e.g., typing Chinese) - triggers insertCompositionText
    await simulateComposition(page, '[role="textbox"]', ['n', 'ni', '你'], '你')
    await expect(editor).toHaveText('你')
    
    // Add more composition text
    await simulateComposition(page, '[role="textbox"]', ['h', 'ha', 'hao', '好'], '好')
    await expect(editor).toHaveText('你好')
  })

  test('deleteContentBackward input type works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello World')
    
    // Backspace triggers deleteContentBackward
    await page.keyboard.press('Backspace')
    await expect(editor).toHaveText('Hello Worl')
    
    await page.keyboard.press('Backspace')
    await expect(editor).toHaveText('Hello Wor')
  })

  test('deleteContentForward input type works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello World')
    
    // Move cursor to middle and use Delete key - triggers deleteContentForward
    await page.keyboard.press('Home')
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight')
    }
    await page.keyboard.press('Delete')
    
    await expect(editor).toHaveText('HelloWorld')
  })

  test('deleteWordBackward input type works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello Beautiful World')
    
    // Alt+Backspace (Mac) or Ctrl+Backspace (PC) triggers deleteWordBackward
    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'
    await page.keyboard.press(deleteWordKey)
    await expect(editor).toHaveText('Hello Beautiful ')
    
    await page.keyboard.press(deleteWordKey)
    await expect(editor).toHaveText('Hello ')
  })

  test('deleteWordForward input type works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello Beautiful World')
    
    // Move to beginning and use Alt+Delete (Mac) or Ctrl+Delete (PC) - triggers deleteWordForward
    await page.keyboard.press('Home')
    const deleteWordForwardKey = process.platform === 'darwin' ? 'Alt+Delete' : 'Control+Delete'
    await page.keyboard.press(deleteWordForwardKey)
    await expect(editor).toHaveText(' Beautiful World')
    
    await page.keyboard.press(deleteWordForwardKey)
    await expect(editor).toHaveText(' World')
  })

  test('deleteSoftLineBackward input type works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello World. This is a test.')
    
    // Cmd+Backspace (Mac) should trigger deleteSoftLineBackward
    // Note: Most browsers don't map this by default, so we simulate the input event
    await page.evaluate(() => {
      const element = document.querySelector('[role="textbox"]') as HTMLElement
      element.dispatchEvent(new InputEvent('input', {
        inputType: 'deleteSoftLineBackward',
        bubbles: true,
        cancelable: true
      }))
    })
    
    // Should delete from cursor to beginning of line
    const text = await editor.textContent()
    expect(text).not.toBe('Hello World. This is a test.')
    expect(text.length).toBeLessThan('Hello World. This is a test.'.length)
  })

  test('deleteSoftLineForward input type works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello World. This is a test.')
    await page.keyboard.press('Home') // Move to beginning
    
    // Ctrl+K (Mac/Linux) should trigger deleteSoftLineForward
    // Note: Most browsers don't map this by default, so we simulate the input event
    await page.evaluate(() => {
      const element = document.querySelector('[role="textbox"]') as HTMLElement
      element.dispatchEvent(new InputEvent('input', {
        inputType: 'deleteSoftLineForward',
        bubbles: true,
        cancelable: true
      }))
    })
    
    // Should delete from cursor to end of line
    const text = await editor.textContent()
    expect(text).not.toBe('Hello World. This is a test.')
    expect(text.length).toBeLessThan('Hello World. This is a test.'.length)
  })

  test('deleteByCut input type works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello World')
    
    // Select text using standard keyboard shortcuts and cut - triggers deleteByCut
    await page.keyboard.press('ControlOrMeta+a') // Select all
    await page.keyboard.press('ArrowLeft') // Deselect
    await page.keyboard.press('Shift+End') // Select to end
    await page.keyboard.press('ControlOrMeta+x') // Cut
    
    await expect(editor).toHaveText('Hello ')
    
    // Paste it back to verify it was cut
    await page.keyboard.press('ControlOrMeta+v')
    await expect(editor).toHaveText('Hello World')
  })

  test('insertFromPaste input type works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello')
    
    // Copy text using standard shortcuts - Ctrl+C/Cmd+C triggers copy
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+c')
    
    // Move to end and paste - Ctrl+V/Cmd+V triggers insertFromPaste
    await page.keyboard.press('ArrowRight')
    await editor.type(' ')
    await page.keyboard.press('ControlOrMeta+v')
    
    await expect(editor).toHaveText('Hello Hello')
  })

  test('insertReplacementText input type works', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello World')
    
    // Select text using standard shortcuts
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Shift+End')
    
    // Copy some replacement text to clipboard first
    await page.evaluate(() => navigator.clipboard.writeText('Universe'))
    
    // Paste over selection - this often triggers insertReplacementText
    await page.keyboard.press('ControlOrMeta+v')
    
    await expect(editor).toHaveText('Hello Universe')
  })

  test('insertLineBreak input type works in multiline mode', async ({ page }) => {
    const multilineEditor = page.locator('[role="textbox"][aria-multiline="true"]').first()
    await selectAndClear(page, multilineEditor)
    await multilineEditor.type('First line')
    
    // Enter key triggers insertLineBreak in multiline mode
    await page.keyboard.press('Enter')
    await multilineEditor.type('Second line')
    
    await expect(multilineEditor).toHaveText('First line\nSecond line')
  })

  test('insertLineBreak input type is blocked in singleline mode', async ({ page }) => {
    const singlelineEditor = page.locator('[role="textbox"][aria-multiline="false"]').first()
    if ((await singlelineEditor.count()) > 0) {
      await selectAndClear(page, singlelineEditor)
      await singlelineEditor.type('Single line')
      
      // Enter key should be blocked in singleline mode
      await page.keyboard.press('Enter')
      await singlelineEditor.type('Still same line')
      
      // Should not contain newline
      await expect(singlelineEditor).toHaveText('Single lineStill same line')
    }
  })

  test('insertParagraph input type works in multiline mode', async ({ page }) => {
    const multilineEditor = page.locator('[role="textbox"][aria-multiline="true"]').first()
    await selectAndClear(page, multilineEditor)
    await multilineEditor.type('First paragraph')
    
    // Shift+Enter often triggers insertParagraph instead of insertLineBreak
    // Note: Browser behavior varies, so we simulate the event
    await page.evaluate(() => {
      const element = document.querySelector('[role="textbox"][aria-multiline="true"]') as HTMLElement
      element.dispatchEvent(new InputEvent('input', {
        inputType: 'insertParagraph',
        bubbles: true,
        cancelable: true
      }))
    })
    
    await multilineEditor.type('Second paragraph')
    
    await expect(multilineEditor).toHaveText('First paragraph\nSecond paragraph')
  })

  test('historyUndo and historyRedo work correctly', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    
    // Type some text
    await editor.type('Hello')
    await editor.type(' World')
    
    // Ctrl+Z/Cmd+Z triggers undo
    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('Hello')
    
    // Ctrl+Shift+Z/Cmd+Shift+Z triggers redo
    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect(editor).toHaveText('Hello World')
  })

  test('caret movements are tracked in history', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await editor.type('Hello World')
    
    // Arrow keys move cursor and create caret history entries
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    
    // Type something
    await editor.type('X')
    await expect(editor).toHaveText('Hello XWorld')
    
    // Undo should respect caret position
    await page.keyboard.press('ControlOrMeta+z')
    await expect(editor).toHaveText('Hello World')
  })

  test('selection deletion works with all deletion types', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    
    // Test deleteContentBackward with selection using Shift+Arrow
    await selectAndClear(page, editor)
    await editor.type('Hello World')
    await page.keyboard.press('Shift+Home') // Select to beginning
    await page.keyboard.press('Backspace')
    await expect(editor).toHaveText('')
    
    // Test deleteContentForward with selection
    await selectAndClear(page, editor)
    await editor.type('Hello World')
    await page.keyboard.press('Home')
    await page.keyboard.press('Shift+End') // Select to end
    await page.keyboard.press('Delete')
    await expect(editor).toHaveText('')
    
    // Test deleteWordBackward with selection (should behave like deleteContentBackward)
    await selectAndClear(page, editor)
    await editor.type('Hello Beautiful World')
    await page.keyboard.press('Shift+Home') // Select to beginning
    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'
    await page.keyboard.press(deleteWordKey)
    await expect(editor).toHaveText('')
  })

  test('grapheme cluster support in deletion', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    
    // Type text with complex emoji
    await editor.type('Hello 👨‍👩‍👧‍👦 World')
    
    // Position cursor after the emoji and delete backward
    await page.keyboard.press('End')
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('ArrowLeft')
    }
    await page.keyboard.press('Backspace')
    
    // Should delete the entire emoji cluster, not just part of it
    await expect(editor).toHaveText('Hello  World')
  })

  test('word boundary detection works across languages', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'
    
    // Test with Chinese text (no spaces)
    await selectAndClear(page, editor)
    await editor.type('你好世界')
    await page.keyboard.press(deleteWordKey)
    
    // Should delete word-like segments
    const chineseText = await editor.textContent()
    expect(chineseText).not.toBe('你好世界')
    expect(chineseText.length).toBeLessThan(4)
    
    // Test with mixed language
    await selectAndClear(page, editor)
    await editor.type('Hello世界')
    await page.keyboard.press(deleteWordKey)
    
    const mixedText = await editor.textContent()
    expect(mixedText).not.toBe('Hello世界')
  })
})