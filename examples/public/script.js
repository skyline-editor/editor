import { Editor } from './skyline-editor.js';

const editor = new Editor('import { greet } from \'hello\'');
window.addEventListener('load', () => {
  editor.mount(document.getElementById('canvas'));
  requestAnimationFrame(() => editor.render());
});