import { For, Show } from 'solid-js'
import { ContentEditable } from '../src'

export default function App() {
  return (
    <ContentEditable
      value="     #hallo    #test"
      style={{ padding: '10px' }}
      onDerivation={value => (
        <For each={value.split('\n')}>
          {line => (
            <For each={line.split(' ')}>
              {word => (
                <>
                  <Show when={word.startsWith('#')} fallback={word}>
                    <button onClick={() => console.log('ok')}>{word}</button>
                  </Show>{' '}
                </>
              )}
            </For>
          )}
        </For>
      )}
    />
  )
}
