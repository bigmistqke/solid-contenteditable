<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-contenteditable&background=tiles&project=%20" alt="solid-contenteditable">
</p>

# @bigmistqke/solid-contenteditable

[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)

contenteditable build with solid-js

## Installation

```bash
npm i @bigmistqke/solid-contenteditable
```

```bash
yarn add @bigmistqke/solid-contenteditable
```

```bash
pnpm add @bigmistqke/solid-contenteditable
```

### Props

`ContentEditable` accepts the following props:

- `children`: A function that receives `textContent` and returns `JSX.Element`. This render-prop allows for adding markup around the textContent while keeping the underlying textContent unchanged ([more info](#limitations-with-render-prop))
- `editable`: A boolean that controls whether the content is editable. Defaults to `true`.
- `historyHeuristic`: A function that determines whether two consecutive history entries should be merged ([more info](#history-heuristic))
- `onPatch`: A function that can return a (custom) patch based on a keyboard event. Return `Patch` or `null`.
- `onTextContent`: A callback that is triggered whenever the text-content is updated.
- `singleline`: A boolean that indicates whether the component should accept only single-line input. When set to `true`, pasted newlines are replaced with spaces, and pressing the space key will be ignored. Defaults to `false`.

- `textContent`: The text-content of the component.

## Simple Example

```tsx
import { createSignal } from 'solid-js'
import { ContentEditable } from 'solid-content-editable'

function ControlledContentEditable {
  const [text, setText] = createSignal('Editable content here...')
  return <ContentEditable textContent={text()} onTextContent={setText} />
}

function UncontrolledContentEditable {
  return <ContentEditable textContent='Editable content here...' onTextContent={setText} />
}
```

## Advanced Example

```tsx
import { ContentEditable } from '@bigmistqke/solid-contenteditable'
import { For, Show } from 'solid-js'

function HashtagHighligter() {
  const [text, setText] = createSignal('this is a #hashtag')
  return (
    <ContentEditable textContent={text} onTextContent={setText} singleline>
      {textContent => (
        <For each={textContent.split(' ')}>
          {(word, wordIndex) => (
            <>
              <Show when={word.startsWith('#')} fallback={word}>
                <button onClick={() => console.log('clicked!')}>{word}</button>
              </Show>
              <Show when={textContent.split(' ').length - 1 !== wordIndex()} children=" " />
            </>
          )}
        </For>
      )}
    </ContentEditable>
  )
}
```

### History Heuristic

The `historyHeuristic` is a function that determines whether two consecutive history entries (patches) should be merged during undo/redo operations. This feature allows for customizing the behavior of the history stack based on the nature of the changes.

#### Default Heuristic

The default `historyHeuristic` implementation in `<ContentEditable/>` behaves as follows:

- It only merges consecutive text insertions (`insertText`).
- It will concatenate patches when they both involve adding either whitespace or non-whitespace characters.

#### Custom Heuristic Example

This custom heuristic mirrors the behavior typically seen in default browser text inputs and textareas, where subsequent text insertions and new paragraphs are merged automatically.

```tsx
<ContentEditable
  textContent="Start typing here..."
  historyHeuristic={(currentPatch, nextPatch) => {
    return (
      (currentPatch.kind === 'insertText' || currentPatch.kind === 'insertParagraph') &&
      (nextPatch.kind === 'insertText' || nextPatch.kind === 'insertParagraph')
    )
  }}
/>
```

### Limitations with Render Prop

The `<ContentEditable/>` component supports a render-prop that accepts the textContent as its argument, enabling you to enhance the displayed content with additional markup. It's important to adhere to the following guidelines when using this feature:

- **Consistency Requirement**: The [textContent](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) of the JSX element returned by the render-prop must remain identical to the provided argument. This ensures that the element's functional behavior aligns with its displayed content.
- **Behavioral Caution**: Deviations in the textContent between the input and output can lead to undefined behavior, potentially affecting the stability and predictability of the component.
- **Markup Flexibility**: While you are free to add decorative or structural HTML around the text, these modifications should not alter the resulting textContent.

If the resulting `textContent` deviates from the given input, a warning will be logged in the console.
