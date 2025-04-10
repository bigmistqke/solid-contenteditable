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
    | 'insertLineBreak'
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
  selection: RangeVector
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
/*                                 Key Combo Utils                                */
/*                                                                                */
/**********************************************************************************/

// Follow key-combination-order as described https://superuser.com/a/1238062
const modifiers = ['Ctrl', 'Alt', 'Shift', 'Meta']
function getKeyComboFromKeyboardEvent(event: KeyboardEvent) {
  if (modifiers.includes(event.key)) return event.code
  const ctrl = event.ctrlKey ? 'Ctrl+' : ''
  const alt = event.altKey ? 'Alt+' : ''
  const shift = event.shiftKey ? 'Shift+' : ''
  const meta = event.metaKey ? 'Meta+' : ''
  return ctrl + alt + shift + meta + event.code.replace('Key', '')
}

const reversedModifiers = modifiers.toReversed()
function normalizeKeyCombo(keyCombo: string) {
  return keyCombo
    .split('+')
    .sort((a, b) => reversedModifiers.indexOf(b) - reversedModifiers.indexOf(a))
    .join('+')
}

/**********************************************************************************/
/*                                                                                */
/*                                Get Selected Range                              */
/*                                                                                */
/**********************************************************************************/

function getSelection(element: HTMLElement): RangeVector {
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
/*                                  History Utils                                 */
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

function defaultHistoryStrategy(currentPatch: Patch<string>, nextPatch: Patch<string>) {
  if (
    (currentPatch.kind === 'deleteContentBackward' && nextPatch.kind === 'deleteContentForward') ||
    (currentPatch.kind === 'deleteContentForward' && nextPatch.kind === 'deleteContentBackward')
  ) {
    return false
  }

  const relevantKinds = ['insertText', 'deleteContentBackward', 'deleteContentForward']
  return (
    relevantKinds.includes(currentPatch.kind) &&
    relevantKinds.includes(nextPatch.kind) &&
    !(currentPatch.data === ' ' && nextPatch.data !== ' ')
  )
}

/**********************************************************************************/
/*                                                                                */
/*                                   Patch Utils                                  */
/*                                                                                */
/**********************************************************************************/

function deleteContentForward(source: string, selection: RangeVector): Patch {
  const range = {
    start: selection.start,
    end:
      selection.start === selection.end
        ? Math.min(source.length, selection.end + 1)
        : selection.end,
  }

  return {
    kind: 'deleteContentForward',
    range,
    selection,
    undo: source.slice(range.start, range.end),
  }
}

function deleteContentBackward(source: string, selection: RangeVector): Patch {
  const range = {
    start: selection.start === selection.end ? Math.max(0, selection.start - 1) : selection.start,
    end: selection.end,
  }

  return {
    kind: 'deleteContentBackward',
    range,
    selection,
    undo: source.slice(range.start, range.end),
  }
}

function deleteWordBackward(source: string, selection: RangeVector): Patch {
  let start = selection.start

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

  const range = {
    start,
    end: selection.end,
  }

  return {
    kind: 'deleteWordBackward',
    range,
    selection,
    undo: source.slice(range.start, range.end),
  }
}

function deleteWordForward(source: string, selection: RangeVector): Patch {
  let end = selection.end

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

  const range = {
    start: selection.start,
    end,
  }

  return {
    kind: 'deleteWordForward',
    selection,
    range,
    undo: source.slice(range.start, range.end),
  }
}

function deleteSoftLineBackward(source: string, selection: RangeVector): Patch {
  let start = selection.start

  if (isNewLine(source[start - 1])) {
    start -= 1
  } else {
    while (start > 0 && !isNewLine(source[start - 1])) {
      start -= 1
    }
  }
  const range = {
    start,
    end: selection.end,
  }

  return {
    kind: 'deleteSoftLineBackward',
    selection,
    range,
    undo: source.slice(range.start, range.end),
  }
}

function deleteSoftLineForward(source: string, selection: RangeVector): Patch {
  let end = selection.end

  if (isNewLine(source[end + 1])) {
    end += 1
  } else {
    while (end < source.length && !isNewLine(source[end + 1])) {
      end += 1
    }
  }

  const range = {
    start: selection.start,
    end,
  }

  return {
    kind: 'deleteSoftLineForward',
    selection,
    range,
    undo: source.slice(range.start, range.end),
  }
}

/**********************************************************************************/
/*                                                                                */
/*                             Create Patch From Event                            */
/*                                                                                */
/**********************************************************************************/

function createPatchFromInputEvent(
  event: InputEvent & { currentTarget: HTMLElement },
  source: string,
  singleline: boolean,
): Patch | null {
  const selection = getSelection(event.currentTarget)

  switch (event.inputType) {
    case 'insertText': {
      return {
        kind: 'insertText',
        selection,
        range: selection,
        undo: source.slice(selection.start, selection.end),
        data: event.data || '',
      }
    }
    case 'deleteContentBackward': {
      return deleteContentBackward(source, selection)
    }
    case 'deleteContentForward': {
      return deleteContentForward(source, selection)
    }
    case 'deleteWordBackward': {
      if (selection.start !== selection.end) {
        return deleteContentBackward(source, selection)
      }
      return deleteWordBackward(source, selection)
    }
    case 'deleteWordForward': {
      if (selection.start !== selection.end) {
        return deleteContentForward(source, selection)
      }
      return deleteWordForward(source, selection)
    }
    case 'deleteSoftLineBackward': {
      if (selection.start !== selection.end) {
        return deleteContentBackward(source, selection)
      }
      return deleteSoftLineBackward(source, selection)
    }
    case 'deleteSoftLineForward': {
      if (selection.start !== selection.end) {
        return deleteContentForward(source, selection)
      }
      return deleteSoftLineForward(source, selection)
    }
    case 'deleteByCut': {
      return {
        kind: 'deleteByCut',
        range: selection,
        selection,
        undo: source.slice(selection.start, selection.end),
      }
    }
    case 'insertReplacementText':
    case 'insertFromPaste': {
      let data = event.dataTransfer?.getData('text')
      if (singleline && data) {
        data = data.replaceAll('\n', ' ')
      }

      return {
        kind: event.inputType,
        data,
        range: selection,
        selection,
        undo: source.slice(selection.start, selection.end),
      }
    }
    case 'insertLineBreak':
    case 'insertParagraph': {
      if (singleline) return null

      return {
        kind: event.inputType,
        data: '\n',
        range: selection,
        selection,
        undo: source.slice(selection.start, selection.end),
      }
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
  /**
   * Add additional key-bindings.
   * @warning
   * The given key-bindings are normalized according to the following order:
   * `CTRL - ALT - SHIFT - META - [key]`
   *
   * [see](https://superuser.com/a/1238062)
   */
  keyBindings?: Record<
    string,
    (data: {
      textContent: string
      range: RangeVector
      event: KeyboardEvent & { currentTarget: HTMLElement }
    }) => Patch<T> | null
  >
  /** If contentEditable is editable or not. Defaults to `true`. */
  editable?: boolean
  /**
   * Callback deciding if history entries should be concatenated when undoing/redoing history.
   *
   * [see README](https://www.github.com/bigmistqke/solid-contenteditable/#history-strategy).
   */
  historyStrategy?(currentPatch: Patch<T>, nextPatch: Patch<T>): boolean
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
        historyStrategy: defaultHistoryStrategy,
      } satisfies Partial<ContentEditableProps>,
      props,
    ),
    [
      'render',
      'editable',
      'historyStrategy',
      'onTextContent',
      'keyBindings',
      'singleline',
      'style',
      'textContent',
    ] satisfies Array<keyof Partial<ContentEditableProps>>,
  )
  const [textContent, setTextContent] = createWritable(() => props.textContent)
  const history = createHistory<T>()
  let element: HTMLDivElement = null!

  // Add an additional newline if the value ends with a newline,
  // otherwise the browser will not display the trailing newline.
  const textContentWithTrailingNewLine = createMemo(() =>
    textContent().endsWith('\n') ? `${textContent()}\n` : textContent(),
  )
  const c = children(
    () => props.render?.(textContentWithTrailingNewLine) || textContentWithTrailingNewLine(),
  )
  const normalizedKeyBindings = createMemo(() =>
    Object.fromEntries(
      Object.entries(config.keyBindings || {}).map(([key, value]) => {
        return [normalizeKeyCombo(key), value]
      }),
    ),
  )

  function applyPatch(patch: Patch<T>) {
    history.past.push(patch)

    const {
      data = '',
      range: { start, end },
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

    // Scroll the contenteditable if the caret goes out of bounds
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

          if (patch.kind === 'caret') continue

          const {
            data = '',
            range: { start },
            selection,
            undo,
          } = patch

          setTextContent(
            value => `${value.slice(0, start)}${undo}${value.slice(start + data.length)}`,
          )

          select(selection.start, selection.end)

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

          if (patch.kind === 'caret') continue

          const {
            range: { start },
            data = '',
          } = patch

          select(start + data.length)

          const nextPatch = history.future.peek()
          if (!nextPatch) return

          if (!config.historyStrategy(patch, nextPatch)) return
        }
      }
      default: {
        const patch = createPatchFromInputEvent(event, textContent(), config.singleline)

        if (patch) {
          history.future.clear()

          applyPatch(patch)

          const {
            data = '',
            range: { start },
          } = patch

          select(start + data.length)
        }

        break
      }
    }
  }

  function onKeyDown(event: KeyboardEvent & { currentTarget: HTMLElement }) {
    if (config.keyBindings) {
      const keyCombo = getKeyComboFromKeyboardEvent(event)

      if (keyCombo in normalizedKeyBindings()) {
        const patch = normalizedKeyBindings()[keyCombo]!({
          textContent: textContent(),
          range: getSelection(event.currentTarget),
          event,
        })

        if (patch) {
          event.preventDefault()
          history.future.clear()
          applyPatch(patch)
          const {
            data = '',
            range: { start },
          } = patch
          select(start + (data.length ?? 0))
          return
        }
      }
    }

    if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') {
      if (history.past.peek()?.kind !== 'caret') {
        const selection = getSelection(element)
        history.past.push({
          kind: 'caret',
          range: selection,
          selection,
          undo: '',
        })
      }
      return
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

  function onPointerDown() {
    if (history.past.peek()?.kind === 'caret') return

    const initialSelection = getSelection(element)
    const controller = new AbortController()

    window.addEventListener(
      'pointerup',
      () => {
        controller.abort()
        const selection = getSelection(element)

        if (initialSelection.start === selection.start && initialSelection.end === selection.end) {
          return
        }

        history.past.push({
          kind: 'caret',
          range: selection,
          selection,
          undo: '',
        })
      },
      { signal: controller.signal },
    )
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
      onPointerDown={onPointerDown}
      style={{
        'scrollbar-width': props.singleline ? 'none' : undefined,
        'overflow-x': props.singleline ? 'auto' : undefined,
        'white-space': props.singleline ? 'pre' : 'break-spaces',
        ...config.style,
      }}
      {...rest}
    >
      {c()}
    </div>
  )
}
