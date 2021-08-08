import { ColoredText, highlight } from "./tokenizer";

import { Cursor } from "./util/cursor";
import { Selection } from "./util/selection";
import { addText } from "./util/text";

import { defaultLanguage, Language } from "./language";
import { EventEmitter } from "events";
import { EventController } from "./events";

export const Char = {
  width: 11,
  height: 20,
};


interface Events {
  save: (editor: Editor) => void;
}

export class Editor {
  public cursors: Cursor[] = [];
  public selections: Selection[] = [];

  public renderLinenumbers: boolean = true;
  public lineSpacing: number = 5;

  public scrollX = 0;
  public scrollY = 0;

  private events = new EventEmitter();

  private _code = '';
  private _tokenized: ColoredText[][] = [];
  private _language: Language = defaultLanguage;
  
  private _canvas: HTMLCanvasElement | null = null;
  private eventController: EventController = new EventController(this);

  private shouldRender = false;
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
    const text = this.cursors.sort(Cursor.compare).filter(v => v.selection).map(v => v.selection.getText()).join('\n');
    navigator.clipboard.writeText(text).catch(v => console.error(v));
  }

  public cut(): void {
    if (!navigator.clipboard) return console.error('Clipboard API not present');
    const text = this.cursors.sort(Cursor.compare).filter(v => v.selection).map(v => v.selection.getText()).join('\n');
    navigator.clipboard.writeText(text).catch(v => console.error(v));
    this.cursors.sort(Cursor.compare).filter(v => v.selection).map(v => v.selection.setText(''));

    this.selections.map(v => v.destroy());
    this.selections = [];
  }

  public paste(): void {
    addText(this, 'Paste');
  }
  
  get canvas() {
    return this._canvas;
  }
  
  get tokenized() {
    return this._tokenized;
  }
  
  get code() {
    return this._code;
  }
  set code(value: string) {
    this.setCode(value);
  }

  get language() {
    return this._language;
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

  public unmount() {
    window.removeEventListener('resize', this.resize.bind(this));
    window.removeEventListener('blur', this.eventController.onBlur.bind(this.eventController));
    window.removeEventListener('keydown', this.eventController.onKeyDown.bind(this.eventController));
    window.removeEventListener('mousemove', this.eventController.onMouseMove.bind(this.eventController));
    window.removeEventListener('mouseup', this.eventController.onMouseUp.bind(this.eventController));

    this.canvas.removeEventListener('mousedown', this.eventController.onMouseDown.bind(this.eventController));
    this.canvas.removeEventListener('resize', this.resize.bind(this));

    this._canvas = null;
  }

  public destroy() {
    this.unmount();
    clearInterval(this.cursorClock);

    this.cursors.map(v => v.destroy());
    this.selections.map(v => v.destroy());
    this.selections = [];

    this.events.removeAllListeners();
    this.cursorClock = null;
  }

  public tokenize() {
    this._tokenized = highlight(this.code, this.language);
    return this.tokenized;
  }

  public render(): void {
    if (!this.canvas) return;

    this.selections = Selection.intersectSelections(this, this.selections);
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

    if (!this.shouldRender) return;

    const canvas = this.canvas;
    const context = canvas.getContext('2d');

    context.save();
    context.font = '20px Consolas';
    context.textBaseline = 'top';
    context.scale(dpr, dpr);
    context.translate(-this.scrollX, -this.scrollY);

    context.clearRect(0, 0, canvas.width, canvas.height);

    this.renderSelections();
    this.renderCode();
    this.renderCursors();

    this.shouldRender = false;
    context.restore();
  }

  private renderCode() {
    const xOffset = this.renderLinenumbers ? 55 : 0;

    const context = this.canvas.getContext('2d');
    const lines = this.tokenized;

    const startLine = Math.max(0, Math.floor(this.scrollY / Char.height));
    const endLine = Math.min(lines.length, Math.ceil((this.scrollY + this.canvas.height) / Char.height));

    for (let i = startLine; i < endLine; i++) {
      const y = i * (Char.height + this.lineSpacing);
      if (this.renderLinenumbers) {
        const line_number_width = context.measureText((i + 1).toString()).width;

        context.fillStyle = "#ffffff";
        context.fillText((i + 1).toString(), (55 - line_number_width) / 2, y);
      }

      const line = lines[i];
      let pos = 0;

      const startColumn = Math.max(0, Math.floor(this.scrollX / Char.width));
      const endColumn = Math.min(line.length, Math.ceil((this.scrollX + this.canvas.width) / Char.width));

      for (let j = 0; j < endColumn; j++) {
        const token = line[j];
        if (j >= startColumn) {
          const x = pos * Char.width;

          context.fillStyle = token.color;
          context.fillText(token.text, x + xOffset - this.scrollX, y - this.scrollY);
        }

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
    const xOffset = this.renderLinenumbers ? 55 : 0;

    const context = this.canvas.getContext('2d');
    const cursors = this.cursors;
    
    context.fillStyle = '#EE5078';
    for (let i = 0; i < cursors.length; i++) {
      const cursor = cursors[i].validate();
      if (!cursor.visible) continue;

      const x = cursor.column * Char.width;
      const y = cursor.line * (Char.height + 5);

      context.fillRect(x - 1 + xOffset, y, 2, Char.height);
    }
  }

  private renderSelections() {
    const xOffset = this.renderLinenumbers ? 55 : 0;

    const context = this.canvas.getContext('2d');
    const selections = this.selections;

    context.fillStyle = '#3c6487';
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      const length = selection.end.line - selection.start.line;

      for (let j = 0; j <= length; j++) {
        const line = selection.start.line + j;

        const x = j < 1 ? selection.start.column * Char.width : 0;
        const y = line * (Char.height + 5);

        const endX = line == selection.end.line ? selection.end.column * Char.width : (this.lines[line].length + 1) * Char.width;

        context.fillRect(x + xOffset, y, Math.min(endX, this.canvas.width) - x, Char.height);
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
