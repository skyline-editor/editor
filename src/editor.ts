import { ColoredText, highlight } from "./tokenizer";

import { Cursor } from "./util/cursor";
import { Selection } from "./util/selection";
import { addText } from "./util/text";

import moveShortcuts from './shortcuts/move';
import copyLineShortcuts from './shortcuts/copyLine';
import copyCursorShortcuts from './shortcuts/copyCursor';

export const Char = {
  width: 11,
  height: 20,
};

export interface KeyboardShortcut {
  key?: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;

  name: string;
  description?: string;
  exec: (editor: Editor, event: KeyboardEvent) => unknown;
}

const keyboardShortcuts: KeyboardShortcut[] = [];

export class EventController {
  private editor: Editor;

  public onBlur(_event: FocusEvent): void {
    this.editor.cursors = [];
    this.editor.render();
  }
  public onKeyDown(event: KeyboardEvent): void {
    if (this.editor.cursors.length < 1) return;
    event.preventDefault();

    for (const keyboardShortcut of keyboardShortcuts) {
      const { exec } = keyboardShortcut;
      const { ctrl, alt, shift, key } = keyboardShortcut;

      if (typeof key !== 'undefined' && event.key !== key) continue;
      if (typeof ctrl !== 'undefined' && ctrl !== event.ctrlKey) continue;
      if (typeof alt !== 'undefined' && alt !== event.altKey) continue;
      if (typeof shift !== 'undefined' && shift !== event.shiftKey) continue;

      exec(this.editor, event);
      this.editor.render();
      return;
    }

    addText(this.editor, event.key);
    this.editor.render();
  }
  public onMouseDown(event: MouseEvent): void {
    event.preventDefault();  
    const lines = this.editor.lines;

    if (!event.target) return;
    const editor = event.target as HTMLCanvasElement;

    const x = event.clientX - editor.getBoundingClientRect().left;
    const y = event.clientY - editor.getBoundingClientRect().top;

    const cursor = new Cursor(this.editor, Math.floor(y / Char.height), Math.floor(x / Char.width)).validate(false);
    if (cursor.line < 0) {
      cursor.line = 0;
      cursor.column = 0;
    }

    if (cursor.line >= lines.length) {
      cursor.line = lines.length;
      cursor.column = lines[cursor.line].length;
    }

    if (cursor.column < 0) cursor.column = 0;
    if (cursor.column > lines[cursor.line].length) cursor.column = lines[cursor.line].length;

    if (event.altKey) {
      this.editor.cursors.push(cursor);
    } else {
      this.editor.cursors = [cursor];
    }

    this.editor.cursors = this.editor.cursors.filter((cursor, i) => {
      cursor = cursor.validate();
      return !this.editor.cursors.find((v, j) => {
        v = v.validate();
        if (i === j) return false;
        return v.line === cursor.line && v.column === cursor.column
      });
    });

    this.editor.startSelection(cursor);
    this.editor.selections = [ new Selection(this.editor, cursor) ];
    this.editor.render();
  }
  public onMouseMove(event: MouseEvent): void {
    event.preventDefault();

    const lastCursor = this.editor.getSelection();
    if (!lastCursor) return;

    const lines = this.editor.lines;

    if (!event.target) return;
    const editor = event.target as HTMLCanvasElement;

    const x = event.clientX - editor.getBoundingClientRect().left;
    const y = event.clientY - editor.getBoundingClientRect().top;

    const cursor = new Cursor(this.editor, Math.floor(y / Char.height), Math.floor(x / Char.width)).validate(false);
    if (cursor.line < 0) {
      cursor.line = 0;
      cursor.column = 0;
    }

    if (cursor.line >= lines.length) {
      cursor.line = lines.length;
      cursor.column = lines[cursor.line].length;
    }

    if (cursor.column < 0) cursor.column = 0;
    if (cursor.column > lines[cursor.line].length) cursor.column = lines[cursor.line].length;

    const new_cursors = [lastCursor, cursor].sort(Cursor.compare) as [Cursor, Cursor];
    const selection = new Selection(this.editor, ...new_cursors);

    this.editor.cursors.splice(this.editor.cursors.length - 1, 1, cursor);
    this.editor.selections = [ selection ];
    this.editor.render();
  }
  public onMouseUp(event: MouseEvent): void {
    event.preventDefault();

    const lastCursor = this.editor.getSelection();
    if (!lastCursor) return;

    const lines = this.editor.lines;

    if (!event.target) return;
    const editor = event.target as HTMLCanvasElement;

    const x = event.clientX - editor.getBoundingClientRect().left;
    const y = event.clientY - editor.getBoundingClientRect().top;

    const cursor = new Cursor(this.editor, Math.floor(y / Char.height), Math.floor(x / Char.width)).validate(false);
    if (cursor.line < 0) {
      cursor.line = 0;
      cursor.column = 0;
    }

    if (cursor.line >= lines.length) {
      cursor.line = lines.length;
      cursor.column = lines[cursor.line].length;
    }

    if (cursor.column < 0) cursor.column = 0;
    if (cursor.column > lines[cursor.line].length) cursor.column = lines[cursor.line].length;

    const new_cursors = [lastCursor, cursor].sort(Cursor.compare) as [Cursor, Cursor];
    const selection = new Selection(this.editor, ...new_cursors);

    const same = cursor.line === lastCursor.line && cursor.column === lastCursor.column;

    this.editor.cursors.splice(this.editor.cursors.length - 1, 1, cursor);
    this.editor.selections = [ selection ];
    this.editor.endSelection(cursor, same);
    this.editor.render();
  }


  constructor(editor: Editor) {
    this.editor = editor;
  }
}

export class Editor {
  public code: string;
  public language: string;

  public cursors: Cursor[] = [];
  public selections: Selection[] = [];

  private tokenized: ColoredText[][] = [];
  private activeSelection: Cursor | null = null;

  private canvas: HTMLCanvasElement | null = null;
  private eventController: EventController;

  constructor() {
    this.eventController = new EventController(this);

    // TODO: make this more customizable
    this.code = '';
    this.language = 'typescript';
  }

  public startSelection(cursor: Cursor) {
    this.activeSelection = cursor;
  }

  public getSelection() {
    return this.activeSelection;
  }

  public endSelection(cursor: Cursor, same: boolean) {
    this.selections = same ? [] : [ new Selection(this, this.activeSelection, cursor) ];
    this.activeSelection = null;
  }

  public mount(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.canvas.addEventListener('blur', this.eventController.onKeyDown);
    this.canvas.addEventListener('keydown', this.eventController.onKeyDown);
    this.canvas.addEventListener('mousedown', this.eventController.onKeyDown);
    this.canvas.addEventListener('mousemove', this.eventController.onKeyDown);
    this.canvas.addEventListener('mouseup', this.eventController.onKeyDown);
  }

  public tokenize() {
    this.tokenized = highlight(this.code, this.language);
    return this.tokenized;
  }

  public render() {
  
  }

  get lines() {
    return this.code.split(/\n/);
  }
}

keyboardShortcuts.push(...moveShortcuts);
keyboardShortcuts.push(...copyLineShortcuts);
keyboardShortcuts.push(...copyCursorShortcuts);

keyboardShortcuts.push({
  name: 'Escape',
  description: 'Clear all cursors except the first one',

  key: 'Escape',
  exec: (editor) => {
    return {
      code: editor.code,
      cursors: editor.cursors.slice(0, 1)
    };
  }
});

keyboardShortcuts.push({
  name: 'Tab',
  description: 'adds an tab',

  key: 'Tab',
  exec: (editor) => {
    return addText(editor, 'Tab');
  }
});

keyboardShortcuts.push({
  name: 'Select Line',
  description: 'Selects entire line',

  key: 'l',
  ctrl: true,
  exec: (editor) => {
    
  }
});