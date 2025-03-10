import {
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
  type ComponentProps,
  type JSX,
} from 'solid-js'

type RangeVector = { start: number; end: number }

export type Patch = {
  action: {
    range: RangeVector
    data?: string
    selection?: RangeVector
  }
  undo?: {
    data: string
    selection?: RangeVector
  }
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
/*                               Get Selection Range                              */
/*                                                                                */
/**********************************************************************************/

export function getSelectionRange(element: HTMLElement): RangeVector {
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

function deleteContentForward(source: string, range: RangeVector) {
  return {
    range: {
      start: range.start,
      end: range.start === range.end ? Math.min(source.length - 1, range.end + 1) : range.end,
    },
  }
}

function deleteContentBackward(source: string, range: RangeVector) {
  return {
    range: {
      start: range.start === range.end ? Math.max(0, range.start - 1) : range.start,
      end: range.end,
    },
  }
}

function deleteWord(source: string, range: RangeVector, direction: number) {
  let index = range.start

  // If the previous value is whitespace,
  // increment to next non-whitespace character
  if (isWhiteSpace(source[index + direction])) {
    while (index > 0 && isWhiteSpace(source[index + direction])) {
      index += direction
    }
  }
  // If the previous value is alphanumeric,
  // we delete all previous alphanumeric values
  if (isAlphanumeric(source[index + direction])) {
    while (index > 0 && isAlphanumeric(source[index + direction])) {
      index += direction
    }
  } else {
    // If the previous value is not alphanumeric,
    // we delete all previous non-alphanumeric values
    // until the next whitespace or alphanumeric
    while (
      index > 0 &&
      !isWhiteSpace(source[index + direction]) &&
      !isAlphanumeric(source[index + direction])
    ) {
      index += direction
    }
  }

  return {
    range: {
      start: index,
      end: range.end,
    },
  }
}

function deleteSoftLine(source: string, range: RangeVector, direction: number) {
  let index = range.start

  if (isNewLine(source[index + direction])) {
    index -= 1
  } else {
    while (index > 0 && !isNewLine(source[index + direction])) {
      index += direction
    }
  }

  return {
    range: {
      start: index,
      end: range.end,
    },
  }
}

/**********************************************************************************/
/*                                                                                */
/*                                  Create Patch                                  */
/*                                                                                */
/**********************************************************************************/

function createPatch(event: InputEvent & { currentTarget: HTMLElement }, source: string): Patch {
  const range = getSelectionRange(event.currentTarget)
  return {
    action: createAction(event, source, range),
    undo: {
      data: source.slice(range.start, range.end),
      selection: range,
    },
  }
}

function createAction(
  event: InputEvent & { currentTarget: HTMLElement },
  source: string,
  range: RangeVector,
): Patch['action'] {
  switch (event.inputType) {
    case 'insertText': {
      return {
        range,
        data: event.data || '',
      }
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
      return deleteWord(source, range, -1)
    }
    case 'deleteWordForward': {
      if (range.start !== range.end) {
        return deleteContentForward(source, range)
      }
      return deleteWord(source, range, -1)
    }
    case 'deleteSoftLineBackward': {
      if (range.start !== range.end) {
        return deleteContentForward(source, range)
      }
      return deleteSoftLine(source, range, -1)
    }
    case 'deleteSoftLineForward': {
      if (range.start !== range.end) {
        return deleteContentForward(source, range)
      }
      return deleteSoftLine(source, range, 1)
    }
    case 'deleteByCut': {
      return {
        range,
      }
    }
    case 'insertReplacementText':
    case 'insertFromPaste': {
      return {
        range,
        data: event.dataTransfer?.getData('text'),
      }
    }
    case 'insertParagraph': {
      return {
        range,
        data: '\n',
      }
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
  editable?: boolean
  onDerivation?: (source: string) => JSX.Element
  onValue?: (value: string) => void
  onPatch?: (event: KeyboardEvent & { currentTarget: HTMLElement }) => Patch | null
  style?: JSX.CSSProperties
  value: string
}

export function ContentEditable(props: ContentEditableProps) {
  const [config, rest] = splitProps(mergeProps({ spellcheck: false, editable: true }, props), [
    'editable',
    'onDerivation',
    'onValue',
    'onPatch',
    'style',
    'value',
  ])
  const [value, setValue] = createWritable(() => props.value)
  let element: HTMLDivElement = null!
  const history = createHistory()

  function applyPatch(patch: Patch) {
    history.push(patch)

    const {
      action: {
        range: { start, end },
        data,
      },
    } = patch

    const newValue = `${value().slice(0, start)}${data || ''}${value().slice(end)}`

    setValue(newValue)

    props.onValue?.(newValue)
  }

  function select(start: number, end?: number) {
    const result = getNodeAndOffsetAtIndex(element, start)

    if (!result) {
      console.error('node is not an instance of Node', result)
      return
    }

    const { node, offset } = result

    const selection = document.getSelection()!
    const range = document.createRange()
    selection.removeAllRanges()
    selection.addRange(range)

    range.setStart(node, offset)

    if (end) {
      range.setEnd(node, end)
    } else {
      range.setEnd(node, offset)
    }
  }

  function onInput(event: InputEvent & { currentTarget: HTMLDivElement }) {
    event.preventDefault()

    switch (event.inputType) {
      case 'historyUndo': {
        const patch = history.pop()

        if (!patch) return

        const {
          action: {
            range: { start },
            data = '',
            selection,
          },
          undo,
        } = patch

        console.log('data', data)

        setValue(
          value => `${value.slice(0, start)}${undo?.data || ''}${value.slice(start + data.length)}`,
        )

        if (selection) {
          select(selection.start, selection.end)
        } else {
          select(start + (undo?.data?.length || 0))
        }

        props.onValue?.(value())

        break
      }
      case 'historyRedo': {
        const patch = history.future.pop()

        if (!patch) return

        applyPatch(patch)
        const {
          action: {
            range: { start },
            data = '',
            selection,
          },
        } = patch

        if (selection) {
          select(selection.start, selection.end)
        } else {
          select(start + data.length)
        }
        break
      }
      default: {
        history.clearFuture()

        const text = event.currentTarget.innerText
        const patch = createPatch(event, text)
        applyPatch(patch)

        const {
          action: {
            range: { start, end },
            data = '',
            selection,
          },
        } = patch

        if (selection) {
          select(selection.start, selection.end)
        } else {
          console.log(start, data.length)
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
        const {
          action: { selection },
        } = patch
        if (selection) {
          select(selection.start, selection.end)
        }
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

  return (
    <div
      ref={element}
      contenteditable={config.editable}
      onBeforeInput={onInput}
      onInput={onInput}
      onKeyDown={onKeyDown}
      style={{ 'white-space': 'pre-wrap', ...config.style }}
      {...rest}
    >
      {props.onDerivation?.(value()) || value()}
    </div>
  )
}
