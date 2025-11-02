import { Locator, Page } from '@playwright/test'

// Utility function to select all content and clear a contenteditable element
export async function selectAndClear(page: Page, locator: Locator) {
  await locator.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Delete')
}

// Composition event simulation utilities
export async function simulateComposition(page: Page, selector: string, updates: string[], finalText: string) {
  await page.evaluate(({ selector, updates, finalText }) => {
    const element = document.querySelector(selector) as HTMLElement
    if (!element) return

    // Start composition
    element.dispatchEvent(new CompositionEvent('compositionstart', {
      data: '',
      bubbles: true,
      cancelable: true
    }))

    // Send all updates
    for (const data of updates) {
      element.dispatchEvent(new CompositionEvent('compositionupdate', {
        data,
        bubbles: true,
        cancelable: true
      }))
    }

    // End composition
    element.dispatchEvent(new CompositionEvent('compositionend', {
      data: finalText,
      bubbles: true,
      cancelable: true
    }))

    // Dispatch input event to insert the text
    element.dispatchEvent(new InputEvent('input', {
      inputType: 'insertCompositionText',
      data: finalText,
      bubbles: true,
      cancelable: true
    }))
  }, { selector, updates, finalText })
}

export async function simulateCancelledComposition(page: Page, selector: string, updates: string[]) {
  await page.evaluate(({ selector, updates }) => {
    const element = document.querySelector(selector) as HTMLElement
    if (!element) return

    // Start composition
    element.dispatchEvent(new CompositionEvent('compositionstart', {
      data: '',
      bubbles: true,
      cancelable: true
    }))

    // Send updates
    for (const data of updates) {
      element.dispatchEvent(new CompositionEvent('compositionupdate', {
        data,
        bubbles: true,
        cancelable: true
      }))
    }

    // Cancel composition (empty data on end)
    element.dispatchEvent(new CompositionEvent('compositionend', {
      data: '',
      bubbles: true,
      cancelable: true
    }))
  }, { selector, updates })
}

export async function simulateJapaneseInput(page: Page, selector: string, romaji: string, hiragana: string, kanji?: string) {
  const updates = [romaji, hiragana]
  if (kanji) updates.push(kanji)
  const finalText = kanji || hiragana
  await simulateComposition(page, selector, updates, finalText)
}

export async function simulateChineseInput(page: Page, selector: string, pinyin: string, characters: string) {
  await simulateComposition(page, selector, [pinyin, characters], characters)
}

export async function simulateKoreanInput(page: Page, selector: string, steps: string[], finalText: string) {
  await simulateComposition(page, selector, steps, finalText)
}

export async function startCompositionWithoutEnding(page: Page, selector: string, updates: string[]) {
  await page.evaluate(({ selector, updates }) => {
    const element = document.querySelector(selector) as HTMLElement
    if (!element) return

    // Start composition
    element.dispatchEvent(new CompositionEvent('compositionstart', {
      data: '',
      bubbles: true,
      cancelable: true
    }))

    // Send updates
    for (const data of updates) {
      element.dispatchEvent(new CompositionEvent('compositionupdate', {
        data,
        bubbles: true,
        cancelable: true
      }))
    }
  }, { selector, updates })
}

export async function endComposition(page: Page, selector: string, data: string = '') {
  await page.evaluate(({ selector, data }) => {
    const element = document.querySelector(selector) as HTMLElement
    if (!element) return

    element.dispatchEvent(new CompositionEvent('compositionend', {
      data,
      bubbles: true,
      cancelable: true
    }))

    if (data) {
      element.dispatchEvent(new InputEvent('input', {
        inputType: 'insertCompositionText',
        data,
        bubbles: true,
        cancelable: true
      }))
    }
  }, { selector, data })
}
