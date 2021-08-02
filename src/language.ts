import { Token } from "./tokenizer";

export interface Language {
  id: string;
  tokenize: (code: string, tokens: string[]) => Token[];
}

export const defaultLanguage = {
  id: "default",
  tokenize: (_code: string, tokens: string[]) => tokens
} as Language;