import { Editor } from "../editor";
import { Cursor } from "./cursor";

export class Selection {
  public start: Cursor;
  public end: Cursor;

  private editor: Editor;

  constructor(editor: Editor, start: Cursor, end?: Cursor) {
    this.start = end ? start : start.clone();
    this.end = end ?? start;

    this.start.selection = this;
    this.end.selection = this;

    this.editor = editor;
  }

  destroy(): void {
    this.start.selection = null;
    this.end.selection = null;

    this.start = null;
    this.end = null;
  }

  equals(other: Selection): boolean {
    return Selection.equals(this, other);
  }
  
  static equals(selection1: Selection, selection2: Selection): boolean {
    return selection1.start.equals(selection2.start) && selection1.end.equals(selection2.end);
  }

  static intersectSelections(editor: Editor, selections: Selection[]): Selection[] {
    selections = selections.slice();

    const sels: Selection[] = [];

    for (let i = 0; i < selections.length; i++) {
      let selection = selections[i];
      if (!selection) continue;

      if (selection.isEmpty()) {
        selection.destroy();
        continue;
      }

      for (let j = i + 1; j < selections.length; j++) {
        const other = selections[j];
        if (!other) continue;
        if (other.isEmpty()) {
          other.destroy();
          selections[j] = null;
          continue;
        }

        const intersected = Selection.intersect(editor, selection, other);
        if (intersected) {
          selection = intersected;
          selections[j] = null;
          continue;
        }
      }

      sels.push(selection);
    }

    return sels;
  }

  static intersect(editor: Editor, selection1: Selection, selection2: Selection): Selection {
    selection1 = selection1.validate(true);
    selection2 = selection2.validate(true);

    if (selection1.isEmpty() || selection2.isEmpty()) return null;
    if (Cursor.compare(selection1.end, selection2.start) < 0) return null;
    if (Cursor.compare(selection2.end, selection1.start) < 0) return null;

    const start = Cursor.compare(selection1.start, selection2.start) < 0 ? selection1.start : selection2.start;
    const end = Cursor.compare(selection1.end, selection2.end) < 0 ? selection1.end : selection2.start;

    let connected: 'start' | 'end' = null;
    if (start.connected && !end.connected) connected = 'start';
    if (!start.connected && end.connected) connected = 'end';

    if (start.connected && end.connected) {
      if (Cursor.compare(selection1.start, selection2.start) >= 0) connected = 'start';
      if (Cursor.compare(selection1.end, selection2.end) >= 0) connected = 'end';
    }
    if (!connected) connected = 'end';

    selection1.start.disconnect();
    selection2.start.disconnect();

    selection1.end.disconnect();
    selection2.end.disconnect();

    if (connected === 'start') start.connect();
    if (connected === 'end') end.connect();

    selection1.destroy();
    selection2.destroy();

    return new Selection(editor, start, end);
  }

  isEmpty(): boolean {
    return this.start.equals(this.end);
  }

  clone() {
    return new Selection(this.editor, this.start, this.end);
  }

  validate(clone = false): Selection {
    if (clone) return this.clone().validate(false);

    if (this.start.line === this.end.line) {
      if (this.start.column > this.end.column) {
        const start = this.start;
        const end = this.end;

        this.start = end;
        this.end = start;
      }
    }
    if (this.start.line > this.end.line) {
      const start = this.start;
      const end = this.end;

      this.start = end;
      this.end = start;
    }

    return this;
  }

  getText(): string {
    this.validate();

    const lines = this.editor.lines;
    const affectedLines = lines.slice(this.start.line, this.end.line + 1);
    affectedLines[affectedLines.length - 1] = affectedLines[affectedLines.length - 1].substring(0, this.end.column);
    affectedLines[0] = affectedLines[0].substring(this.start.column);

    return affectedLines.join('\n');
  }

  setText(text: string): string {
    this.validate();

    const lines = this.editor.lines;
    lines[this.start.line] = lines[this.start.line].substring(0, this.start.column) + text + lines[this.end.line].substring(this.end.column);
    lines.splice(this.start.line + 1, Math.max(0, this.end.line - this.start.line));

    return this.editor.code = lines.join('\n');
  }
}