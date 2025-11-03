import { Locator, Page } from '@playwright/test'

// Utility function to select all content and clear a contenteditable element
export async function selectAndClear(page: Page, locator: Locator) {
  await locator.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Delete')
}

export async function selectWord(page: Page, locator: Locator, wordIndex: number = 0) {
  await locator.click()

  // Move to the beginning of the text
  await page.keyboard.press('ControlOrMeta+Home')

  // Navigate to the desired word using word-by-word navigation
  for (let i = 0; i < wordIndex; i++) {
    await page.keyboard.press('ControlOrMeta+ArrowRight')
  }

  // Select the current word
  await page.keyboard.press('ControlOrMeta+Shift+ArrowRight')
}

export async function selectLastWord(page: Page, locator: Locator) {
  await locator.click()

  // Move to the end of the text
  await page.keyboard.press('End')

  // Move backward to the start of the last word (without selection)
  const wordLeftKey = process.platform === 'darwin' ? 'Alt+ArrowLeft' : 'Control+ArrowLeft'
  await page.keyboard.press(wordLeftKey)

  // Now select from current position to the end
  await page.keyboard.press('Shift+End')
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

      // Note: No need to dispatch beforeinput event manually
      // The onCompositionEnd handler will create the beforeinput event automatically
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

      // Note: No need to dispatch beforeinput event manually
      // The onCompositionEnd handler will create the beforeinput event automatically
      // if data is provided
    },
    { selector, data },
  )
}

// Get the current caret position in a contenteditable element
export async function getCaretPosition(page: Page, selector: string): Promise<number> {
  return await page.evaluate(selector => {
    const element = document.querySelector(selector) as HTMLElement
    if (!element) throw new Error(`Element not found: ${selector}`)

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return 0

    const range = selection.getRangeAt(0)
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(element)
    preCaretRange.setEnd(range.endContainer, range.endOffset)

    // Count the text content length up to the caret
    let offset = 0
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)

    let node
    while ((node = walker.nextNode())) {
      const textNode = node as Text
      if (textNode === range.endContainer) {
        offset += range.endOffset
        break
      } else if (preCaretRange.intersectsNode(textNode)) {
        offset += textNode.textContent?.length || 0
      }
    }

    return offset
  }, selector)
}

// Perform undo operation
export async function undo(page: Page, selector: string = '[role="textbox"]') {
  await page.evaluate(selector => {
    const element = document.querySelector(selector) as HTMLElement
    if (!element) throw new Error(`Element not found: ${selector}`)

    element.dispatchEvent(
      new InputEvent('beforeinput', {
        inputType: 'historyUndo',
        bubbles: true,
        cancelable: true,
      }),
    )
  }, selector)
}

// Perform redo operation
export async function redo(page: Page, selector: string = '[role="textbox"]') {
  await page.evaluate(selector => {
    const element = document.querySelector(selector) as HTMLElement
    if (!element) throw new Error(`Element not found: ${selector}`)

    element.dispatchEvent(
      new InputEvent('beforeinput', {
        inputType: 'historyRedo',
        bubbles: true,
        cancelable: true,
      }),
    )
  }, selector)
}
