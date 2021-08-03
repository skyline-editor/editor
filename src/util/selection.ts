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

  clone() {
    return new Selection(this.editor, this.start, this.end);
  }

  validate(clone: boolean = false): Selection {
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