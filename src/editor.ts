import { ColoredText, highlight } from "./tokenizer";

import { Cursor } from "./util/cursor";
import { Selection } from "./util/selection";
import { addText } from "./util/text";

import moveShortcuts from './shortcuts/move';
import copyLineShortcuts from './shortcuts/copyLine';
import copyCursorShortcuts from './shortcuts/copyCursor';
import { defaultLanguage, Language } from "./language";
import { EventEmitter } from "events";
import { isEmptyBindingPattern } from "typescript";

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

      let ctrlKey = event.ctrlKey;
      if (navigator.appVersion.includes('Mac') && event.metaKey) ctrlKey = true;

      if (typeof key !== 'undefined' && event.key !== key) continue;
      if (typeof ctrl !== 'undefined' && ctrl !== ctrlKey) continue;
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

    const x = event.clientX - editor.getBoundingClientRect().left;
    const y = event.clientY - editor.getBoundingClientRect().top;

    const cursor = new Cursor(this.editor, Math.floor(y / Char.height), Math.floor(x / Char.width));
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

interface Events {
  save: (editor: Editor) => void;
}

export class Editor {
  public cursors: Cursor[] = [];
  public selections: Selection[] = [];

  private events = new EventEmitter();

  private _code: string = '';
  private _tokenized: ColoredText[][] = [];
  private _language: Language = defaultLanguage;
  
  private _canvas: HTMLCanvasElement | null = null;
  private eventController: EventController = new EventController(this);

  private shouldRender: boolean = false;
  private cursorClock: NodeJS.Timer;

  constructor(code?: string) {
    if (code) this.code = code;
    this.cursorClock = setInterval(this.tick.bind(this), 500);
  }

  public on<T extends keyof Events>(event: T, handler: Events[T]): void {
    this.events.on(event, handler);
  }

  public once<T extends keyof Events>(event: T, handler: Events[T]): void {
    this.events.once(event, handler);
  }

  public save(): void {
    this.events.emit('save', this);
  }

  public copy(): void {
    if (!navigator.clipboard) return console.error('Clipboard API not present');
    navigator.clipboard.writeText(this.cursors.sort(Cursor.compare).filter(v => v.selection).map(v => v.selection.getText()).join('\n'));
  }

  public cut(): void {
    if (!navigator.clipboard) return console.error('Clipboard API not present');
    navigator.clipboard.writeText(this.cursors.sort(Cursor.compare).filter(v => v.selection).map(v => v.selection.getText()).join('\n'));
    this.cursors.sort(Cursor.compare).filter(v => v.selection).map(v => v.selection.setText(''));

    this.selections.map(v => v.destroy());
    this.selections = [];
  }

  public paste(): void {
    addText(this, 'Paste');
  }

  get code() {
    return this._code;
  }

  get canvas() {
    return this._canvas;
  }

  get tokenized() {
    return this._tokenized;
  }

  get language() {
    return this._language;
  }

  set code(value: string) {
    this.setCode(value);
  }

  set language(value: Language) {
    this.setLanguage(value);
  }

  public setCode(code: string): void {
    this._code = code;
    this.tokenize();
    this.render();
  }
  public setLanguage(language: Language): void {
    this._language = language;
    this.tokenize();
    this.render();
  }

  public mount(canvas: HTMLCanvasElement): void {
    this._canvas = canvas;

    window.addEventListener('resize', this.resize.bind(this));
    window.addEventListener('blur', this.eventController.onBlur.bind(this.eventController));
    window.addEventListener('keydown', this.eventController.onKeyDown.bind(this.eventController));
    window.addEventListener('mousemove', this.eventController.onMouseMove.bind(this.eventController));
    window.addEventListener('mouseup', this.eventController.onMouseUp.bind(this.eventController));

    this.canvas.addEventListener('mousedown', this.eventController.onMouseDown.bind(this.eventController));
    this.canvas.addEventListener('resize', this.resize.bind(this));

    this.resize();
  }

  public tokenize() {
    this._tokenized = highlight(this.code, this.language);
    return this.tokenized;
  }

  public render(): void {
    if (!this.canvas) return;

    this.shouldRender = true;
    requestAnimationFrame(this.renderAll.bind(this));
  }

  public resize(): void {
    if (!this.canvas) return;

    const dpr = window.devicePixelRatio ?? 1;
    const clientRect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = clientRect.width * dpr;
    this.canvas.height = clientRect.height * dpr;
    this.render();
  }

  public resetCursorClock(): void {
    if (this.cursorClock) clearInterval(this.cursorClock);
    this.cursorClock = setInterval(this.tick.bind(this), 500);
  }

  private renderAll() {
    const dpr = window.devicePixelRatio ?? 1;

    // if (!this.shouldRender) return;

    const canvas = this.canvas;
    const context = canvas.getContext('2d');

    context.save();
    context.font = '20px Consolas';
    context.textBaseline = 'top';
    context.scale(dpr, dpr);

    context.clearRect(0, 0, canvas.width, canvas.height);

    this.renderSelections();
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

  private renderSelections() {
    const context = this.canvas.getContext('2d');
    const selections = this.selections;

    context.fillStyle = '#3c6487';
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      const length = selection.end.line - selection.start.line;

      for (let i = 0; i <= length; i++) {
        const line = selection.start.line + i;

        const x = i < 1 ? selection.start.column * Char.width : 0;
        const y = line * Char.height;

        const endX = line == selection.end.line ? selection.end.column * Char.width : (this.lines[line].length + 1) * Char.width;

        context.fillRect(x, y, endX - x, Char.height);
      }
    }
  }

  set lines(value: string[]) {
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
    editor.cursors = editor.cursors.slice(0, 1);
    editor.selections.map(v => v.destroy());
    editor.selections = [];
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
keyboardShortcuts.push({
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
keyboardShortcuts.push({
  name: 'Save',
  description: 'runs the event save to all listeners',

  key: 's',
  ctrl: true,
  exec: (editor) => {
    editor.save();
  }
});
keyboardShortcuts.push({
  name: 'Copy',
  description: 'copies the current selections to the clipboard',

  key: 'c',
  ctrl: true,
  exec: (editor) => {
    editor.copy();
  }
});
keyboardShortcuts.push({
  name: 'Cut',
  description: 'cuts the current selections to the clipboard',

  key: 'x',
  ctrl: true,
  exec: (editor) => {
    editor.cut();
  }
});
keyboardShortcuts.push({
  name: 'Paste',
  description: 'pastes the content on the clipboard to all selections',

  key: 'v',
  ctrl: true,
  exec: (editor) => {
    editor.paste();
  }
});