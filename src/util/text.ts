import { Editor } from "../editor";
import { Cursor } from "./cursor";

let extra = '';
const tab_size = 2;

type delete_mode = ['delete', number];
type insert_mode = ['insert', string];
type write_mode = delete_mode | insert_mode;

const write_modes = {
  'Backspace': ['delete', -1],
  'Delete': ['delete', 1],
  'Tab': ['insert', ' '.repeat(tab_size)],
  'Enter': ['insert', '\n'],
} as {[key: string]: write_mode};

function addTextCursor(editor: Editor, key: string, cursor: Cursor, affected: Cursor[]) : string {
  if (key.length > 1 && !(key in write_modes)) return editor.code;
  let [mode, ...args] = ['insert', key] as write_mode;
  if (key in write_modes) [mode, ...args] = write_modes[key];

  cursor.validate(false, { column: true });
  cursor.visible = true;

  const lines = editor.lines;
  const line = lines[cursor.line];
  const column = cursor.column;
  if (mode === 'delete') {
    const direction = args[0] as number;

    const back = Math.max(0, -direction);
    const front = Math.max(0, direction);

    const lineText = line.substring(0, column - back);
    const lineEnd = line.substring(column + front);

    if (cursor.column < back || cursor.column > line.length - front) {
      if (back) {
        if (cursor.line > 0) {
          const lineText = lines[cursor.line - 1];
          const lineEnd = line;
  
          const newLine = lineText + lineEnd;
          lines.splice(cursor.line - 1, 2, newLine);
  
          cursor.line--;
          cursor.column = lineText.length;
          affected.map(v => {
            if (v.line === cursor.line) v.column += lineText.length;
            v.line -= 1;
          });
        }
      }
      if (front) {
        if (cursor.line < lines.length - 1) {
          const lineText = line;
          const lineEnd = lines[cursor.line + 1];
  
          const newLine = lineText + lineEnd;
          lines.splice(cursor.line, 2, newLine);

          cursor.column = lineText.length;
          affected.map(v => {
            if (v.line === cursor.line + 1) v.column += lineText.length;
            v.line -= 1;
          });
        }
      }
    } else {
      const newLine = lineText + lineEnd;
      lines.splice(cursor.line, 1, newLine);

      cursor.column -= back;
      affected.map(v => v.column += v.line === cursor.line ? -1 : 0);
    }
  }

  if (mode === 'insert') {
    const text = args[0] as string;
    extra = '';
        
    if (key === 'Tab') {
      const skip = [
        '(',
        ')',
        '{',
        '}',
        '[',
        ']',
        '\'',
        '"'
      ];
      
      const nextChar = line[cursor.column];
      if (nextChar && skip.includes(nextChar)) {
        cursor.column += 1;
        return lines.join('\n');
      }
    }
    
    if (key === ' ') {
      const nextChar = line[cursor.column];
      const prevChar = line[cursor.column - 1];
      const t = prevChar + nextChar;
      const spacing = [
        '{}',
        '[]',
        '()',
      ];
      
      if (nextChar && prevChar && spacing.includes(t)) extra = ' ';
    }  

    
    if (text === '(') extra = ')';
    if (text === '{') extra = '}';
    if (text === '[') extra = ']';
    if (text === '<') extra = '>';
    if (text === '"') extra = '"';
    if (text === '\'') extra = '\'';
    if (text === '`') extra = '`';

    const lineText = line.substring(0, column);
    const lineEnd = line.substring(column);

    const newLine = lineText + text + extra + lineEnd;
    lines.splice(cursor.line, 1, newLine);

    if (text === '\n') {
      cursor.line++;
      cursor.column = 0;
    } else {
      cursor.column += text.length;
    }

    affected.map(v => {
      if (text === '\n') return v.line++;
      v.column += v.line === cursor.line ? text.length : 0
    });
  }
  
  editor.code = lines.join('\n');
}

export function addText(editor: Editor, key: string) : void {
  if (key === extra) {
    extra = '';
    editor.cursors.map(v => v.column += key.length);
    return;
  }
  editor.cursors = editor.cursors.sort(Cursor.compare);

  for (let i = 0; i < editor.cursors.length; i++) {
    const cursor = editor.cursors[i];
    addTextCursor(editor, key, cursor, editor.cursors.slice(i + 1));
  }

  editor.cursors = editor.cursors.filter((cursor, i) => {
    cursor = cursor.validate();
    return !editor.cursors.find((v, j) => {
      v = v.validate();
      if (i >= j) return false;
      return v.line === cursor.line && v.column === cursor.column
    });
  });
}