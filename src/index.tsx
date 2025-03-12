import {
  children,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
  type Accessor,
  type ComponentProps,
  type JSX,
} from 'solid-js'

const isMac = navigator.platform.startsWith('Mac')

type RangeVector = { start: number; end: number }

export type Patch<T = never> = {
  // see https://w3c.github.io/input-events/#interface-InputEvent-Attributes
  kind:
    | 'insertFromPaste'
    | 'insertParagraph'
    | 'insertReplacementText'
    | 'insertText'
    | 'deleteByCut'
    | 'deleteContentForward'
    | 'deleteContentBackward'
    | 'deleteWordBackward'
    | 'deleteWordForward'
    | 'deleteSoftLineBackward'
    | 'deleteSoftLineForward'
    | 'caret'
    | T
  data?: string
  range: RangeVector
  undo: string
}

/**********************************************************************************/
/*                                                                                */
/*                                      Utils                                     */
/*                                                                                */
/**********************************************************************************/

const isAlphanumeric = (char?: string): boolean => /^[a-zA-Z0-9]$/.test(char || '')

const isWhiteSpace = (char?: string) => char === ' ' || char === '\t' || char === '\n'

const isNewLine = (char?: string) => char === '\n'

// TODO: replace with createSignal when solid 2.0
function createWritable<T>(fn: () => T) {
  const signal = createMemo(() => createSignal(fn()))
  const get = () => signal()[0]()
  const set = (v: any) => signal()[1](v)
  return [get, set] as ReturnType<typeof createSignal<T>>
}

/**********************************************************************************/
/*                                                                                */
/*                                Get Selected Range                              */
/*                                                                                */
/**********************************************************************************/

export function getSelectedRange(element: HTMLElement): RangeVector {
  const selection = document.getSelection()

  if (!selection || selection.rangeCount === 0) {
    return { start: 0, end: 0 }
  }

  const documentRange = selection.getRangeAt(0)

  // Create a range that spans from the start of the contenteditable to the selection start
  const elementRange = document.createRange()
  elementRange.selectNodeContents(element)
  elementRange.setEnd(documentRange.startContainer, documentRange.startOffset)

  // The length of the elementRange gives the start offset relative to the whole content
  const start = elementRange.toString().length
  const end = start + documentRange.toString().length
  return { start, end }
}

/**********************************************************************************/
/*                                                                                */
/*                          Get Node And Offset At Index                          */
/*                                                                                */
/**********************************************************************************/

function getNodeAndOffsetAtIndex(element: Node, index: number) {
  const nodes = element.childNodes

  let accumulator = 0

  // Determine which node contains the selection-(start|end)
  for (const node of nodes) {
    const contentLength = node.textContent?.length || 0

    accumulator += contentLength

    if (accumulator >= index) {
      const offset = index - (accumulator - contentLength)
      if (node instanceof Text) {
        return {
          node,
          offset,
        }
      }
      return getNodeAndOffsetAtIndex(node, offset)
    }
  }

  throw `Could not find node`
}

/**********************************************************************************/
/*                                                                                */
/*                                 Create History                                 */
/*                                                                                */
/**********************************************************************************/

function createHistory<T extends string = never>() {
  let past: Array<Patch<T>> = []
  let future: Array<Patch<T>> = []

  return {
    future: {
      clear() {
        future.length = 0
      },
      pop() {
        return future.pop()
      },
      peek() {
        return future[future.length - 1]
      },
      push(patch: Patch<T>) {
        future.push(patch)
      },
    },
    past: {
      pop() {
        const patch = past.pop()
        if (patch) {
          future.push(patch)
        }
        return patch
      },
      peek() {
        return past[past.length - 1]
      },
      push(patch: Patch<T>) {
        past.push(patch)
      },
    },
  }
}

/**********************************************************************************/
/*                                                                                */
/*                                   Patch Utils                                  */
/*                                                                                */
/**********************************************************************************/

function createPatch(
  kind: Patch['kind'],
  source: string,
  range: RangeVector,
  data?: string,
): Patch {
  return {
    kind,
    range,
    data,
    undo: source.slice(range.start, range.end),
  }
}

function deleteContentForward(source: string, range: RangeVector): Patch {
  const end = range.start === range.end ? Math.min(source.length - 1, range.end + 1) : range.end

  return createPatch('deleteContentForward', source, {
    start: range.start,
    end,
  })
}

function deleteContentBackward(source: string, range: RangeVector): Patch {
  const start = range.start === range.end ? Math.max(0, range.start - 1) : range.start

  return createPatch('deleteContentBackward', source, {
    start,
    end: range.end,
  })
}

function deleteWordBackward(source: string, range: RangeVector): Patch {
  let start = range.start

  // If the previous value is whitespace,
  // increment to next non-whitespace character
  if (isWhiteSpace(source[start - 1])) {
    while (start > 0 && isWhiteSpace(source[start - 1])) {
      start--
    }
  }
  // If the previous value is alphanumeric,
  // we delete all previous alphanumeric values
  if (isAlphanumeric(source[start - 1])) {
    while (start > 0 && isAlphanumeric(source[start - 1])) {
      start--
    }
  } else {
    // If the previous value is not alphanumeric,
    // we delete all previous non-alphanumeric values
    // until the next whitespace or alphanumeric
    while (start > 0 && !isWhiteSpace(source[start - 1]) && !isAlphanumeric(source[start - 1])) {
      start--
    }
  }

  return createPatch('deleteWordBackward', source, {
    start,
    end: range.end,
  })
}

function deleteWordForward(source: string, range: RangeVector): Patch {
  let end = range.end

  // If the previous value is whitespace,
  // increment to next non-whitespace character
  if (isWhiteSpace(source[end])) {
    while (end < source.length && isWhiteSpace(source[end])) {
      end += 1
    }
  }
  // If the previous value is alphanumeric,
  // we delete all previous alphanumeric values
  if (isAlphanumeric(source[end])) {
    while (end < source.length && isAlphanumeric(source[end])) {
      end += 1
    }
  } else {
    // If the previous value is not alphanumeric,
    // we delete all previous non-alphanumeric values
    // until the next whitespace or alphanumeric
    while (end < source.length && !isWhiteSpace(source[end]) && !isAlphanumeric(source[end])) {
      end += 1
    }
  }

  return createPatch('deleteWordForward', source, {
    start: range.start,
    end,
  })
}

function deleteSoftLineBackward(source: string, range: RangeVector): Patch {
  let start = range.start

  if (isNewLine(source[start - 1])) {
    start -= 1
  } else {
    while (start > 0 && !isNewLine(source[start - 1])) {
      start -= 1
    }
  }

  return createPatch('deleteSoftLineBackward', source, {
    start,
    end: range.end,
  })
}

function deleteSoftLineForward(source: string, range: RangeVector): Patch {
  let end = range.end

  if (isNewLine(source[end + 1])) {
    end += 1
  } else {
    while (end < source.length && !isNewLine(source[end + 1])) {
      end += 1
    }
  }

  return createPatch('deleteSoftLineForward', source, {
    start: range.start,
    end,
  })
}

/**********************************************************************************/
/*                                                                                */
/*                             Create Patch From Event                            */
/*                                                                                */
/**********************************************************************************/

function createPatchFromEvent(
  event: InputEvent & { currentTarget: HTMLElement },
  source: string,
  singleline: boolean,
): Patch | null {
  const range = getSelectedRange(event.currentTarget)
  switch (event.inputType) {
    case 'insertText': {
      return createPatch('insertText', source, range, event.data || '')
    }
    case 'deleteContentBackward': {
      return deleteContentBackward(source, range)
    }
    case 'deleteContentForward': {
      return deleteContentForward(source, range)
    }
    case 'deleteWordBackward': {
      if (range.start !== range.end) {
        return deleteContentBackward(source, range)
      }
      return deleteWordBackward(source, range)
    }
    case 'deleteWordForward': {
      if (range.start !== range.end) {
        return deleteContentForward(source, range)
      }
      return deleteWordForward(source, range)
    }
    case 'deleteSoftLineBackward': {
      if (range.start !== range.end) {
        return deleteContentBackward(source, range)
      }
      return deleteSoftLineBackward(source, range)
    }
    case 'deleteSoftLineForward': {
      if (range.start !== range.end) {
        return deleteContentForward(source, range)
      }
      return deleteSoftLineForward(source, range)
    }
    case 'deleteByCut': {
      return createPatch('deleteByCut', source, range)
    }
    case 'insertReplacementText':
    case 'insertFromPaste': {
      let data = event.dataTransfer?.getData('text')
      if (singleline && data) {
        data = data.replaceAll('\n', ' ')
      }
      return createPatch(event.inputType, source, range, data)
    }
    case 'insertParagraph': {
      if (singleline) return null
      return createPatch('insertParagraph', source, range, '\n')
    }
    default:
      throw `Unsupported inputType: ${event.inputType}`
  }
}

/**********************************************************************************/
/*                                                                                */
/*                             Dispatch History Event                             */
/*                                                                                */
/**********************************************************************************/

function dispatchRedoEvent(event: KeyboardEvent & { currentTarget: HTMLElement }) {
  event.preventDefault()
  event.currentTarget.dispatchEvent(
    new InputEvent('input', {
      inputType: 'historyRedo',
      bubbles: true,
      cancelable: true,
    }),
  )
}

function dispatchUndoEvent(event: KeyboardEvent & { currentTarget: HTMLElement }) {
  event.preventDefault()
  event.currentTarget.dispatchEvent(
    new InputEvent('input', {
      inputType: 'historyUndo',
      bubbles: true,
      cancelable: true,
    }),
  )
}

/**********************************************************************************/
/*                                                                                */
/*                                Content Editable                                */
/*                                                                                */
/**********************************************************************************/

export interface ContentEditableProps<T extends string | never = never>
  extends Omit<
    ComponentProps<'div'>,
    'children' | 'contenteditable' | 'onBeforeInput' | 'textContent' | 'onInput' | 'style'
  > {
  /** If contentEditable is editable or not. Defaults to `true`. */
  editable?: boolean
  /**
   * Callback deciding if history entries should be concatenated when undoing/redoing history.
   *
   * [see README](https://www.github.com/bigmistqke/solid-contenteditable/#history-strategy).
   */
  historyStrategy?(currentPatch: Patch<T>, nextPatch: Patch<T>): boolean
  /** Optionally return a custom patch on each `onKeyDown`. */
  onPatch?(event: KeyboardEvent & { currentTarget: HTMLElement }): Patch<T> | null
  /** Event-callback called whenever `content` is updated */
  onTextContent?: (value: string) => void
  /**
   * Render-prop receiving `textContent`, enabling the addition of visual markup to the `<ContentEditable/>` content.
   *
   * @warning
   * - The content returned by this prop must maintain the original `textContent` as provided, ensuring that any added visual elements do not alter the functional text.
   * - Deviating from the original `textContent` can lead to **undefined behavior**.
   *
   * [see README](https://www.github.com/bigmistqke/solid-contenteditable/#limitations-with-render-prop).
   */
  render?(textContent: Accessor<string>): JSX.Element
  /** If `<ContentEditable/>` accepts only singleline input.  Defaults to `false`. */
  singleline?: boolean
  style?: JSX.CSSProperties
  /** The `textContent` of `<ContentEditable/>`. */
  textContent: string
}

export function ContentEditable<T extends string = never>(props: ContentEditableProps<T>) {
  const [config, rest] = splitProps(
    mergeProps(
      {
        spellcheck: false,
        editable: true,
        singleline: false,
        historyStrategy(currentPatch: Patch<T>, nextPatch: Patch<T>) {
          return !(
            currentPatch.kind !== 'insertText' ||
            nextPatch.kind !== 'insertText' ||
            (currentPatch.data === ' ' && nextPatch.data !== ' ')
          )
        },
      } satisfies Partial<ContentEditableProps>,
      props,
    ),
    [
      'render',
      'editable',
      'historyStrategy',
      'onTextContent',
      'onPatch',
      'singleline',
      'style',
      'textContent',
    ] satisfies Array<keyof Partial<ContentEditableProps>>,
  )
  const [textContent, setTextContent] = createWritable(() => props.textContent)
  // Add an additional newline if the value ends with a newline,
  // otherwise the browser will not display the trailing newline.
  const textContentWithTrailingNewLine = createMemo(() =>
    textContent().endsWith('\n') ? `${textContent()}\n` : textContent(),
  )
  const c = children(
    () => props.render?.(textContentWithTrailingNewLine) || textContentWithTrailingNewLine(),
  )
  const history = createHistory<T>()
  let element: HTMLDivElement = null!

  function applyPatch(patch: Patch<T>) {
    history.past.push(patch)

    const {
      range: { start, end },
      data = '',
    } = patch

    const newValue = `${textContent().slice(0, start)}${data}${textContent().slice(end)}`

    setTextContent(newValue)

    props.onTextContent?.(newValue)
  }

  function select(start: number, end?: number) {
    const selection = document.getSelection()!
    const range = document.createRange()
    selection.removeAllRanges()

    const resultStart = getNodeAndOffsetAtIndex(element, start)
    range.setStart(resultStart.node, resultStart.offset)

    if (end) {
      const resultEnd = getNodeAndOffsetAtIndex(element, end)
      range.setEnd(resultEnd.node, resultEnd.offset)
    } else {
      range.setEnd(resultStart.node, resultStart.offset)
    }

    selection.addRange(range)

    if (props.singleline) {
      const rect = range.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()

      if (rect.left < elementRect.left) {
        element.scrollLeft += rect.left - elementRect.left
      } else if (rect.right > elementRect.right) {
        element.scrollLeft += rect.right - elementRect.right
      }
    }
  }

  function onInput(event: InputEvent & { currentTarget: HTMLDivElement }) {
    event.preventDefault()

    switch (event.inputType) {
      case 'historyUndo': {
        while (true) {
          const patch = history.past.pop()

          if (!patch) return

          const {
            kind,
            range: { start },
            data = '',
            undo = '',
          } = patch

          if (kind === 'caret') continue

          setTextContent(
            value => `${value.slice(0, start)}${undo}${value.slice(start + data.length)}`,
          )

          select(patch.range.start, patch.range.end)

          props.onTextContent?.(textContent())

          const nextPatch = history.past.peek()
          if (!nextPatch) return

          if (!config.historyStrategy(patch, nextPatch)) return
        }
      }
      case 'historyRedo': {
        while (true) {
          const patch = history.future.pop()

          if (!patch) return

          applyPatch(patch)
          const {
            kind,
            range: { start },
            data = '',
          } = patch

          if (kind === 'caret') continue

          select(start + data.length)

          const nextPatch = history.future.peek()
          if (!nextPatch) return

          if (!config.historyStrategy(patch, nextPatch)) return
        }
      }
      default: {
        history.future.clear()

        const source = event.currentTarget.innerText
        const patch = createPatchFromEvent(event, source, config.singleline)

        if (patch) {
          applyPatch(patch)

          const {
            range: { start },
            data = '',
          } = patch

          select(start + data.length)
        }
        break
      }
    }
  }

  function onKeyDown(event: KeyboardEvent & { currentTarget: HTMLElement }) {
    if (config.onPatch) {
      const patch = config.onPatch(event)
      if (patch) {
        applyPatch(patch)
      }
    }

    if (event.key.startsWith('Arrow')) {
      history.past.push({
        kind: 'caret',
        range: getSelectedRange(event.currentTarget),
        undo: '',
      })
    }

    if (isMac) {
      if (event.metaKey) {
        switch (event.key) {
          case 'z':
            dispatchUndoEvent(event)
            break
          case 'Z':
            dispatchRedoEvent(event)
            break
        }
      }
    } else {
      if (event.ctrlKey) {
        switch (event.key) {
          case 'z':
            dispatchUndoEvent(event)
            break
          case 'y':
          case 'Z':
            dispatchRedoEvent(event)
            break
        }
      }
    }
  }

  createEffect(() => {
    if (
      c
        .toArray()
        .map(value => (value instanceof Element ? value.textContent : value))
        .join('') !== textContentWithTrailingNewLine()
    ) {
      console.warn(
        `⚠️ WARNING ⚠️
- props.textContent and the textContent of props.children(textContent) are not equal!
- This breaks core-assumptions of <ContentEditable/> and will cause undefined behaviors!
- see www.github.com/bigmistqke/solid-contenteditable/#limitations-with-render-prop`,
      )
    }
  })

  return (
    <div
      ref={element}
      role="textbox"
      aria-multiline={!config.singleline}
      contenteditable={config.editable}
      onBeforeInput={onInput}
      onInput={onInput}
      onKeyDown={onKeyDown}
      style={{
        'scrollbar-width': props.singleline ? 'none' : undefined,
        'white-space': props.singleline ? 'pre' : 'break-spaces',
        ...config.style,
      }}
      {...rest}
    >
      {c()}
    </div>
  )
}
