import {
  children,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
  type ComponentProps,
  type JSX,
} from 'solid-js'

type RangeVector = { start: number; end: number }

export type Patch = {
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

function getNodeAndOffsetAtIndex(element: HTMLElement, index: number) {
  const nodes = element.childNodes

  let accumulator = 0

  // Determine which node contains the selection-(start|end)
  for (const node of nodes) {
    const contentLength = node.textContent?.length || 0

    accumulator += contentLength

    if (accumulator >= index) {
      return {
        node: node instanceof Text ? node : node.firstChild!,
        offset: index - (accumulator - contentLength),
      }
    }
  }

  throw `Could not find node`
}

/**********************************************************************************/
/*                                                                                */
/*                                 Create History                                 */
/*                                                                                */
/**********************************************************************************/

function createHistory() {
  const [past, setPast] = createSignal<Patch[]>([])
  const [future, setFuture] = createSignal<Patch[]>([])

  function clearFuture() {
    setFuture(future => (future.length > 0 ? [] : future))
  }

  function push(patch: Patch) {
    setPast(patches => [...patches, patch])
  }

  function pop() {
    const patch = past().pop()
    if (patch) {
      setFuture(patches => [...patches, patch])
    }
    return patch
  }

  return {
    get past() {
      return past()
    },
    get future() {
      return future()
    },
    clearFuture,
    push,
    pop,
  }
}

/**********************************************************************************/
/*                                                                                */
/*                                   Patch Utils                                  */
/*                                                                                */
/**********************************************************************************/

function createPatch(source: string, range: RangeVector, data?: string): Patch {
  return {
    range,
    data,
    undo: source.slice(range.start, range.end),
  }
}

function deleteContentForward(source: string, range: RangeVector): Patch {
  const end = range.start === range.end ? Math.min(source.length - 1, range.end + 1) : range.end

  return createPatch(source, {
    start: range.start,
    end,
  })
}

function deleteContentBackward(source: string, range: RangeVector): Patch {
  const start = range.start === range.end ? Math.max(0, range.start - 1) : range.start

  return createPatch(source, {
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

  return createPatch(source, {
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

  return createPatch(source, {
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

  return createPatch(source, {
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

  return createPatch(source, {
    start: range.start,
    end,
  })
}

/**********************************************************************************/
/*                                                                                */
/*                            Create Patch From Event                             */
/*                                                                                */
/**********************************************************************************/

function createPatchFromEvent(
  event: InputEvent & { currentTarget: HTMLElement },
  source: string,
  multiline: boolean,
): Patch | null {
  const range = getSelectedRange(event.currentTarget)
  switch (event.inputType) {
    case 'insertText': {
      return createPatch(source, range, event.data || '')
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
      return createPatch(source, range)
    }
    case 'insertReplacementText':
    case 'insertFromPaste': {
      let data = event.dataTransfer?.getData('text')
      if (!multiline && data) {
        data = data.replaceAll('\n', ' ')
      }
      return createPatch(source, range, data)
    }
    case 'insertParagraph': {
      if (!multiline) return null
      return createPatch(source, range, '\n')
    }
    default:
      throw `Unsupported inputType: ${event.inputType}`
  }
}

/**********************************************************************************/
/*                                                                                */
/*                                Content Editable                                */
/*                                                                                */
/**********************************************************************************/

export interface ContentEditableProps
  extends Omit<ComponentProps<'div'>, 'onInput' | 'children' | 'contenteditable' | 'style'> {
  children?: (source: string) => JSX.Element
  editable?: boolean
  multiline?: boolean
  onPatch?: (event: KeyboardEvent & { currentTarget: HTMLElement }) => Patch | null
  onValue?: (value: string) => void
  style?: JSX.CSSProperties
  value: string
}

export function ContentEditable(props: ContentEditableProps) {
  const [config, rest] = splitProps(
    mergeProps({ spellcheck: false, editable: true, multiline: true }, props),
    ['children', 'editable', 'multiline', 'onPatch', 'onValue', 'style', 'value'],
  )
  const [value, setValue] = createWritable(() => props.value)
  // Add an additional newline if the value ends with a newline,
  // otherwise the browser will remove that trailing newline
  const valueWithTrailingNewLine = createMemo(() =>
    value().endsWith('\n') ? `${value()}\n` : value(),
  )
  const c = children(
    () => props.children?.(valueWithTrailingNewLine()) || valueWithTrailingNewLine(),
  )
  const history = createHistory()
  let element: HTMLDivElement = null!

  function applyPatch(patch: Patch) {
    history.push(patch)

    const {
      range: { start, end },
      data = '',
    } = patch

    const newValue = `${value().slice(0, start)}${data}${value().slice(end)}`

    setValue(newValue)

    props.onValue?.(newValue)
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
  }

  function onInput(event: InputEvent & { currentTarget: HTMLDivElement }) {
    event.preventDefault()

    switch (event.inputType) {
      case 'historyUndo': {
        const patch = history.pop()

        if (!patch) return

        const {
          range: { start, end },
          data = '',
          undo = '',
        } = patch

        setValue(value => `${value.slice(0, start)}${undo}${value.slice(start + data.length)}`)

        select(start, end)

        props.onValue?.(value())

        break
      }
      case 'historyRedo': {
        const patch = history.future.pop()

        if (!patch) return

        applyPatch(patch)
        const {
          range: { start },
          data = '',
        } = patch

        select(start + data.length)

        break
      }
      default: {
        history.clearFuture()

        const source = event.currentTarget.innerText
        const patch = createPatchFromEvent(event, source, config.multiline)

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
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        // Undo: ctrl+z
        case 'z': {
          event.preventDefault()
          event.currentTarget.dispatchEvent(
            new InputEvent('input', {
              inputType: 'historyUndo',
              bubbles: true,
              cancelable: true,
            }),
          )
          break
        }
        // Redo: ctrl+shift+z
        case 'Z': {
          event.preventDefault()
          event.currentTarget.dispatchEvent(
            new InputEvent('input', {
              inputType: 'historyRedo',
              bubbles: true,
              cancelable: true,
            }),
          )
        }
      }
    }
  }

  createEffect(() => {
    if (
      c
        .toArray()
        .map(value => (value instanceof Element ? value.textContent : value))
        .join('') !== valueWithTrailingNewLine()
    ) {
      console.warn(
        `⚠️ WARNING ⚠️
- props.value and the textContent of props.children should be equal!
- This will break <ContentEditable/>!
- see www.github.com/bigmistqke/solid-contenteditable/#gotcha`,
      )
    }
  })

  return (
    <div
      ref={element}
      role="textbox"
      aria-multiline={config.multiline}
      contenteditable={config.editable}
      onBeforeInput={onInput}
      onInput={onInput}
      onKeyDown={onKeyDown}
      style={{ 'white-space': 'pre-wrap', ...config.style }}
      {...rest}
    >
      {c()}
    </div>
  )
}
