import { Locator, Page } from '@playwright/test'

// Utility function to select all content and clear a contenteditable element
export async function selectAndClear(page: Page, locator: Locator) {
  await locator.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Delete')
}

// Utility function to dispatch input events directly to test implementation
export async function dispatchInputEvent(
  page: Page,
  selector: string,
  inputType: string,
  options: {
    data?: string
    dataTransferData?: string
    selection?: { start: number; end: number }
  } = {},
) {
  await page.evaluate(
    ({ selector, inputType, options }) => {
      const element = document.querySelector(selector) as HTMLElement
      if (!element) throw new Error(`Element not found: ${selector}`)

      // Set up text selection if provided
      if (options.selection) {
        const range = document.createRange()
        const selection = window.getSelection()

        // Find text nodes and set selection
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)

        let currentOffset = 0
        let startNode: Node | null = null
        let endNode: Node | null = null
        let startOffset = 0
        let endOffset = 0

        let textNode: Node | null
        while ((textNode = walker.nextNode())) {
          const textLength = textNode.textContent?.length || 0

          // Find start position
          if (!startNode && currentOffset + textLength >= options.selection.start) {
            startNode = textNode
            startOffset = options.selection.start - currentOffset
          }

          // Find end position
          if (!endNode && currentOffset + textLength >= options.selection.end) {
            endNode = textNode
            endOffset = options.selection.end - currentOffset
            break
          }

          currentOffset += textLength
        }

        if (startNode && endNode) {
          range.setStart(startNode, startOffset)
          range.setEnd(endNode, endOffset)
          selection?.removeAllRanges()
          selection?.addRange(range)
        }
      }

      const event = new InputEvent('input', {
        inputType: inputType as any,
        data: options.data,
        bubbles: true,
        cancelable: true,
      })

      // Add dataTransfer if provided
      if (options.dataTransferData) {
        Object.defineProperty(event, 'dataTransfer', {
          value: {
            getData: () => options.dataTransferData,
          },
        })
      }

      element.dispatchEvent(event)
    },
    { selector, inputType, options },
  )
}

// Utility function to dispatch beforeInput events
export async function dispatchBeforeInputEvent(
  page: Page,
  selector: string,
  inputType: string,
  options: { data?: string; dataTransferData?: string } = {},
) {
  await page.evaluate(
    ({ selector, inputType, options }) => {
      const element = document.querySelector(selector) as HTMLElement
      if (!element) throw new Error(`Element not found: ${selector}`)

      const event = new InputEvent('beforeinput', {
        inputType: inputType as any,
        data: options.data,
        bubbles: true,
        cancelable: true,
      })

      // Add dataTransfer if provided
      if (options.dataTransferData) {
        Object.defineProperty(event, 'dataTransfer', {
          value: {
            getData: () => options.dataTransferData,
          },
        })
      }

      element.dispatchEvent(event)
    },
    { selector, inputType, options },
  )
}

// Composition event simulation utilities
export async function simulateComposition(
  page: Page,
  selector: string,
  updates: string[],
  finalText: string,
) {
  await page.evaluate(
    ({ selector, updates, finalText }) => {
      const element = document.querySelector(selector) as HTMLElement
      if (!element) return

      // Start composition
      element.dispatchEvent(
        new CompositionEvent('compositionstart', {
          data: '',
          bubbles: true,
          cancelable: true,
        }),
      )

      // Send all updates
      for (const data of updates) {
        element.dispatchEvent(
          new CompositionEvent('compositionupdate', {
            data,
            bubbles: true,
            cancelable: true,
          }),
        )
      }

      // End composition
      element.dispatchEvent(
        new CompositionEvent('compositionend', {
          data: finalText,
          bubbles: true,
          cancelable: true,
        }),
      )

      // Dispatch input event to insert the text
      element.dispatchEvent(
        new InputEvent('input', {
          inputType: 'insertCompositionText',
          data: finalText,
          bubbles: true,
          cancelable: true,
        }),
      )
    },
    { selector, updates, finalText },
  )
}

export async function simulateCancelledComposition(
  page: Page,
  selector: string,
  updates: string[],
) {
  await page.evaluate(
    ({ selector, updates }) => {
      const element = document.querySelector(selector) as HTMLElement
      if (!element) return

      // Start composition
      element.dispatchEvent(
        new CompositionEvent('compositionstart', {
          data: '',
          bubbles: true,
          cancelable: true,
        }),
      )

      // Send updates
      for (const data of updates) {
        element.dispatchEvent(
          new CompositionEvent('compositionupdate', {
            data,
            bubbles: true,
            cancelable: true,
          }),
        )
      }

      // Cancel composition (empty data on end)
      element.dispatchEvent(
        new CompositionEvent('compositionend', {
          data: '',
          bubbles: true,
          cancelable: true,
        }),
      )
    },
    { selector, updates },
  )
}

export async function simulateJapaneseInput(
  page: Page,
  selector: string,
  romaji: string,
  hiragana: string,
  kanji?: string,
) {
  const updates = [romaji, hiragana]
  if (kanji) updates.push(kanji)
  const finalText = kanji || hiragana
  await simulateComposition(page, selector, updates, finalText)
}

export async function simulateChineseInput(
  page: Page,
  selector: string,
  pinyin: string,
  characters: string,
) {
  await simulateComposition(page, selector, [pinyin, characters], characters)
}

export async function simulateKoreanInput(
  page: Page,
  selector: string,
  steps: string[],
  finalText: string,
) {
  await simulateComposition(page, selector, steps, finalText)
}

export async function startCompositionWithoutEnding(
  page: Page,
  selector: string,
  updates: string[],
) {
  await page.evaluate(
    ({ selector, updates }) => {
      const element = document.querySelector(selector) as HTMLElement
      if (!element) return

      // Start composition
      element.dispatchEvent(
        new CompositionEvent('compositionstart', {
          data: '',
          bubbles: true,
          cancelable: true,
        }),
      )

      // Send updates
      for (const data of updates) {
        element.dispatchEvent(
          new CompositionEvent('compositionupdate', {
            data,
            bubbles: true,
            cancelable: true,
          }),
        )
      }
    },
    { selector, updates },
  )
}

export async function endComposition(page: Page, selector: string, data: string = '') {
  await page.evaluate(
    ({ selector, data }) => {
      const element = document.querySelector(selector) as HTMLElement
      if (!element) return

      element.dispatchEvent(
        new CompositionEvent('compositionend', {
          data,
          bubbles: true,
          cancelable: true,
        }),
      )

      if (data) {
        element.dispatchEvent(
          new InputEvent('input', {
            inputType: 'insertCompositionText',
            data,
            bubbles: true,
            cancelable: true,
          }),
        )
      }
    },
    { selector, data },
  )
}
