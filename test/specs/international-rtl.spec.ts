import { expect, test } from '@playwright/test'
import { log, selectAndClear, setup } from './utils'

/**
 * International Text and RTL/LTR Tests
 * Tests right-to-left text, bidirectional text, and cross-language word boundaries
 */
test.describe('ContentEditable - RTL/LTR & Bidirectional Text', () => {
  setup(test)

  test('Arabic text direction', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    const arabicText = 'مرحبا بالعالم'
    await editor.fill(arabicText)
    await expect(editor).toHaveText(arabicText)

    const computedStyle = await editor.evaluate(el => getComputedStyle(el).direction)
    expect(['ltr', 'rtl']).toContain(computedStyle)
  })

  test('Hebrew text direction', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    const hebrewText = 'שלום עולם'
    await editor.fill(hebrewText)
    await expect(editor).toHaveText(hebrewText)
  })

  test('mixed LTR/RTL text', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    const mixedText = 'Hello مرحبا World עולם'
    await editor.fill(mixedText)
    await expect(editor).toHaveText(mixedText)
  })

  test(
    'cursor navigation in RTL text',
    log(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      await selectAndClear(page, editor)

      const arabicText = 'مرحبا'
      await editor.fill(arabicText)

      await page.keyboard.press('Home')
      await editor.pressSequentially('بداية ')

      await expect(editor).toHaveText('بداية مرحبا')
    }),
  )

  test('word boundaries in mixed scripts', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    await selectAndClear(page, editor)

    const mixedText = 'English العربية Hebrew עברית'
    await editor.fill(mixedText)
    await expect(editor).toHaveText(mixedText)

    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'
    await page.keyboard.press(deleteWordKey)

    const result = await editor.textContent()
    expect(result || '').not.toBe(mixedText)
    expect((result || '').length).toBeLessThan(mixedText.length)
  })
})

test.describe('ContentEditable - Cross-Language Word Boundaries', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('word deletion in Thai (no spaces)', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'

    await selectAndClear(page, editor)
    await editor.fill('ภาษาไทย')

    await page.keyboard.press(deleteWordKey)
    const result = await editor.textContent()
    expect(result || '').not.toBe('ภาษาไทย')
    expect((result || '').length).toBeLessThan(7)
  })

  test('word deletion in Chinese (no spaces)', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'

    await selectAndClear(page, editor)
    await editor.fill('中文测试')

    await page.keyboard.press(deleteWordKey)
    const result = await editor.textContent()
    expect(result || '').not.toBe('中文测试')
    expect((result || '').length).toBeLessThan(4)
  })

  test(
    'word deletion forward in CJK',
    log(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      const deleteWordForwardKey = process.platform === 'darwin' ? 'Alt+Delete' : 'Control+Delete'

      await selectAndClear(page, editor)
      await editor.fill('中文测试')
      await page.keyboard.press('Home')

      await page.keyboard.press(deleteWordForwardKey)
      const result = await editor.textContent()
      expect(result || '').not.toBe('中文测试')
      expect((result || '').length).toBeLessThan(4)
    }),
  )

  test('mixed language word boundaries', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'

    await selectAndClear(page, editor)
    await editor.fill('Hello世界World')

    await page.keyboard.press(deleteWordKey)
    await expect(editor).toHaveText('Hello世界')

    await page.keyboard.press(deleteWordKey)
    await expect(editor).toHaveText('Hello')
  })

  test(
    'mixed language with spaces',
    log(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'

      await selectAndClear(page, editor)
      await editor.fill('Test 中文 Word')

      await page.keyboard.press(deleteWordKey)
      await expect(editor).toHaveText('Test 中文 ')

      await page.keyboard.press(deleteWordKey)
      await expect(editor).toHaveText('Test ')
    }),
  )

  test('Japanese hiragana/katakana word boundaries', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'

    await selectAndClear(page, editor)
    await editor.fill('ひらがなカタカナ漢字')

    await page.keyboard.press(deleteWordKey)
    const result = await editor.textContent()
    expect(result || '').not.toBe('ひらがなカタカナ漢字')
    expect((result || '').length).toBeLessThan(9)
  })

  test('Korean syllable boundaries', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'

    await selectAndClear(page, editor)
    await editor.fill('안녕하세요')

    await page.keyboard.press(deleteWordKey)
    const result = await editor.textContent()
    expect(result || '').not.toBe('안녕하세요')
    expect((result || '').length).toBeLessThan(5)
  })

  test('word deletion works with languages without spaces', async ({ page }) => {
    const editor = page.locator('[role="textbox"]').first()
    const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'

    // Test Thai text (no spaces between words)
    await selectAndClear(page, editor)
    await editor.fill('ภาษาไทย') // "Thai language"

    // Delete word backward should delete the last word
    await page.keyboard.press(deleteWordKey)
    // Due to Thai word segmentation, it should delete "ไทย" (Thai)
    await expect(editor).toHaveText('ภาษา')

    // Test Chinese text (no spaces between words)
    await selectAndClear(page, editor)
    await editor.fill('中文测试') // "Chinese test"

    // Delete word backward should delete based on word boundaries
    await page.keyboard.press(deleteWordKey)
    // Should delete "测试" (test)
    await expect(editor).toHaveText('中文')

    // Test Lao text (no spaces between words)
    await selectAndClear(page, editor)
    await editor.fill('ພາສາລາວ') // "Lao language"

    // Delete word backward
    await page.keyboard.press(deleteWordKey)
    // Should delete the last word based on Lao word segmentation
    const laoText = await editor.textContent()
    expect(laoText || '').not.toBe('ພາສາລາວ') // Should have deleted something
    expect((laoText || '').length).toBeLessThan(7) // Original length is 7
  })

  test(
    'word deletion forward works with languages without spaces',
    log(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      const deleteWordForwardKey = process.platform === 'darwin' ? 'Alt+Delete' : 'Control+Delete'

      // Test Thai text
      await selectAndClear(page, editor)
      await editor.fill('ภาษาไทย') // "Thai language"
      await page.keyboard.press('Home') // Move to beginning

      // Delete word forward should delete the first word
      await page.keyboard.press(deleteWordForwardKey)
      // Should delete "ภาษา" (language)
      await expect(editor).toHaveText('ไทย')

      // Test Chinese text
      await selectAndClear(page, editor)
      await editor.fill('中文测试') // "Chinese test"
      await page.keyboard.press('Home')

      // Delete word forward
      await page.keyboard.press(deleteWordForwardKey)
      // Should delete "中文" (Chinese)
      await expect(editor).toHaveText('测试')
    }),
  )

  test(
    'word boundary detection across different scripts',
    log(async ({ page }) => {
      const editor = page.locator('[role="textbox"]').first()
      const deleteWordKey = process.platform === 'darwin' ? 'Alt+Backspace' : 'Control+Backspace'

      // Test mixed English and Chinese
      await selectAndClear(page, editor)
      await editor.fill('Hello世界World')

      // Delete word backward should delete "World"
      await page.keyboard.press(deleteWordKey)
      await expect(editor).toHaveText('Hello世界')

      // Delete again should delete "世界"
      await page.keyboard.press(deleteWordKey)
      await expect(editor).toHaveText('Hello')

      // Test mixed with spaces
      await selectAndClear(page, editor)
      await editor.fill('Test 中文 Word')

      // Delete word backward should delete "Word"
      await page.keyboard.press(deleteWordKey)
      await expect(editor).toHaveText('Test 中文 ')

      // Delete again should delete "中文" along with trailing space
      await page.keyboard.press(deleteWordKey)
      await expect(editor).toHaveText('Test ')
    }),
  )
})
