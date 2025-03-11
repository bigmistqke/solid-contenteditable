import { For, Show, type Accessor, type JSX } from 'solid-js'
import { ContentEditable } from '../src'

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

function Mentions(props: { multiline?: boolean }) {
  return (
    <ContentEditable
      value="     #hallo    #test"
      style={{ padding: '10px' }}
      multiline={props.multiline}
    >
      {value => (
        <Split value={value} delimiter={'\n'}>
          {line => (
            <Split value={line} delimiter={' '}>
              {word => (
                <Show when={word.startsWith('#')} fallback={word}>
                  <button onClick={() => console.log('ok')} style={{ margin: '0px' }}>
                    {word}
                  </button>
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
      <ContentEditable multiline={false} value="     #hallo    #test" style={{ padding: '10px' }} />
      <ContentEditable value="     #hallo    #test" style={{ padding: '10px' }} />
      <Mentions multiline={false} />
      <Mentions />
    </>
  )
}
