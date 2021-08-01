import { Editor } from './skyline-editor.js';

const editor = new Editor('');
window.addEventListener('load', () => {
  editor.mount(document.getElementById('canvas'));
  requestAnimationFrame(() => editor.render());
});