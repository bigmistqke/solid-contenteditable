import { For, Show, type Accessor, type ComponentProps, type JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
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

function SimpleMarkDownEditor() {
  function WordHighlighter(props: { value: string }) {
    return (
      <Split value={props.value} delimiter={' '}>
        {word => {
          const [, content, link] = word.match(/\[([^\]]+)\]\(([^)]+)\)/) || []
          if (content && link) {
            return (
              <>
                [{content}](
                <a href={link} target="__blank">
                  {link}
                </a>
                )
              </>
            )
          }

          return word
        }}
      </Split>
    )
  }

  return (
    <ContentEditable
      textContent={'#Title\n##SubTitle'}
      class="contentEditable"
      render={value => (
        <Split value={value()} delimiter={'\n'}>
          {line => {
            if (line.startsWith('#')) {
              const [, hashes, content] = line.match(/^(\#{1,6})(.*)$/)!
              return (
                <Dynamic component={`h${hashes!.length}`} style={{ display: 'inline' }}>
                  <span style={{ opacity: 0.3 }}>{hashes}</span>
                  <WordHighlighter value={content!} />
                </Dynamic>
              )
            }
            return <WordHighlighter value={line} />
          }}
        </Split>
      )}
    />
  )
}

function HashTagHighlighter(props: { singleline?: boolean }) {
  return (
    <ContentEditable
      textContent="     #hallo    #test"
      class="contentEditable"
      singleline={props.singleline}
      render={value => (
        <Split value={value()} delimiter={'\n'}>
          {line => (
            <Split value={line} delimiter={' '}>
              {word => (
                <Show when={word.startsWith('#')} fallback={word}>
                  <Button onClick={() => console.log('clicked hashtag')}>{word}</Button>
                </Show>
              )}
            </Split>
          )}
        </Split>
      )}
    />
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
          solid-contenteditable: <i>custom history-strategy</i>
        </h3>
        <ContentEditable
          textContent="     #hallo    #test"
          class="contentEditable"
          historyStrategy={(currentPatch, nextPatch) => {
            return (
              (currentPatch.kind === 'insertText' || currentPatch.kind === 'insertParagraph') &&
              (nextPatch.kind === 'insertText' || nextPatch.kind === 'insertParagraph')
            )
          }}
        />
        <h3>
          solid-contenteditable: <i>render-prop (simple markdown-editor)</i>
        </h3>
        <SimpleMarkDownEditor />
        <h3>
          solid-contenteditable: <i>render-prop (highlight-editor)</i>
        </h3>
        <HashTagHighlighter />
        <h3>
          solid-contenteditable: <i>render-prop (highlight-editor) and singleline</i>
        </h3>
        <HashTagHighlighter singleline />
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
