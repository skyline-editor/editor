import { EditorAPI } from "./api";

export class EditorPlugin {
  constructor(api: EditorAPI) {
    this.api = api;
  }
  destroy(): void {
    this.api.destroy();
    this.api = null;
  }

  api: EditorAPI;
  name: string;
}