import { Char, Editor } from "./editor";
import keyboardShortcuts from "./shortcuts";

import { addText } from "./util/text";
import { Cursor } from "./util/cursor";
import { Selection } from "./util/selection";

export class EventController {
  private editor: Editor;

  public onBlur(): void {
    this.editor.cursors = [];
    this.editor.render();
  }
  public onKeyDown(event: KeyboardEvent): void {
    if (this.editor.cursors.length < 1) return;

    for (const keyboardShortcut of keyboardShortcuts) {
      const { exec } = keyboardShortcut;
      const { ctrl, alt, shift, key } = keyboardShortcut;

      let ctrlKey = event.ctrlKey;
      if (navigator.appVersion.includes('Mac') && event.metaKey) ctrlKey = true;

      if (typeof key !== 'undefined' && event.key !== key) continue;
      if (typeof ctrl !== 'undefined' && ctrl !== ctrlKey) continue;
      if (typeof alt !== 'undefined' && alt !== event.altKey) continue;
      if (typeof shift !== 'undefined' && shift !== event.shiftKey) continue;

      exec(this.editor, event);
      
      event.preventDefault();
      this.editor.tokenize();
      this.editor.render();
      return;
    }

    if (event.ctrlKey || event.metaKey) return; 

    event.preventDefault();

    addText(this.editor, event.key);

    this.editor.tokenize();
    this.editor.render();
  }
  public onMouseDown(event: MouseEvent): void {
    event.preventDefault();

    const cursor = this.getCursorFromEvent(event);

    if (event.shiftKey) {
      const lastCursor = this.editor.cursors.reduce((acc, v) => {
        if (acc.line === cursor.line && acc.column == cursor.column) return acc;
        if (v.line === cursor.line && v.column == cursor.column) return v;
        
        const lastDistance = Cursor.distance(cursor, acc);
        const newDistance = Cursor.distance(cursor, v);

        if (newDistance < lastDistance) return v;
        return acc;
      }, this.editor.cursors[0]);
      if (lastCursor.line === cursor.line && lastCursor.column === cursor.column) return;

      this.activeSelection = lastCursor;
      this.editor.cursors = [cursor];
      this.editor.selections.map(v => v.destroy());
      this.editor.selections = [new Selection(this.editor, cursor, lastCursor).validate()];
    } else {
      if (event.altKey) {
        for (let i = 0; i < this.editor.cursors.length; i++) {
          const c = this.editor.cursors[i];
          if (cursor.line === c.line && cursor.column === c.column) {
            this.editor.cursors.splice(i, 1);
            break;
          }
        }
        this.editor.cursors.push(cursor);
      } else {
        this.editor.selections.map(v => v.destroy());
        this.editor.selections = [];
        this.editor.cursors = [cursor];
      };
      this.startSelection(cursor);
    }

    this.editor.render();
  }
  public onMouseMove(event: MouseEvent): void {
    event.preventDefault();
    if (!this.activeSelection) return;

    if (event.button != 0 || event.buttons < 1) {
      this.activeSelection = null;
      return;
    }

    const cursor = this.getCursorFromEvent(event);

    this.editLastSelection(cursor);
    this.replaceLastCursor(cursor);
    this.editor.render();
  }
  public onMouseUp(event: MouseEvent): void {
    event.preventDefault();
    if (!this.activeSelection) return;

    const cursor = this.getCursorFromEvent(event);

    this.replaceLastCursor(cursor);
    this.endSelection(cursor);
    this.editor.render();
  }


  public activeSelection: Cursor | null = null;
  constructor(editor: Editor) {
    this.editor = editor;
  }

  private startSelection(cursor: Cursor) {
    this.activeSelection = cursor;
    this.editor.selections.push(new Selection(this.editor, cursor));
  }

  private endSelection(cursor: Cursor) {
    const same = cursor.line === this.activeSelection.line && cursor.column === this.activeSelection.column;
    if (same) return this.activeSelection = null;;

    this.editLastSelection(cursor);
    this.activeSelection = null;
  }

  private editLastSelection(cursor: Cursor) {
    const selection = new Selection(this.editor, this.activeSelection, cursor).validate();
    
    this.editor.selections.pop().destroy();
    this.editor.selections.push(selection);
  }
  private replaceLastCursor(cursor: Cursor) {
    this.editor.cursors.pop();
    this.editor.cursors.push(cursor);
  }

  private getCursorFromEvent(event: MouseEvent): Cursor {
    const lines = this.editor.lines;
    const editor = this.editor.canvas;
    if (!editor) return;

    const x = event.clientX - editor.getBoundingClientRect().left + window.scrollX;
    const y = event.clientY - editor.getBoundingClientRect().top + window.scrollY - (this.editor.lineSpacing / 2);

    const xOffset = this.editor.renderLinenumbers ? 55 : 0;

    const cursor = new Cursor(this.editor, Math.floor(y / (Char.height + this.editor.lineSpacing)), Math.floor((x - xOffset) / Char.width));
    if (cursor.line < 0) {
      cursor.line = 0;
      cursor.column = 0;
    }

    if (cursor.line >= lines.length) {
      cursor.line = lines.length - 1;
      cursor.column = lines[cursor.line].length;
    }

    if (cursor.column < 0) cursor.column = 0;
    if (cursor.column > lines[cursor.line].length) cursor.column = lines[cursor.line].length;

    return cursor;
  }
}
