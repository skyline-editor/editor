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
  exec: (code: string, cursors: Cursor[], event: KeyboardEvent) => { code: string, cursors: Cursor[] } | undefined | null;
}

const keyboardShortcuts: KeyboardShortcut[] = [];

export class EventController {
  private editor: Editor;

  public onBlur(event: FocusEvent): void {}
  public onKeyDown(event: KeyboardEvent): void {}
  public onMouseDown(event: MouseEvent): void {}
  public onMouseMove(event: MouseEvent): void {}
  public onMouseUp(event: MouseEvent): void {}


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
  private activeSelection: Selection | null = null;

  private canvas: HTMLCanvasElement | null = null;
  private eventController: EventController;

  constructor() {
    this.eventController = new EventController(this);

    // TODO: make this more customizable
    this.code = '';
    this.language = 'typescript';
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
}

keyboardShortcuts.push(...moveShortcuts);
keyboardShortcuts.push(...copyLineShortcuts);
keyboardShortcuts.push(...copyCursorShortcuts);

keyboardShortcuts.push({
  name: 'Escape',
  description: 'Clear all cursors except the first one',

  key: 'Escape',
  exec: (code, cursors) => {
    return {
      code,
      cursors: cursors.slice(0, 1)
    };
  }
});

keyboardShortcuts.push({
  name: 'Tab',
  description: 'adds an tab',

  key: 'Tab',
  exec: (code, cursors) => {
    return addText(code, 'Tab', cursors);
  }
});

keyboardShortcuts.push({
  name: 'Select Line',
  description: 'Selects entire line',

  key: 'l',
  ctrl: true,
  exec: (code, cursors) => {
    return {
      code,
      cursors
    };
  }
});