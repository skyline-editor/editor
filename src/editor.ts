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
      
      this.editor.tokenize();
      this.editor.render();
      return;
    }

    addText(this.editor, event.key);

    this.editor.tokenize();
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

  private shouldRender: boolean = false;

  constructor(code?: string) {
    this.eventController = new EventController(this);

    // TODO: make this more customizable
    this.code = code ?? '';
    this.language = 'typescript';

    this.tokenize();
    setInterval(this.tick.bind(this), 500);
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

    window.addEventListener('blur', this.eventController.onBlur.bind(this.eventController));
    window.addEventListener('keydown', this.eventController.onKeyDown.bind(this.eventController));
    window.addEventListener('resize', this.resize.bind(this));

    this.canvas.addEventListener('mousedown', this.eventController.onMouseDown.bind(this.eventController));
    this.canvas.addEventListener('mousemove', this.eventController.onMouseMove.bind(this.eventController));
    this.canvas.addEventListener('mouseup', this.eventController.onMouseUp.bind(this.eventController));
    this.canvas.addEventListener('resize', this.resize.bind(this));

    this.resize();
  }

  public tokenize() {
    this.tokenized = highlight(this.code, this.language);
    return this.tokenized;
  }

  public render() {
    if (!this.canvas) return;

    this.shouldRender = true;
    requestAnimationFrame(this.renderAll.bind(this));
  }

  public resize() {
    if (!this.canvas) return;

    const dpr = window.devicePixelRatio ?? 1;

    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.render();
  }

  private renderAll() {
    const dpr = window.devicePixelRatio ?? 1;
    console.log(this);

    // if (!this.shouldRender) return;

    const canvas = this.canvas;
    const context = canvas.getContext('2d');

    context.save();
    context.font = '20px Consolas';
    context.textBaseline = 'top';
    context.scale(dpr, dpr);

    context.clearRect(0, 0, canvas.width, canvas.height);

    this.renderCode();
    this.renderCursors();

    this.shouldRender = false;
    context.restore();
  }

  private renderCode() {
    const context = this.canvas.getContext('2d');
    const lines = this.tokenized;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let pos = 0;

      for (let j = 0; j < line.length; j++) {
        const token = line[j];
        const x = pos * Char.width;
        const y = i * Char.height;

        context.fillStyle = token.color;
        context.fillText(token.text, x, y);

        pos += token.text.length;
      }
    }
  }

  private tick() {
    for (let i = 0; i < this.cursors.length; i++) {
      this.cursors[i].visible = !this.cursors[i].visible;
    }
    this.render();
  }

  private renderCursors() {
    const context = this.canvas.getContext('2d');
    const cursors = this.cursors;
    
    context.fillStyle = '#EE5078';
    for (let i = 0; i < cursors.length; i++) {
      const cursor = cursors[i].validate();
      if (!cursor.visible) continue;

      const x = cursor.column * Char.width;
      const y = cursor.line * Char.height;

      context.fillRect(x - 1, y, 2, Char.height);
    }
  }

  set lines(value) {
    this.code = value.join('\n');
  }

  get lines() {
    return this.code.split('\n');
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