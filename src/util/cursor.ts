import { Editor } from '../editor';
import { Selection } from './selection';

export class Cursor {
  public line: number;
  public column: number;
  public selection?: Selection;
  public visible = true;

  private editor: Editor;

  constructor(editor: Editor, line?: number, column?: number) {
    this.line = line ?? 0;
    this.column = column ?? 0;

    this.editor = editor;
  }

  distance(other: Cursor): number {
    return Cursor.distance(this, other);
  }
  
  static distance(a: Cursor, b: Cursor): number {
    const editor = a.editor;

    let distance = 0;
    if (a.line === b.line) distance = Math.abs(a.column - b.column);
    if (a.line < b.line) {
      distance += editor.lines[a.line].length - a.column;
      distance += b.column;
      for (let i = a.line + 1; i < b.line; i++) distance += editor.lines[i].length;
    }
    if (a.line > b.line) {
      distance += editor.lines[b.line].length - b.column;
      distance += a.column;
      for (let i = b.line + 1; i < a.line; i++) {
        distance += editor.lines[i].length;
      }
    }

    return distance;
  }

  clone(): Cursor {
    return new Cursor(this.editor, this.line, this.column);
  }

  validate(clone?: boolean, change?: { line?: boolean, column?: boolean}): Cursor {
    const lines = this.editor.lines;

    clone = clone ?? true;
    change = change ?? {
      line: true,
      column: true
    };

    let line = this.line;
    let column = this.column;

    if (change.line) {
      if (line < 0) line = 0;
      if (line >= lines.length) line = lines.length - 1;
    }
    
    if (change.column) {
      if (column < 0) column = 0;
      if (line < lines.length) {
        if (column > lines[line].length) column = lines[line].length;
      }
    }

    if (clone) {
      const cursor = new Cursor(this.editor, line, column);
      cursor.visible = this.visible;
      return cursor;
    } else {
      this.line = line;
      this.column = column;
      return this;
    }
  }

  // intended to be used in array.sort()
  compare(other: Cursor): number {
    return Cursor.compare(this, other);
  }

  static compare(this: void, a: Cursor, b: Cursor): number {
    if (a.line < b.line) return -1;
    if (a.line > b.line) return 1;
    if (a.column < b.column) return -1;
    if (a.column > b.column) return 1;
    return 0;
  }

  disconnect() {
    if (!this.connected) return;
    this.editor.cursors.splice(this.editor.cursors.indexOf(this), 1);
  }

  connect() {
    if (this.connected) return;
    this.editor.cursors.push(this);
  }

  get pos() {
    let pos = 0;
    const lines = this.editor.lines;
    for (let i = 0; i < this.line; i++) pos += lines[i].length;
    pos += this.column;

    return pos;
  }

  get connected() {
    return this.editor.cursors.indexOf(this) >= 0;
  }

  destroy() {
    this.disconnect();

    this.editor = null;
    this.line = null;
    this.column = null;
    this.selection = null;
    this.visible = false
  }

  equals(other: Cursor): boolean {
    return Cursor.equals(this, other);
  }

  static equals(a: Cursor, b: Cursor): boolean {
    return a.line === b.line && a.column === b.column;
  }

  move(change: { line?: number, column?: number }, clone?: boolean) : Cursor {
    clone = clone ?? true;
    if (clone) return this.clone().move(change, false);

    const lines = this.editor.lines;
    const validated = this.validate();
  
    if (change.line) {
      this.line = validated.line + change.line;
      if (this.line < 0) this.line = 0;
      if (this.line >= lines.length) this.line = lines.length - 1;
    }
  
    if (change.column) {
      this.column = validated.column + change.column;
      if (this.column < 0) {
        this.line--;
  
        if (this.line < 0) {
          this.line = 0;
          this.column = 0;
        } else {
          this.column = lines[this.line].length;
        }
      }
      if (this.column > lines[this.line].length) {
        this.line++;
  
        if (this.line >= lines.length) {
          this.line = lines.length - 1;
          this.column = lines[this.line].length;
        } else {
          this.column = 0;
        }
      }
    }

    if (this.selection) this.selection.validate();

    this.visible = true;
    return this;
  }
}