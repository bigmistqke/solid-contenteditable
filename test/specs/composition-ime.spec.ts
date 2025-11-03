import { expect, test } from '@playwright/test'
import {
  endComposition,
  selectAndClear,
  setup,
  simulateCancelledComposition,
  simulateChineseInput,
  simulateComposition,
  simulateJapaneseInput,
  simulateKoreanInput,
  startCompositionWithoutEnding,
  undo,
} from './utils'

/**
 * IME and Composition Events Tests
 * Tests Input Method Editor functionality for CJK languages and accented text
 */
test.describe('ContentEditable - Composition Events (IME)', () => {
  setup(test)

  test('insertCompositionText input type', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    await simulateComposition(page, '[role="textbox"]', ['n', 'ni', '你'], '你')
    await expect(editor).toHaveText('你')
    await simulateComposition(page, '[role="textbox"]', ['h', 'ha', 'hao', '好'], '好')
    await expect(editor).toHaveText('你好')
  })

  test('Japanese IME input', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await simulateJapaneseInput(page, '[role="textbox"]', 'konnichiwa', 'こんにちは')
    await expect(editor).toHaveText('こんにちは')
  })

  test('Chinese IME input', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await simulateChineseInput(page, '[role="textbox"]', 'nihao', '你好')
    await expect(editor).toHaveText('你好')
  })

  test('Korean IME input with character building', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    const koreanSteps = ['ㅇ', '아', '안', '안ㄴ', '안녀', '안녕']
    await simulateKoreanInput(page, '[role="textbox"]', koreanSteps, '안녕')
    await expect(editor).toHaveText('안녕')
  })

  test('composition with selection replacement', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await editor.fill('Hello World')
    await page.keyboard.press('Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft')

    await simulateComposition(page, '[role="textbox"]', ['世界'], '世界')
    await expect(editor).toHaveText('Hello 世界')
  })

  test('cancelled composition', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await editor.fill('Hello ')
    await simulateCancelledComposition(page, '[role="textbox"]', ['こんに'])
    await expect(editor).toHaveText('Hello ')
  })

  test('multiple rapid compositions', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await simulateComposition(page, '[role="textbox"]', ['你'], '你')
    await simulateComposition(page, '[role="textbox"]', ['好'], '好')
    await expect(editor).toHaveText('你好')
  })

  test('composition with accented characters', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await simulateComposition(page, '[role="textbox"]', ['e', 'ê', 'ế'], 'ế')
    await expect(editor).toHaveText('ế')
  })

  test('Thai character composition', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    const thaiSteps = ['ส', 'สว', 'สวั', 'สวัส', 'สวัสด', 'สวัสดี']
    await simulateComposition(page, '[role="textbox"]', thaiSteps, 'สวัสดี')
    await expect(editor).toHaveText('สวัสดี')
  })

  test('partial composition commits', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await startCompositionWithoutEnding(page, '[role="textbox"]', ['nihao'])
    await endComposition(page, '[role="textbox"]', 'ni')

    await simulateChineseInput(page, '[role="textbox"]', 'hao', '好')
    await expect(editor).toHaveText('ni好')
  })

  test('mixed script composition', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await editor.fill('Hello ')
    await simulateJapaneseInput(page, '[role="textbox"]', 'sekai', '世界')
    await editor.pressSequentially(' World')

    await expect(editor).toHaveText('Hello 世界 World')
  })

  test('Japanese with kanji conversion', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await simulateJapaneseInput(page, '[role="textbox"]', 'konnichiwa', 'こんにちは', '今日は')
    await expect(editor).toHaveText('今日は')
  })

  test('composition during undo/redo', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await editor.fill('Initial text ')
    await startCompositionWithoutEnding(page, '[role="textbox"]', ['こんに'])

    await undo(page)
    await endComposition(page, '[role="textbox"]', '')

    // With new grouping behavior, undo might remove all text
    await expect(editor).toHaveText('') // Text operations are grouped
  })

  test('handles direct Unicode input', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await page.evaluate(() => {
      const element = document.querySelector('[role="textbox"]') as HTMLElement
      if (element) {
        const event = new InputEvent('beforeinput', {
          inputType: 'insertText',
          data: '你好世界',
          bubbles: true,
          cancelable: true,
        })
        element.dispatchEvent(event)
      }
    })

    await expect(editor).toHaveText('你好世界')
  })

  test('handles null and undefined data gracefully', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    await page.evaluate(() => {
      const element = document.querySelector('[role="textbox"]') as HTMLElement
      const event = new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: null,
        bubbles: true,
        cancelable: true,
      })
      element.dispatchEvent(event)
    })

    await expect(editor).toHaveText('')
  })
})
