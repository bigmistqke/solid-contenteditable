import { For, Show } from 'solid-js'
import { ContentEditable } from '../src'

export function App() {
  return (
    <ContentEditable value="     #hallo    #test" style={{ padding: '10px' }}>
      {value => (
        <For each={value.split('\n')}>
          {(line, lineIndex) => {
            const isLastLine = () => value.split('\n').length - 1 === lineIndex()
            return (
              <>
                <For each={line.split(' ')}>
                  {(word, wordIndex) => {
                    const isLastWord = () => line.split(' ').length - 1 === wordIndex()
                    return (
                      <>
                        <Show when={word.startsWith('#')} fallback={word}>
                          <button onClick={() => console.log('clicked!')}>{word}</button>
                        </Show>
                        <Show when={!isLastWord()}> </Show>
                      </>
                    )
                  }}
                </For>
                <Show when={!isLastLine()}>{'\n'}</Show>
              </>
            )
          }}
        </For>
      )}
    </ContentEditable>
  )
}
