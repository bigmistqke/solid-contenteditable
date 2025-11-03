import {
  type Accessor,
  children,
  type ComponentProps,
  createEffect,
  createMemo,
  createSignal,
  type JSX,
  mergeProps,
  splitProps,
} from 'solid-js'

const DEBUG = true

const IS_MAC = navigator.platform.startsWith('Mac')

interface RangeOffsets {
  start: number
  end: number
}

interface SelectionOffsets {
  start: number
  end: number
  anchor: number
  focus: number
}

export type Patch<T = never> = {
  // see https://w3c.github.io/input-events/#interface-InputEvent-Attributes
  kind:
    | 'insertLineBreak'
    | 'insertFromPaste'
    | 'insertParagraph'
    | 'insertReplacementText'
    | 'insertText'
    | 'insertCompositionText'
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
  range: RangeOffsets
  selection: SelectionOffsets
  undo: string
}

/**********************************************************************************/
/*                                                                                */
/*                                      Utils                                     */
/*                                                                                */
/**********************************************************************************/

const isNewLine = (char?: string) => char === '\n'

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
const wordSegmenter = new Intl.Segmenter(undefined, { granularity: 'word' })

function getGraphemeSegments(text: string) {
  return Array.from(graphemeSegmenter.segment(text))
}

function getNextGraphemeClusterBoundary(text: string, position: number): number {
  if (position >= text.length) return position

  const segments = getGraphemeSegments(text)
  let currentOffset = 0

  for (const segment of segments) {
    const segmentEnd = currentOffset + segment.segment.length
    if (position >= currentOffset && position < segmentEnd) {
      // Position is inside this segment, return end of segment
      return segmentEnd
    }
    currentOffset = segmentEnd
  }

  return Math.min(text.length, position + 1)
}

function getPreviousGraphemeClusterBoundary(text: string, position: number): number {
  if (position <= 0) return 0

  const segments = getGraphemeSegments(text)
  let currentOffset = 0

  for (const segment of segments) {
    const segmentEnd = currentOffset + segment.segment.length
    if (position > currentOffset && position <= segmentEnd) {
      // Position is at end of or inside this segment, return start of segment
      return currentOffset
    }
    currentOffset = segmentEnd
  }

  return Math.max(0, position - 1)
}

function getWordSegments(text: string) {
  return Array.from(wordSegmenter.segment(text))
}

function getNextWordBoundary(text: string, position: number): number {
  const segments = getWordSegments(text)

  // Find the next word boundary after the current position
  for (const segment of segments) {
    // Skip if we haven't reached our position yet
    if (segment.index + segment.segment.length <= position) continue

    // If this segment starts after our position
    if (segment.index > position) {
      // If it's a word, return the start of it
      if (segment.isWordLike) return segment.index
      // Otherwise continue to find the next word
      continue
    }

    // We're inside this segment, return the end of it
    return segment.index + segment.segment.length
  }

  return text.length
}

function getPreviousWordBoundary(text: string, position: number): number {
  const segments = getWordSegments(text)

  // Find the previous word boundary before the current position
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i]

    // Skip if this segment is at or after our position
    if (segment.index >= position) continue

    // If this segment ends before our position and is a word, return its start
    if (segment.isWordLike && segment.index + segment.segment.length <= position) {
      return segment.index
    }

    // If we're inside this segment and it's a word, return its start
    if (
      segment.isWordLike &&
      segment.index < position &&
      segment.index + segment.segment.length > position
    ) {
      return segment.index
    }
  }

  return 0
}

// TODO: replace with createSignal when solid 2.0
function createWritable<T>(fn: () => T) {
  const signal = createMemo(() => createSignal(fn()))
  const get = () => signal()[0]()
  const set = (v: any) => signal()[1](v)
  return [get, set] as ReturnType<typeof createSignal<T>>
}

/**********************************************************************************/
/*                                                                                */
/*                                TreeWalker Utils                                */
/*                                                                                */
/**********************************************************************************/

function* iterateTextNodes(element: HTMLElement): Generator<Text, void, unknown> {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
  let textNode = walker.nextNode()
  while (textNode) {
    yield textNode as Text
    textNode = walker.nextNode()
  }
}

function getTextOffset(element: HTMLElement, targetNode: Node, targetOffset: number): number {
  // Use TreeWalker to efficiently traverse text nodes
  let offset = 0

  for (const textNode of iterateTextNodes(element)) {
    if (textNode === targetNode) {
      return offset + targetOffset
    }
    offset += textNode.textContent?.length || 0
  }

  // If target node not found, return the offset anyway (shouldn't happen in practice)
  return offset + targetOffset
}

function getSelectionOffsets(element: HTMLElement): SelectionOffsets {
  const selection = document.getSelection()

  if (!selection || selection.rangeCount === 0) {
    return { start: 0, end: 0, anchor: 0, focus: 0 }
  }

  // Use the improved text offset calculation
  const anchor = getTextOffset(element, selection.anchorNode!, selection.anchorOffset)
  const focus = getTextOffset(element, selection.focusNode!, selection.focusOffset)

  return {
    start: Math.min(anchor, focus),
    end: Math.max(anchor, focus),
    anchor,
    focus,
  }
}

function select(element: HTMLElement, { anchor, focus }: { anchor: number; focus?: number }) {
  const selection = document.getSelection()!
  const range = document.createRange()

  const resultAnchor = getNodeAndOffsetAtIndex(element, anchor)

  // Special handling for newline characters when using nested divs
  //
  // When content is wrapped in nested containers like:
  // <div class="ec-line"><div class="code"><span>text\n</span></div></div>
  // <div class="ec-line"><div class="code"><span>next line</span></div></div>
  //
  // The browser places the caret at the end of the newline character, but this
  // keeps it visually on the same line. We need to move it to the beginning
  // of the next line's content for proper visual feedback.
  if (resultAnchor.node.nodeType === Node.TEXT_NODE) {
    const content = resultAnchor.node.textContent || ''
    const isAtEndOfNewline =
      // Case 1: Pure newline in its own span - e.g., <span>\n</span>
      // Position after 'sum' and press space creates: <span>sum</span><span>\n</span>
      (content === '\n' && resultAnchor.offset === 1) ||
      // Case 2: Trailing whitespace + newline - e.g., <span>sum} \n</span>
      // Position after 'sum} ' and press space creates: <span>sum} \n</span>
      (content.endsWith('\n') && resultAnchor.offset === content.length)

    if (isAtEndOfNewline) {
      // Find the next text node after the current one and move caret there
      // This makes the caret appear at the beginning of the next line visually
      let foundCurrent = false
      for (const textNode of iterateTextNodes(element)) {
        if (foundCurrent) {
          resultAnchor.node = textNode
          resultAnchor.offset = 0
          break
        }
        if (textNode === resultAnchor.node) {
          foundCurrent = true
        }
      }
    }
  }

  range.setStart(resultAnchor.node, resultAnchor.offset)
  range.setEnd(resultAnchor.node, resultAnchor.offset)

  selection.empty()
  selection.addRange(range)

  if (focus !== undefined) {
    const resultFocus = getNodeAndOffsetAtIndex(element, focus)
    selection.extend(resultFocus.node, resultFocus.offset)
  }
}

function getNodeAndOffsetAtIndex(element: HTMLElement, index: number) {
  // Traverse all text nodes in order
  let currentOffset = 0

  for (const textNode of iterateTextNodes(element)) {
    const textLength = textNode.textContent?.length || 0

    if (currentOffset + textLength >= index) {
      const nodeOffset = index - currentOffset
      return {
        node: textNode,
        offset: nodeOffset,
      }
    }
    currentOffset += textLength
  }

  // If no text node found and index is 0, we need to handle empty containers
  if (index === 0) {
    // Find the deepest element that could contain text
    let deepest: Element | ChildNode = element
    while (deepest.firstChild && deepest.firstChild.nodeType === Node.ELEMENT_NODE) {
      deepest = deepest.firstChild
    }

    // Create an empty text node if needed
    if (deepest.childNodes.length === 0) {
      const emptyText = document.createTextNode('')
      deepest.appendChild(emptyText)
      return { node: emptyText, offset: 0 }
    }

    return { node: deepest, offset: 0 }
  }

  throw new Error(`Could not find text node at index ${index}`)
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
  const keyCombo = ctrl + alt + shift + meta + event.code.replace('Key', '')

  DEBUG && console.info('getKeyComboFromKeyboardEvent', event, keyCombo)
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
/*                                  History Utils                                 */
/*                                                                                */
/**********************************************************************************/

type HistoryHandler<T extends string> = (history: History<T>) => Array<Patch<T>>

function createHistory<T extends string = never>() {
  let past: Array<Patch<T>> = []
  let future: Array<Patch<T>> = []

  return {
    future: {
      clear() {
        future.length = 0
      },
      pop() {
        const patch = future.pop()
        DEBUG && console.info('future pop', { patch, future, past })
        return patch
      },
      peek() {
        const patch = future[future.length - 1]
        DEBUG && console.info('future peek', { patch, future, past })
        return patch
      },
      push(patch: Patch<T>) {
        DEBUG && console.info('future push', { patch, future, past })
        future.push(patch)
      },
    },
    past: {
      pop() {
        const patch = past.pop()
        DEBUG && console.info('past pop', { patch, future, past })
        if (patch) {
          future.push(patch)
        }
        return patch
      },
      peek() {
        const patch = past[past.length - 1]
        DEBUG && console.info('past pop', { patch, future, past })
        return patch
      },
      push(patch: Patch<T>) {
        DEBUG && console.info('past push', { patch, future, past })
        past.push(patch)
      },
    },
  }
}

type History<T extends string = never> = ReturnType<typeof createHistory<T>>

function defaultUndo<T extends string = never>(history: History<T>): Array<Patch<T>> {
  const patches: Array<Patch<T>> = []

  while (history.past.peek()) {
    const patch = history.past.pop()
    if (!patch) break

    patches.push(patch)

    // Skip caret movements
    if (patch.kind === 'caret') continue

    // Check if we should continue grouping
    const nextPatch = history.past.peek()
    if (!nextPatch) break

    // Stop grouping logic
    const shouldStopGrouping =
      // Different operation types that shouldn't be grouped
      (patch.kind === 'deleteContentBackward' && nextPatch.kind === 'deleteContentForward') ||
      (patch.kind === 'deleteContentForward' && nextPatch.kind === 'deleteContentBackward') ||
      // Space after non-space shouldn't group
      (patch.data === ' ' && nextPatch.data !== ' ') ||
      // Non-text operations shouldn't group
      !['insertText', 'deleteContentBackward', 'deleteContentForward'].includes(patch.kind) ||
      !['insertText', 'deleteContentBackward', 'deleteContentForward'].includes(nextPatch.kind)

    if (shouldStopGrouping) break
  }

  return patches
}

function defaultRedo<T extends string = never>(history: History<T>): Array<Patch<T>> {
  const patches: Array<Patch<T>> = []

  while (history.future.peek()) {
    const patch = history.future.pop()
    if (!patch) break

    patches.push(patch)
    history.past.push(patch)

    // Skip caret movements
    if (patch.kind === 'caret') continue

    // Check if we should continue grouping
    const nextPatch = history.future.peek()
    if (!nextPatch) break

    // Stop grouping logic (same as undo)
    const shouldStopGrouping =
      (patch.kind === 'deleteContentBackward' && nextPatch.kind === 'deleteContentForward') ||
      (patch.kind === 'deleteContentForward' && nextPatch.kind === 'deleteContentBackward') ||
      (patch.data === ' ' && nextPatch.data !== ' ') ||
      !['insertText', 'deleteContentBackward', 'deleteContentForward'].includes(patch.kind) ||
      !['insertText', 'deleteContentBackward', 'deleteContentForward'].includes(nextPatch.kind)

    if (shouldStopGrouping) break
  }

  return patches
}

/**********************************************************************************/
/*                                                                                */
/*                                   Patch Utils                                  */
/*                                                                                */
/**********************************************************************************/

function deleteContentForward(source: string, selection: SelectionOffsets): Patch {
  const range = {
    start: selection.start,
    end:
      selection.start === selection.end
        ? getNextGraphemeClusterBoundary(source, selection.end)
        : selection.end,
  }

  const patch = {
    kind: 'deleteContentForward',
    range,
    selection,
    undo: source.slice(range.start, range.end),
  } as const

  DEBUG && console.info('deleteContentForward', source, selection, patch)

  return patch
}

function deleteContentBackward(source: string, selection: SelectionOffsets): Patch {
  const range = {
    start:
      selection.start === selection.end
        ? getPreviousGraphemeClusterBoundary(source, selection.start)
        : selection.start,
    end: selection.end,
  }

  const patch = {
    kind: 'deleteContentBackward',
    range,
    selection,
    undo: source.slice(range.start, range.end),
  } as const

  DEBUG && console.info('deleteContentBackward', source, selection, patch)

  return patch
}

function deleteWordBackward(source: string, selection: SelectionOffsets): Patch {
  const range = {
    start:
      selection.start === selection.end
        ? getPreviousWordBoundary(source, selection.start)
        : selection.start,
    end: selection.end,
  }

  const patch = {
    kind: 'deleteWordBackward',
    range,
    selection,
    undo: source.slice(range.start, range.end),
  } as const

  DEBUG && console.info('deleteWordBackward', source, selection, patch)

  return patch
}

function deleteWordForward(source: string, selection: SelectionOffsets): Patch {
  const range = {
    start: selection.start,
    end:
      selection.start === selection.end
        ? getNextWordBoundary(source, selection.end)
        : selection.end,
  }

  const patch = {
    kind: 'deleteWordForward',
    selection,
    range,
    undo: source.slice(range.start, range.end),
  } as const

  DEBUG && console.info('deleteWordForward', source, selection, patch)

  return patch
}

function deleteSoftLineBackward(source: string, selection: SelectionOffsets): Patch {
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

  const patch = {
    kind: 'deleteSoftLineBackward',
    selection,
    range,
    undo: source.slice(range.start, range.end),
  } as const

  DEBUG && console.info('deleteSoftLineBackward', source, selection)

  return patch
}

function deleteSoftLineForward(source: string, selection: SelectionOffsets): Patch {
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

  const patch = {
    kind: 'deleteSoftLineForward',
    selection,
    range,
    undo: source.slice(range.start, range.end),
  } as const

  DEBUG && console.info('deleteSoftLineForward', source, selection)

  return patch
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
  const selection = getSelectionOffsets(event.currentTarget)

  DEBUG && console.info('createPatchFromInputEvent', event)

  switch (event.inputType) {
    case 'insertCompositionText':
    case 'insertText': {
      return {
        kind: event.inputType,
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
    | 'children'
    | 'contenteditable'
    | 'onBeforeInput'
    | 'textContent'
    | 'onInput'
    | 'style'
    | 'onCompositionStart'
    | 'onCompositionEnd'
    | 'onUndo'
    | 'onRedo'
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
      range: RangeOffsets
      event: KeyboardEvent & { currentTarget: HTMLElement }
    }) => Patch<T> | null
  >
  /** If contentEditable is editable or not. Defaults to `true`. */
  editable?: boolean
  /**
   * Callback to handle undo operations.
   * If not provided, uses the default undo behavior.
   *
   * @param history - The history object with past and future stacks
   * @returns Array of patches that should be undone (applied in reverse)
   */
  onUndo?: HistoryHandler<T>
  /**
   * Callback to handle redo operations.
   * If not provided, uses the default redo behavior.
   *
   * @param history - The history object with past and future stacks
   * @returns Array of patches that should be redone (applied forward)
   */
  onRedo?: HistoryHandler<T>
  onCompositionStart?: JSX.EventHandler<HTMLDivElement, CompositionEvent>
  onCompositionEnd?: JSX.EventHandler<HTMLDivElement, CompositionEvent>
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
        onRedo: defaultRedo as HistoryHandler<T>,
        onUndo: defaultUndo as HistoryHandler<T>,
      },
      props,
    ),
    [
      'render',
      'editable',
      'onUndo',
      'onRedo',
      'onTextContent',
      'keyBindings',
      'singleline',
      'style',
      'textContent',
      'onCompositionEnd',
      'onCompositionStart',
    ] satisfies Array<keyof Partial<ContentEditableProps>>,
  )
  const [textContent, setTextContent] = createWritable(() => props.textContent)
  const history = createHistory<T>()
  let element: HTMLDivElement = null!
  let compositionStartSelection: SelectionOffsets | null = null

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

  function onBeforeInput(event: InputEvent & { currentTarget: HTMLDivElement }) {
    event.preventDefault()

    DEBUG && console.info('onBeforeInput', event)

    if (event.isComposing) {
      return
    }

    switch (event.inputType) {
      case 'historyUndo': {
        // Get patches to undo using custom handler or default
        const patches = config.onUndo(history)

        // Apply undo for each patch
        let lastSelection: SelectionOffsets | undefined

        for (const patch of patches) {
          if (patch.kind === 'caret') {
            lastSelection = patch.selection
            continue
          }

          const {
            data = '',
            range: { start },
            selection,
            undo,
          } = patch

          setTextContent(
            value => `${value.slice(0, start)}${undo}${value.slice(start + data.length)}`,
          )

          lastSelection = selection
        }

        // Restore selection from last non-caret patch
        if (lastSelection) {
          select(element, lastSelection)
        }

        props.onTextContent?.(textContent())
        break
      }
      case 'historyRedo': {
        // Get patches to redo using custom handler or default
        const patches = config.onRedo(history)

        // Apply redo for each patch
        for (const patch of patches) {
          if (patch.kind === 'caret') continue

          applyPatch(patch)
        }

        props.onTextContent?.(textContent())
        break
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

          select(element, { anchor: start + data.length })
        }

        break
      }
    }
  }

  function onKeyDown(event: KeyboardEvent & { currentTarget: HTMLElement }) {
    DEBUG && console.info('onKeyDown', event)

    if (config.keyBindings) {
      const keyCombo = getKeyComboFromKeyboardEvent(event)
      const keybindings = normalizedKeyBindings()

      if (keyCombo && keyCombo in keybindings) {
        const createPatch = keybindings[keyCombo]
        if (!createPatch) {
          throw new Error(`Expected keybindgings[${keyCombo}] to be defined.`)
        }

        const patch = createPatch({
          textContent: textContent(),
          range: getSelectionOffsets(event.currentTarget),
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
          select(element, { anchor: start + data.length })
          return
        }
      }
    }

    // Update caret instead of creating a new caret history entry
    if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') {
      if (history.past.peek()?.kind !== 'caret') {
        const selection = getSelectionOffsets(element)
        history.past.push({
          kind: 'caret',
          range: selection,
          selection,
          undo: '',
        })
      }
      return
    }

    if (IS_MAC) {
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

    const initialSelection = getSelectionOffsets(element)
    const controller = new AbortController()

    window.addEventListener(
      'pointerup',
      () => {
        controller.abort()
        const selection = getSelectionOffsets(element)

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

  function onCompositionStart(
    event: CompositionEvent & { currentTarget: HTMLDivElement; target: Element },
  ) {
    DEBUG && console.info('onCompositionStart', event)

    compositionStartSelection = getSelectionOffsets(event.currentTarget)

    config.onCompositionStart?.(event)
  }

  function onCompositionEnd(
    event: CompositionEvent & { currentTarget: HTMLDivElement; target: Element },
  ) {
    DEBUG && console.info('onCompositionEnd', event)

    if (!compositionStartSelection) {
      throw new Error('Expected compositionStartSelection to be defined.')
    }

    // Restore selection to where composition started
    select(element, compositionStartSelection)

    // Dispatch beforeinput event to go through normal input handling
    const inputEvent = new InputEvent('beforeinput', {
      inputType: 'insertCompositionText',
      data: event.data || '',
      bubbles: true,
      cancelable: true,
    })

    // Set isComposing to false since composition is ending
    Object.defineProperty(inputEvent, 'isComposing', {
      value: false,
      writable: false,
    })

    event.currentTarget.dispatchEvent(inputEvent)

    compositionStartSelection = null

    config.onCompositionEnd?.(event)
  }

  createEffect(() => {
    const elementTextContent = c
      .toArray()
      .map(value => (value instanceof Element ? value.textContent : value))
      .join('')
    if (elementTextContent !== textContentWithTrailingNewLine()) {
      console.warn(
        `⚠️ WARNING ⚠️
- props.textContent and the textContent of props.children(textContent) are not equal!
- This breaks core-assumptions of <ContentEditable/> and will cause undefined behaviors!
- see www.github.com/bigmistqke/solid-contenteditable/#limitations-with-render-prop`,
      )
      console.table({
        'props.textContent': textContentWithTrailingNewLine(),
        'element.textContent': elementTextContent,
      })
    }
  })

  return (
    // biome-ignore lint/a11y/useSemanticElements: <explanation: we are building a custom contenteditable>
    <div
      ref={element}
      role="textbox"
      tabIndex={0}
      aria-multiline={!config.singleline}
      contenteditable={config.editable}
      onBeforeInput={onBeforeInput}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
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
