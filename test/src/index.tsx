import { render } from 'solid-js/web'
import { ContentEditable } from '../../src'
import './index.css'

render(
  () => (
    <>
      <div>
        <h2>Solid-ContentEditable</h2>
        <ContentEditable textContent="Lorem Ipsum" class="contentEditable" />
      </div>
    </>
  ),
  document.getElementById('root')!,
)
