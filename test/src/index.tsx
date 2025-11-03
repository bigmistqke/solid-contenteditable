import { render } from 'solid-js/web'
import { ContentEditable } from '../../src'
import './index.css'

render(
  () => (
    <>
      <div>
        <h2>Solid-ContentEditable</h2>
        <ContentEditable textContent="" class="contentEditable" />
        
        <h3>Multiline Editor</h3>
        <ContentEditable textContent="" class="contentEditable" />
        
        <h3>Singleline Editor</h3>
        <ContentEditable textContent="" class="contentEditable" singleline />
      </div>
    </>
  ),
  document.getElementById('root')!,
)
