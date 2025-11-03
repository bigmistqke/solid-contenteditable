import { expect, test } from '@playwright/test'
import { moveCaretToEnd, moveCaretToStart, selectAndClear, setup } from './utils'

/**
 * Unicode and Grapheme Cluster Tests
 * Tests handling of complex Unicode characters, emoji, and grapheme clusters
 */
test.describe('ContentEditable - Grapheme Clusters & Unicode', () => {
  test(
    'handles complex emoji clusters',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      const complexEmoji = '👨‍👩‍👧‍👦'
      await editor.fill(`Hello ${complexEmoji} World`)
      await expect(editor).toHaveText(`Hello ${complexEmoji} World`)
    }),
  )

  test(
    'deletes entire grapheme clusters',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      const complexEmoji = '👨‍👩‍👧‍👦'
      await editor.fill(`Hello ${complexEmoji} World`)

      await moveCaretToEnd(editor)
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('ArrowLeft')
      }
      await page.keyboard.press('Backspace')

      await expect(editor).toHaveText('Hello  World')
    }),
  )

  test(
    'handles emoji with skin tone modifiers',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      const emojiWithSkinTone = '👋🏽'
      await editor.fill(emojiWithSkinTone)
      await expect(editor).toHaveText(emojiWithSkinTone)
    }),
  )

  test(
    'handles combining diacritical marks',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      // e + combining acute accent
      const combinedChar = 'e\u0301'
      await editor.fill(combinedChar)
      await expect(editor).toHaveText(combinedChar)
    }),
  )

  test(
    'handles various Unicode scripts',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()

      const unicodeTexts = [
        'Héllo Wörld', // Latin with diacritics
        'Привет мир', // Cyrillic
        '你好世界', // Chinese
        'こんにちは', // Japanese Hiragana
        'カタカナ', // Japanese Katakana
        '안녕하세요', // Korean
        'مرحبا', // Arabic
        'שלום', // Hebrew
        'สวัสดี', // Thai
        'नमस्ते', // Devanagari (Hindi)
        '🌍🌎🌏', // Emoji
      ]

      for (const text of unicodeTexts) {
        await selectAndClear(page, editor)
        await editor.fill(text)
        await expect(editor).toHaveText(text)
      }
    }),
  )

  test(
    'handles zero-width characters',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      // Zero-width joiner (used in emoji sequences)
      const textWithZWJ = 'Hello\u200DWorld'
      await editor.fill(textWithZWJ)
      await expect(editor).toHaveText(textWithZWJ)
    }),
  )

  test(
    'preserves character clusters during deletion',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      const complexEmoji = '👨‍👩‍👧‍👦'
      await editor.fill(`Hello ${complexEmoji} World`)

      await moveCaretToStart(editor)
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('ArrowRight')
      }

      await page.keyboard.press('Delete')

      await expect(editor).toHaveText('Hello World')
    }),
  )

  test(
    'handles complex emoji input',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      const complexEmoji = '👨‍👩‍👧‍👦'
      await editor.fill(complexEmoji)

      await expect(editor).toHaveText(complexEmoji)
    }),
  )

  test(
    'handles flag emoji sequences',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      // Flag emoji using regional indicator symbols
      const flagEmoji = '🇺🇸' // US flag
      await editor.fill(flagEmoji)
      await expect(editor).toHaveText(flagEmoji)
    }),
  )

  test(
    'handles variation selectors',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      // Text vs emoji variation selector
      const textWithVariation = '♠\uFE0E' // Spade symbol (text style)
      await editor.fill(textWithVariation)
      await expect(editor).toHaveText(textWithVariation)
    }),
  )

  test(
    'handles Indic script conjuncts',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      // Hindi conjunct character
      const hindiText = 'क्ष' // ksha conjunct
      await editor.fill(hindiText)
      await expect(editor).toHaveText(hindiText)
    }),
  )

  test(
    'handles Arabic text shaping',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      // Arabic text that requires contextual shaping
      const arabicText = 'السلام عليكم'
      await editor.fill(arabicText)
      await expect(editor).toHaveText(arabicText)
    }),
  )

  test(
    'handles surrogate pairs',
    setup(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      // Musical symbol (requires surrogate pair)
      const musicalSymbol = '𝄞' // Treble clef
      await editor.fill(musicalSymbol)
      await expect(editor).toHaveText(musicalSymbol)
    }),
  )
})
