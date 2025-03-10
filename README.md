<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-contenteditable&background=tiles&project=%20" alt="solid-contenteditable">
</p>

# @bigmistqke/solid-contenteditable

[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)

contenteditable build with solid-js

## Installation

```bash
npm i @bigmistqke/solid-contenteditable
# or
yarn add @bigmistqke/solid-contenteditable
# or
pnpm add @bigmistqke/solid-contenteditable
```

## Usage

```tsx
import { ContentEditable } from '@bigmistqke/solid-contenteditable'
import { For, Show } from 'solid-js'

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
```

## Gotcha

`<ContentEditable/>` assumes that the generated content of `props.children(value)` is identical to `props.value`, this means that newlines and whitespaces should match up. Additional tags can be added and will not cause issues.
