import { KeyboardShortcut } from ".";
import { getTokenFromPos } from "../tokenizer";
import { Cursor } from "../util/cursor";
import { Selection } from "../util/selection";
import { addText } from "../util/text";

const shortcuts: KeyboardShortcut[] = [];
shortcuts.push({
  name: 'Escape',
  description: 'Clear all cursors except the first one',

  key: 'Escape',
  exec: (editor) => {
    editor.cursors = editor.cursors.slice(0, 1);
    editor.selections.map(v => v.destroy());
    editor.selections = [];
  }
});
shortcuts.push({
  name: 'Tab',
  description: 'adds an tab',

  key: 'Tab',
  exec: (editor) => {
    return addText(editor, 'Tab');
  }
});
shortcuts.push({
  name: 'Select Line',
  description: 'Selects entire line',

  key: 'l',
  ctrl: true,
  exec: (editor) => {
    for (let i = 0; i < editor.cursors.length; i++) {
      const cursor = editor.cursors[i];
      const line = cursor.line;

      if (cursor.selection) {
        const selection = cursor.selection;
        selection.destroy();
        editor.selections.splice(editor.selections.indexOf(selection), 1);
      }

      cursor.line++;
      cursor.column = 0;
      if (editor.lines.length <= cursor.line) {
        cursor.line = line;
        cursor.column = editor.lines[line].length;
      }

      const selection = new Selection(editor, new Cursor(editor, line, 0), cursor);
      editor.selections.push(selection);
    }
  }
});
shortcuts.push({
  name: 'Select All',
  description: 'Selects all text',

  key: 'a',
  ctrl: true,
  exec: (editor) => {
    const lines = editor.lines;
    const cursor = new Cursor(editor, lines.length - 1, lines[lines.length - 1].length);
    const selection = new Selection(editor, new Cursor(editor, 0, 0), cursor);

    editor.cursors = [cursor];
    editor.selections = [selection];
  }
});
shortcuts.push({
  name: 'Save',
  description: 'runs the event save to all listeners',

  key: 's',
  ctrl: true,
  exec: (editor) => {
    editor.save();
  }
});
shortcuts.push({
  name: 'Next Match',
  description: 'selects the current token',

  key: 'd',
  ctrl: true,
  exec: (editor) => {
    for (let i = 0; i < editor.cursors.length; i++) {
      const cursor = editor.cursors[i];
      if (cursor.selection) continue;

      const match = getTokenFromPos(editor, cursor);
      if (!match) continue;

      cursor.line = match.line;
      cursor.column = match.column + match.token.length;

      const selection = new Selection(editor, new Cursor(editor, match.line, match.column), cursor);
      editor.selections.push(selection);
    }
    editor.render();
  }
});

export default shortcuts;