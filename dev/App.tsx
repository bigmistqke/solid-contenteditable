import { For, Show, type Accessor, type ComponentProps, type JSX } from 'solid-js'
import { ContentEditable } from '../src'
import './App.css'

function Split(props: {
  value: string
  delimiter: string
  children: (value: string, index: Accessor<number>) => JSX.Element
}) {
  return (
    <For each={props.value.split(props.delimiter)}>
      {(value, index) => {
        const isLast = () => index() === props.value.split(props.delimiter).length - 1
        return (
          <>
            {props.children(value, index)}
            <Show when={!isLast()}>{props.delimiter}</Show>
          </>
        )
      }}
    </For>
  )
}

function Button(props: Omit<ComponentProps<'span'>, 'style'> & { style?: JSX.CSSProperties }) {
  return (
    <span
      role="button"
      tabIndex={0}
      {...props}
      style={{
        border: '1px solid grey',
        'border-radius': '3px',
        display: 'inline-block',
        padding: '7px',
        background: 'white',
        color: 'black',
        ...props.style,
      }}
    />
  )
}

function Mentions(props: { singleline?: boolean }) {
  return (
    <ContentEditable
      textContent="     #hallo    #test"
      class="contentEditable"
      singleline={props.singleline}
    >
      {value => (
        <Split value={value} delimiter={'\n'}>
          {line => (
            <Split value={line} delimiter={' '}>
              {word => (
                <Show when={word.startsWith('#')} fallback={word}>
                  <Button onClick={() => console.log('ok')}>{word}</Button>
                </Show>
              )}
            </Split>
          )}
        </Split>
      )}
    </ContentEditable>
  )
}

export function App() {
  return (
    <>
      <h1>solid-contenteditable</h1>
      <div class="list">
        <h3>solid-contenteditable</h3>
        <ContentEditable textContent="     #hallo    #test" class="contentEditable" />
        <h3>
          solid-contenteditable: <i>singleline</i>
        </h3>
        <ContentEditable singleline textContent="     #hallo    #test" class="contentEditable" />
        <h3>
          solid-contenteditable: <i>custom history-heuristic</i>
        </h3>
        <ContentEditable
          textContent="     #hallo    #test"
          class="contentEditable"
          historyHeuristic={(currentPatch, nextPatch) => {
            return (
              (currentPatch.kind === 'insertText' || currentPatch.kind === 'insertParagraph') &&
              (nextPatch.kind === 'insertText' || nextPatch.kind === 'insertParagraph')
            )
          }}
        />
        <h3>
          solid-contenteditable: <i>render-prop</i>
        </h3>
        <Mentions />
        <h3>
          solid-contenteditable: <i>render-prop and singleline</i>
        </h3>
        <Mentions singleline />
        <h3>
          default browser: <i>contenteditable</i>
        </h3>
        <div contentEditable style={{ 'white-space': 'pre-wrap' }} class="contentEditable">
          {'     '}
          <button>#hallo</button>
          {'    '}
          <button>#test</button>
        </div>
        <h3>
          default browser: <i>textarea</i>
        </h3>
        <textarea>{'     #hallo    #test'}</textarea>
        <h3>
          default browser: <i>input</i>
        </h3>
        <input value="     #hallo    #test" />
      </div>
    </>
  )
}
