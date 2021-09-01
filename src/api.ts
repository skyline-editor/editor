import EventEmitter from "events";
import { Editor } from "./editor";
import { Language } from "./language";
import { Theme } from "./util/theme";

interface EditorEvents {
  // Outbound
  save: () => void;

  // Inbound
  render: () => void;
}
interface Events {
  render: () => void;
}

export class EditorAPIEvents {
  private events = new EventEmitter();

  public on<T extends keyof EditorEvents>(event: T, handler: EditorEvents[T]): void {
    this.events.on(event, handler);
  }
  public once<T extends keyof EditorEvents>(event: T, handler: EditorEvents[T]): void {
    this.events.once(event, handler);
  }

  public emit<T extends keyof EditorEvents>(event: T, ...args: Parameters<EditorEvents[T]>): void {
    this.events.emit(event, ...args);
  }

  public removeAllListeners(): void {
    this.events.removeAllListeners();
  }
}
export class EditorAPI {
  private events = new EventEmitter();

  public on<T extends keyof Events>(event: T, handler: Events[T]): void {
    this.events.on(event, handler);
  }
  public once<T extends keyof Events>(event: T, handler: Events[T]): void {
    this.events.once(event, handler);
  }

  private emit<T extends keyof Events>(event: T, ...args: Parameters<Events[T]>): void {
    this.events.emit(event, ...args);
  }

  private editorEvents: EditorAPIEvents;
  public editor: Editor;

  constructor(editor: Editor, editorEvents: EditorAPIEvents) {
    this.editor = editor;
    this.editorEvents = editorEvents;

    this.editorEvents.on('render', () => {
      this.emit('render');
    });
  }

  public destroy() {
    this.editorEvents.removeAllListeners();
    this.editorEvents = null;
    
    this.events.removeAllListeners();
    this.events = null;

    this.editor = null;
  }

  // Functions

  public save(): void {
    this.editorEvents.emit('save');
  }

  public scroll(x: number, y: number): void {
    this.editor.scrollX = x;
    this.editor.scrollY = y;
    this.editor.render();
  }

  public setTheme(theme: Theme): void {
    this.editor.setTheme(theme);
  }

  public getTheme(): Theme {
    return this.editor.theme;
  }
  
  public setCode(code: string): void {
    this.editor.setCode(code);
  }

  public getCode(): string {
    return this.editor.code;
  }

  public setLanguage(language: Language): void {
    this.editor.setLanguage(language);
  }

  public getLanguage(): Language {
    return this.editor.language;
  }

  public getLine(line: number): string {
    return this.editor.lines[line];
  }

  public getLineCount(): number {
    return this.editor.lines.length;
  }

  public getTokenColors() {
    return this.editor.tokenized;
  }
  
  public render(): void {
    this.editor.render();
  }
}