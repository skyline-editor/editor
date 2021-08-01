import { Editor, KeyboardShortcut } from "../editor";
const shortcuts: KeyboardShortcut[] = [];

function moveCursors(editor: Editor, change?: { line?: number, column?: number }) : void {
  editor.cursors = editor.cursors.map(cursor => cursor.move(change, false));
  editor.cursors = editor.cursors.filter((cursor, i) => {
    cursor = cursor.validate();
    return !editor.cursors.find((v, j) => {
      v = v.validate();
      if (i >= j) return false;
      return v.line === cursor.line && v.column === cursor.column
    });
  });
}

shortcuts.push({
  name: 'Up',
  description: "Move cursors up",

  key: 'ArrowUp',
  ctrl: false,
  alt: false,

  exec: (editor, event) => {
    if (!event.shiftKey) editor.selections = [];
    moveCursors(editor, { line: -1 });
  }
});
shortcuts.push({
  name: 'Down',
  description: "Move cursors down",

  key: 'ArrowDown',
  ctrl: false,
  alt: false,

  exec: (editor, event) => {
    if (!event.shiftKey) editor.selections = [];
    moveCursors(editor, { line: 1 });
  }
});
shortcuts.push({
  name: 'Left',
  description: "Move cursors left",

  key: 'ArrowLeft',
  ctrl: false,
  alt: false,

  exec: (editor, event) => {
    if (!event.shiftKey) editor.selections = [];
    moveCursors(editor, { column: -1 });
  }
});
shortcuts.push({
  name: 'Right',
  description: "Move cursors right",

  key: 'ArrowRight',
  ctrl: false,
  alt: false,

  exec: (editor, event) => {
    if (!event.shiftKey) editor.selections = [];
    moveCursors(editor, { column: 1 });
  }
});

export default shortcuts;