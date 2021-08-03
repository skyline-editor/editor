import { KeyboardShortcut } from "../editor";
import { Cursor } from "../util/cursor";
const shortcuts: KeyboardShortcut[] = [];

shortcuts.push({
  name: 'CopyLineUp',
  description: "Copies an line up",

  key: 'ArrowUp',
  ctrl: false,
  alt: true,
  shift: true,

  exec: (editor) => {
    editor.cursors = editor.cursors.sort(Cursor.compare);

    const lines = editor.lines;
    let last = null;
    for (let i = 0; i < editor.cursors.length; i++) {
      const cursor = editor.cursors[i];

      if (last && last.line === cursor.line) continue;
      last = cursor;

      const affected = editor.cursors.slice(i + 1);

      const line = lines[cursor.line];
      lines.splice(cursor.line, 0, line);

      affected.map(v => v.line += (v.line == cursor.line) ? 0 : 1);
    }
    
    editor.code = lines.join('\n');
  }
});
shortcuts.push({
  name: 'CopyLineDown',
  description: "Copies an line down",

  key: 'ArrowDown',
  ctrl: false,
  alt: true,
  shift: true,

  exec: (editor) => {
    editor.cursors = editor.cursors.sort(Cursor.compare);

    const lines = editor.lines;
    let last = null;
    for (let i = 0; i < editor.cursors.length; i++) {
      const cursor = editor.cursors[i];

      if (last && last.line === cursor.line) continue;
      last = cursor;

      const affected = editor.cursors.slice(i + 1);

      const line = lines[cursor.line];
      lines.splice(cursor.line, 0, line);

      cursor.line++;
      affected.map(v => v.line++);
    }
    
    editor.code = lines.join('\n');
  }
});

export default shortcuts;