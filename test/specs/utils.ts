import {
  Locator,
  Page,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
  TestInfo,
} from '@playwright/test'

// Debug flag for Firefox-specific debugging
const DEBUG = process.env.DEBUG === 'true'

type TestArgs = PlaywrightTestArgs &
  PlaywrightTestOptions &
  PlaywrightWorkerArgs &
  PlaywrightWorkerOptions

type TestBody = (
  args: Pick<TestArgs, 'page' | 'browserName' | 'browser' | 'context' | 'request'>,
  testInfo: TestInfo,
) => Promise<void> | void

// Wrapper function to add debug logging to Firefox tests
export function setup(testFn: TestBody) {
  return async ({ page, browserName, browser, context, request }: TestArgs, info: TestInfo) => {
    await page.goto(`/${DEBUG ? '?debug=1' : ''}`)

    if (!DEBUG) {
      return testFn({ page, browserName, browser, context, request }, info)
    }

    const consoleLogs: string[] = []

    page.on('console', async msg => {
      console.log('message', msg)
      if (msg.type() === 'info' || msg.type() === 'log') {
        try {
          const args = await Promise.all(
            msg.args().map(arg => arg.jsonValue().catch(() => arg.toString())),
          )
          const logText = args.join(' ')
          if (
            logText.includes('🎯') ||
            logText.includes('📍') ||
            logText.includes('📦') ||
            logText.includes('🔧')
          ) {
            consoleLogs.push(`[${new Date().toISOString()}] ${logText}`)
          }
        } catch (error) {
          // Ignore errors in console log processing
        }
      }
    })

    try {
      return await testFn({ page, browserName, browser, context, request }, info)
    } finally {
      if (consoleLogs.length > 0) {
        console.log(`\n=== FIREFOX DEBUG LOGS ===`)
        consoleLogs.forEach(log => console.log(log))
        console.log(`=== END DEBUG LOGS ===\n`)
      }
    }
  }
}

// Utility function to select all content and clear a contenteditable element
export async function selectAndClear(page: Page, locator: Locator) {
  await locator.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Delete')
}

export async function selectWord(page: Page, locator: Locator, wordIndex: number = 0) {
  await locator.click()

  // Move to the beginning of the text
  await moveCaretToStart(locator)

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
  await moveCaretToEnd(locator)

  // Move backward to the start of the last word (without selection)
  const wordLeftKey = process.platform === 'darwin' ? 'Alt+ArrowLeft' : 'Control+ArrowLeft'
  await page.keyboard.press(wordLeftKey)

  // Now select from current position to the end using programmatic selection
  await locator.evaluate((element: HTMLElement) => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const startContainer = range.startContainer
      const startOffset = range.startOffset

      // Extend selection to end of element
      const newRange = document.createRange()
      newRange.setStart(startContainer, startOffset)

      // Find the last text node or use the element itself
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
      let lastTextNode: Node = element
      let node
      while ((node = walker.nextNode())) {
        lastTextNode = node
      }

      if (lastTextNode.nodeType === Node.TEXT_NODE) {
        newRange.setEnd(lastTextNode, lastTextNode.textContent?.length || 0)
      } else {
        newRange.setEnd(element, element.childNodes.length)
      }

      selection.removeAllRanges()
      selection.addRange(newRange)
    }
  })
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

      // Mock getTargetRanges() to return appropriate range for the input type
      Object.defineProperty(event, 'getTargetRanges', {
        value: () => {
          const selection = window.getSelection()
          if (!selection || selection.rangeCount === 0) {
            return []
          }

          const range = selection.getRangeAt(0)
          
          // For soft line deletion operations, calculate the line boundaries
          if (inputType === 'deleteSoftLineBackward' || inputType === 'deleteSoftLineForward') {
            const newRange = document.createRange()
            const textContent = element.textContent || ''
            
            // Find current cursor position in text
            let currentPos = 0
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
            let textNode
            while ((textNode = walker.nextNode())) {
              if (textNode === range.startContainer) {
                currentPos += range.startOffset
                break
              } else {
                currentPos += textNode.textContent?.length || 0
              }
            }
            
            // Find line boundaries (for soft line, treat whole element as one line if no line breaks)
            const lineStart = textContent.lastIndexOf('\n', currentPos - 1) + 1
            const lineEnd = textContent.indexOf('\n', currentPos)
            const actualLineEnd = lineEnd === -1 ? textContent.length : lineEnd
            
            if (inputType === 'deleteSoftLineBackward') {
              // Delete from current position back to start of line
              const startPos = lineStart
              const endPos = currentPos
              
              // Convert back to DOM positions
              let offset = 0
              const startWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
              let startNode, startOffset = 0
              while ((startNode = startWalker.nextNode())) {
                const nodeLength = startNode.textContent?.length || 0
                if (offset + nodeLength >= startPos) {
                  startOffset = startPos - offset
                  break
                }
                offset += nodeLength
              }
              
              offset = 0
              const endWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
              let endNode, endOffset = 0
              while ((endNode = endWalker.nextNode())) {
                const nodeLength = endNode.textContent?.length || 0
                if (offset + nodeLength >= endPos) {
                  endOffset = endPos - offset
                  break
                }
                offset += nodeLength
              }
              
              if (startNode && endNode) {
                newRange.setStart(startNode, startOffset)
                newRange.setEnd(endNode, endOffset)
              }
            } else if (inputType === 'deleteSoftLineForward') {
              // Delete from current position to end of line
              const startPos = currentPos
              const endPos = actualLineEnd
              
              // Convert back to DOM positions
              let offset = 0
              const startWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
              let startNode, startOffset = 0
              while ((startNode = startWalker.nextNode())) {
                const nodeLength = startNode.textContent?.length || 0
                if (offset + nodeLength >= startPos) {
                  startOffset = startPos - offset
                  break
                }
                offset += nodeLength
              }
              
              offset = 0
              const endWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
              let endNode, endOffset = 0
              while ((endNode = endWalker.nextNode())) {
                const nodeLength = endNode.textContent?.length || 0
                if (offset + nodeLength >= endPos) {
                  endOffset = endPos - offset
                  break
                }
                offset += nodeLength
              }
              
              if (startNode && endNode) {
                newRange.setStart(startNode, startOffset)
                newRange.setEnd(endNode, endOffset)
              }
            }
            
            return [newRange]
          }
          
          // For other input types, return current selection
          return [range]
        },
      })

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

// Move caret to the beginning of the text
export async function moveCaretToStart(locator: Locator) {
  // Use evaluate to programmatically set caret position
  await locator.evaluate((element: HTMLElement) => {
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
      const range = document.createRange()
      const firstTextNode = element.firstChild || element
      range.setStart(firstTextNode, 0)
      range.setEnd(firstTextNode, 0)
      selection.addRange(range)
    }
  })
}

// Move caret to the end of the text
export async function moveCaretToEnd(locator: Locator) {
  // Use evaluate to programmatically set caret position
  await locator.evaluate((element: HTMLElement) => {
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
      const range = document.createRange()

      // Find the last text node or use the element itself
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
      let lastTextNode: Node = element
      let node
      while ((node = walker.nextNode())) {
        lastTextNode = node
      }

      if (lastTextNode.nodeType === Node.TEXT_NODE) {
        const textLength = lastTextNode.textContent?.length || 0
        range.setStart(lastTextNode, textLength)
        range.setEnd(lastTextNode, textLength)
      } else {
        range.setStart(element, element.childNodes.length)
        range.setEnd(element, element.childNodes.length)
      }

      selection.addRange(range)
    }
  })
}

// Select all text in the element
export async function selectAll(page: Page, locator: Locator) {
  await locator.focus()
  await page.keyboard.press('ControlOrMeta+a')
}

// Perform undo operation
export async function undo(page: Page, selector: string = '[role="textbox"]') {
  await page.evaluate(selector => {
    const element = document.querySelector(selector)
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
    const element = document.querySelector(selector)
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
