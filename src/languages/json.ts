import { ArrayToken, Token, ValueToken } from "../tokenizer";

const STRING = (value: string, pos: number) => ({ type: 'string', value, pos }) as ValueToken;
const NUMBER = (value: string, pos: number) => ({ type: 'number', value, pos }) as ValueToken;
const BOOLEAN = (value: string, pos: number) => ({ type: 'boolean', value, pos }) as ValueToken;
const VARIABLE = (value: string, pos: number) => ({ type: 'variable', value, pos }) as ValueToken;
const STATIC = (value: string, pos: number) => ({ type: 'static', value, pos }) as ValueToken;

const BRACKETS = (value: Token[], pos: number) => ({ type: 'brackets', value, pos }) as ArrayToken;
const BRACES = (value: Token[], pos: number) => ({ type: 'braces', value, pos }) as ArrayToken;

const brackets = [
  '{',
  '[',
];
const statics = [
  'null',
];

export default function tokenize(code: string, tokens: string[]) {
  const new_tokens: Token[] = [];
  const env = {
    string: null
  };

  let pos = 0;

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i - 1]) pos += tokens[i - 1].length;
    const previous_token = tokens[i - 1];
    const token = tokens[i];

    if (env.string) {
      if (token === '\n' && env.string.value !== '`') {
        new_tokens.push(STRING(code.slice(env.string, pos), env.string));
        new_tokens.push('\n');
        env.string = null;
        continue;
      }
      if (previous_token !== '\\' && token === '"') {
        new_tokens.push(STRING(code.slice(env.string, pos + 1), env.string));
        env.string = null;
        continue;
      }
      continue;
    }

    if (token === '"') {
      const previous_token = tokens[i - 1];
      if (!previous_token || previous_token !== '\\') {
        env.string = pos;
        continue;
      }
    }

    if (token == 'true' || token == 'false') {
      new_tokens.push(BOOLEAN(token, pos));
      continue;
    }

    if (statics.includes(token)) {
      new_tokens.push(STATIC(token, pos));
      continue;
    }

    if (!/\D/g.test(token)) {
      new_tokens.push(NUMBER(token, pos));
      continue;
    }

    // if (!/\W/g.test(token)) {
    //   new_tokens.push(VARIABLE(token, pos));
    //   continue;
    // }

    if (token == '.') {
      const next_token = tokens[i + 1];
      if (next_token && !/\D/g.test(next_token)) {
        new_tokens.push(NUMBER(token, pos));
        continue;
      }
    }

    new_tokens.push(token);
  }

  return new_tokens;
}