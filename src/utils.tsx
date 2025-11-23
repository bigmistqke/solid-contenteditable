import { Accessor, For, Show } from 'solid-js'
import { JSX } from 'solid-js/jsx-runtime'

export function Split(props: {
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
