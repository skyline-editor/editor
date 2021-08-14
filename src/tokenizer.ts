export interface ValueToken {
  type: 'string' | 'number' | 'boolean' | 'keyword' | 'variable' | 'comment' | 'static' | 'operator';
  value: string;
  pos?: number;
}
export interface ArrayToken {
  type: 'parentheses' | 'brackets' | 'braces';
  value: Token[];
  pos?: number;
}
export type Token = ValueToken | ArrayToken | string;
import { Editor } from './editor';
import { Language } from './language';
import { Cursor } from './util/cursor';
import { Theme } from './util/theme';

export interface ColoredText {
  text: string;
  color: string;
}

function tokenize_raw(code: string) : string[] {
  const tokens: string[] = [];
  const matches = code.matchAll(/\W/g);

  let current_token = 0;
  for (const match of matches) {
    const i = match.index;

    if (current_token != i) tokens.push(code.slice(current_token, i));
    tokens.push(match[0]);
    current_token = i + 1;
  }

  if (current_token < code.length) tokens.push(code.slice(current_token))
  return tokens;
}

export function tokenize(code: string, language?: Language) {
  const tokens = tokenize_raw(code);
  if (!language) return tokens as Token[];
  
  const tokenizer = language.tokenize;
  const new_tokens: Token[] = tokenizer(code, tokens);

  return new_tokens;
}


function codeFromTokens(tokens: Token[], theme?: Theme) {
  const lines: ColoredText[][] = [];
  let line: ColoredText[] = [];

  for (const token of tokens) {
    if (typeof token === 'string' || typeof token.value === 'string') {
      const value = typeof token === 'string' ? token : token.value as string;

      const code_lines = value.split('\n');
      for (let i = 0; i < code_lines.length; i++) {
        if (i > 0) {
          lines.push(line);
          line = [];
        }

        const colors = theme?.colors?.tokens;
        
        let color;
        if (typeof token !== 'string') color = colors?.[token.type];

        line.push({
          text: code_lines[i],
          color: color ?? colors?.normal ?? "#fff"
        });
      }
      continue;
    }

    if (typeof token.value !== 'string') {
      const content_lines = codeFromTokens(token.value, theme);
      for (let i = 0; i < content_lines.length; i++) {
        if (i > 0) {
          lines.push(line);
          line = content_lines[i];
          continue;
        }
        line.push(...content_lines[i]);
      }
      continue;
    }
  }
  lines.push(line);
  return lines;
}

export function highlight(code: string, language?: Language, theme?: Theme) {
  const tokens = tokenize(code, language);
  const html = codeFromTokens(tokens, theme);
  return html;
}

export function getTokenFromPos(editor: Editor, cursor: Cursor, tokens?: string[]) {
  tokens = tokens ?? tokenize_raw(editor.code);

  let line = 0;
  let column = 0;

  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i];
    if (token === '\n') {
      line++;
      column = 0;
    } else {
      column += token.length;
    }

    if (line > cursor.line || (line === cursor.line && (column > cursor.column || column === cursor.column))) {
      if (/\W/.test(token)) {
        i++;
        token = tokens[i];
        if (/\W/.test(token)) break;
      } else {
        column -= token.length;
      }


      return {
        i,
        token,

        line,
        column,

        tokens
      };
    }
  }
  return null;
}
