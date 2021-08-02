import tokenize, { Token } from "./language";

export interface Language {
  id: string;
  tokenize: (code: string, tokens: string[]) => Token[];
}

export default {
  id: 'typescript',
  tokenize
} as Language;