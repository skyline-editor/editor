import { KeyboardShortcut, Editor } from "../editor";
import { Cursor } from "../util/cursor";
const shortcuts: KeyboardShortcut[] = [];

shortcuts.push({
  name: 'CopyCursorUp',
  description: "Copies an cursor up",

  key: 'ArrowUp',
  ctrl: true,
  alt: true,
  shift: false,

  exec: (editor) => {
    const first_cursor = editor.cursors.reduce((acc, v) => {
      if (v.line === acc.line) return v.column < acc.column ? v : acc;
      return v.line < acc.line ? v : acc;
    }, editor.cursors[0])

    if (first_cursor.line < 1) return;
    editor.cursors.push(new Cursor(editor, first_cursor.line - 1, first_cursor.column));
  }
});
shortcuts.push({
  name: 'CopyCursorDown',
  description: "Copies an cursor down",

  key: 'ArrowDown',
  ctrl: true,
  alt: true,
  shift: false,

  exec: (editor) => {
    const last_cursor = editor.cursors.reduce((acc, v) => {
      if (v.line === acc.line) return v.column > acc.column ? v : acc;
      return v.line > acc.line ? v : acc;
    }, editor.cursors[0])
    
    if (last_cursor.line >= editor.lines.length - 1) return;
    editor.cursors.push(new Cursor(editor, last_cursor.line + 1, last_cursor.column));
  }
});

export default shortcuts;