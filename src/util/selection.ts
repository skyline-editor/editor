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

  moveStart(change: { line?: number, column?: number }): Selection {
    this.start.move(change, false);
    return this;
  }
  moveEnd(change: { line?: number, column?: number }): Selection {
    this.end.move(change, false);
    return this;
  }

  getText(): string {
    const lines = this.editor.lines;
    const affectedLines = lines.slice(this.start.line, this.end.line + 1);
    affectedLines[0] = affectedLines[0].substring(this.start.column);
    affectedLines[affectedLines.length - 1] = affectedLines[affectedLines.length - 1].substring(0, this.end.column);

    return affectedLines.join('\n');
  }

  setText(text: string): string {
    const lines = this.editor.lines;
    lines[this.start.line] = lines[this.start.line].substring(0, this.start.column) + text + lines[this.end.line].substring(this.end.column);
    lines.splice(this.start.line + 1, Math.max(0, this.end.line - this.start.line));

    return lines.join('\n');
  }
}