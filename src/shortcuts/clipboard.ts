import { KeyboardShortcut } from ".";

const shortcuts: KeyboardShortcut[] = [];
shortcuts.push({
  name: 'Copy',
  description: 'copies the current selections to the clipboard',

  key: 'c',
  ctrl: true,
  exec: (editor) => {
    editor.copy();
  }
});
shortcuts.push({
  name: 'Cut',
  description: 'cuts the current selections to the clipboard',

  key: 'x',
  ctrl: true,
  exec: (editor) => {
    editor.cut();
  }
});
shortcuts.push({
  name: 'Paste',
  description: 'pastes the content on the clipboard to all selections',

  key: 'v',
  ctrl: true,
  exec: (editor) => {
    editor.paste();
  }
});

export default shortcuts;