import { expect, test } from '@playwright/test'
import { 
  selectAndClear,
  simulateComposition,
  simulateCancelledComposition,
  simulateJapaneseInput,
  simulateChineseInput,
  simulateKoreanInput,
  startCompositionWithoutEnding,
  endComposition
} from './utils'

/**
 * IME (Input Method Editor) tests for CJK language support
 * These tests simulate composition events to test IME input behavior
 */
test.describe('IME and Composition Events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('composition events work for Japanese input', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Simulate Japanese IME input for "konnichiwa" (こんにちは)
    await simulateJapaneseInput(page, '[role="textbox"]', 'konnichiwa', 'こんにちは')

    await expect(editor).toHaveText('こんにちは')
  })

  test('composition events work for Chinese input', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Simulate Chinese IME input for "nihao" (你好)
    await simulateChineseInput(page, '[role="textbox"]', 'nihao', '你好')

    await expect(editor).toHaveText('你好')
  })

  test('composition events work for Korean input', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Simulate Korean IME input for "annyeong" (안녕)
    // Korean IME builds characters step by step
    const koreanSteps = [
      'ㅇ',      // First character starts
      '아',      // Add vowel
      '안',      // Complete first character
      '안ㄴ',    // Start second character
      '안녀',    // Add vowel
      '안녕'     // Complete word
    ]
    await simulateKoreanInput(page, '[role="textbox"]', koreanSteps, '안녕')

    await expect(editor).toHaveText('안녕')
  })

  test('handles composition cancellation', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    
    // Type initial text
    await editor.type('Hello ')
    
    // Simulate a cancelled composition
    await simulateCancelledComposition(page, '[role="textbox"]', ['こんに'])

    // Text should remain unchanged after cancelled composition
    await expect(editor).toHaveText('Hello ')
  })

  test('handles composition with existing selection', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    
    // Type initial text
    await editor.type('Hello World')
    
    // Select "World"
    await page.keyboard.press('Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft')
    
    // Start composition which should replace selection
    await simulateComposition(page, '[role="textbox"]', ['世界'], '世界')

    await expect(editor).toHaveText('Hello 世界')
  })

  test('handles multiple rapid compositions', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)
    
    // Simulate rapid composition inputs
    await simulateComposition(page, '[role="textbox"]', ['你'], '你')
    await simulateComposition(page, '[role="textbox"]', ['好'], '好')

    await expect(editor).toHaveText('你好')
  })

  test('handles direct Unicode input', async ({ page }) => {
    // Test direct Unicode character input (not IME composition)
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Direct input of Unicode characters
    await page.evaluate(() => {
      const editor = document.querySelector('[role="textbox"]') as HTMLElement
      if (editor) {
        const event = new InputEvent('beforeinput', {
          inputType: 'insertText',
          data: '你好世界',
          bubbles: true,
          cancelable: true,
        })
        editor.dispatchEvent(event)
      }
    })

    await expect(editor).toHaveText('你好世界')
  })

  test('handles complex emoji input', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Test complex emoji sequences
    const complexEmoji = '👨‍👩‍👧‍👦' // Family emoji
    await editor.type(complexEmoji)

    await expect(editor).toHaveText(complexEmoji)
  })

  test('handles emoji with skin tone modifiers', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    const emojiWithSkinTone = '👋🏽' // Waving hand with medium skin tone
    await editor.type(emojiWithSkinTone)

    await expect(editor).toHaveText(emojiWithSkinTone)
  })

  test('preserves character clusters during deletion', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Type a complex emoji sequence
    const complexEmoji = '👨‍👩‍👧‍👦'
    await editor.type(`Hello ${complexEmoji} World`)

    // Position cursor after the emoji
    await page.keyboard.press('Home')
    for (let i = 0; i < 7; i++) {
      // Move past "Hello "
      await page.keyboard.press('ArrowRight')
    }

    // Delete the emoji - should delete the entire cluster
    await page.keyboard.press('Delete')

    await expect(editor).toHaveText('Hello  World')
  })
})

test.describe('RTL and Bidirectional Text', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('handles Arabic text direction', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    const arabicText = 'مرحبا بالعالم'
    await editor.type(arabicText)

    await expect(editor).toHaveText(arabicText)

    // Check that the text direction is properly handled
    const computedStyle = await editor.evaluate(el => getComputedStyle(el).direction)
    // Note: Direction might be auto-detected by the browser
    expect(['ltr', 'rtl']).toContain(computedStyle)
  })

  test('handles Hebrew text direction', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    const hebrewText = 'שלום עולם'
    await editor.type(hebrewText)

    await expect(editor).toHaveText(hebrewText)
  })

  test('handles mixed LTR/RTL text', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    const mixedText = 'Hello مرحبا World עולם'
    await editor.type(mixedText)

    await expect(editor).toHaveText(mixedText)
  })

  test('cursor navigation works in RTL text', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    const arabicText = 'مرحبا'
    await editor.type(arabicText)

    // Move to beginning and add text
    await page.keyboard.press('Home')
    await editor.type('بداية ')

    await expect(editor).toHaveText('بداية مرحبا')
  })
})

test.describe('Advanced Composition Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('handles composition with accented characters', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Simulate composition for Vietnamese with diacritics
    await simulateComposition(page, '[role="textbox"]', ['e', 'ê', 'ế'], 'ế')

    await expect(editor).toHaveText('ế')
  })

  test('handles composition during undo/redo', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Type some text
    await editor.type('Initial text ')

    // Start composition but don't complete it
    await startCompositionWithoutEnding(page, '[role="textbox"]', ['こんに'])

    // Try to undo - composition should be cancelled first
    await page.keyboard.press('ControlOrMeta+z')

    // Complete composition after undo attempt (cancelled)
    await endComposition(page, '[role="textbox"]', '')

    // Text should still be there
    await expect(editor).toHaveText('Initial text ')
  })

  test('handles Thai character composition', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Thai uses complex character combinations
    const thaiSteps = ['ส', 'สว', 'สวั', 'สวัส', 'สวัสด', 'สวัสดี']
    await simulateComposition(page, '[role="textbox"]', thaiSteps, 'สวัสดี')

    await expect(editor).toHaveText('สวัสดี')
  })

  test('handles Japanese with kanji conversion', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Simulate "konnichiwa" with kanji conversion
    await simulateJapaneseInput(page, '[role="textbox"]', 'konnichiwa', 'こんにちは', '今日は')

    await expect(editor).toHaveText('今日は')
  })

  test('handles partial composition commits', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Start a longer composition but commit partial results
    await startCompositionWithoutEnding(page, '[role="textbox"]', ['nihao'])
    await endComposition(page, '[role="textbox"]', 'ni')  // Partial commit
    
    // Start another composition for the rest
    await simulateChineseInput(page, '[role="textbox"]', 'hao', '好')

    await expect(editor).toHaveText('ni好')
  })

  test('handles composition with mixed script insertion', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    // Type English text
    await editor.type('Hello ')
    
    // Add Japanese via composition
    await simulateJapaneseInput(page, '[role="textbox"]', 'sekai', '世界')
    
    // Add more English
    await editor.type(' World')

    await expect(editor).toHaveText('Hello 世界 World')
  })
})