var STRING$1 = function (value, pos) { return ({ type: 'string', value: value, pos: pos }); };
var NUMBER$1 = function (value, pos) { return ({ type: 'number', value: value, pos: pos }); };
var BOOLEAN$1 = function (value, pos) { return ({ type: 'boolean', value: value, pos: pos }); };
var KEYWORD$1 = function (value, pos) { return ({ type: 'keyword', value: value, pos: pos }); };
var VARIABLE$1 = function (value, pos) { return ({ type: 'variable', value: value, pos: pos }); };
var COMMENT$1 = function (value, pos) { return ({ type: 'comment', value: value, pos: pos }); };
var STATIC$1 = function (value, pos) { return ({ type: 'static', value: value, pos: pos }); };
var OPERATOR$1 = function (value, pos) { return ({ type: 'operator', value: value, pos: pos }); };
var PARENTHESES$1 = function (value, pos) { return ({ type: 'parentheses', value: value, pos: pos }); };
var BRACKETS$1 = function (value, pos) { return ({ type: 'brackets', value: value, pos: pos }); };
var BRACES$1 = function (value, pos) { return ({ type: 'braces', value: value, pos: pos }); };
var invisible = [
    ' ',
    '\n',
    '\t'
];
var strings$1 = [
    '\'',
    '`',
    '"' ];
var keywords$1 = [
    'import',
    'from',
    'const',
    'let',
    'var',
    'function',
    'class',
    'extends',
    'return',
    'if',
    'else',
    'while',
    'for',
    'with',
    'break',
    'continue',
    'switch',
    'case',
    'default',
    'try',
    'catch',
    'finally',
    'throw',
    'delete',
    'typeof',
    'instanceof',
    'in',
    'of',
    'await',
    'yield',
    'await',
    'async',
    'as',
    'export',
    'type',
    'interface',
    'new'
];
var brackets$1 = [
    '{',
    '(',
    '[' ];
var statics$1 = [
    'null',
    'undefined'
];
var operators$1 = [
    '=',
    '=>',
    '+',
    '-',
    '*',
    '/',
    '%',
    '&',
    '|',
    '^',
    '!',
    '~' ];
var blank_vars = [
    'var',
    'let' ];
function tokenize$2(code, tokens) {
    var _a, _b;
    var new_tokens = [];
    var env = {
        comment: null,
        string: null,
        brackets: [],
    };
    var pos = 0;
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i - 1])
            { pos += tokens[i - 1].length; }
        var previous_token = tokens[i - 1];
        var token = tokens[i];
        if (env.string) {
            if (token === '\n' && env.string.value !== '`') {
                new_tokens.push(STRING$1(code.slice(env.string.pos, pos), env.string.pos));
                new_tokens.push('\n');
                env.string = null;
                continue;
            }
            if (previous_token !== '\\' && token === env.string.value) {
                new_tokens.push(STRING$1(code.slice(env.string.pos, pos + 1), env.string.pos));
                env.string = null;
                continue;
            }
            continue;
        }
        if (env.comment) {
            var length = pos - env.comment.pos;
            var next_token = (_a = tokens[i + 1]) !== null && _a !== void 0 ? _a : '';
            var value = token + next_token;
            if (env.comment.value === '//' && token === '\n') {
                var value$1 = code.substr(env.comment.pos, length);
                new_tokens.push(COMMENT$1(value$1, env.comment.pos));
                pos -= tokens[i - 1].length;
                i--;
                env.comment = null;
                continue;
            }
            if (env.comment.value === '/*' && value === '*/') {
                var value$2 = code.substr(env.comment.pos, length + 2);
                new_tokens.push(COMMENT$1(value$2, env.comment.pos));
                i++;
                pos++;
                env.comment = null;
                continue;
            }
            continue;
        }
        if (token === '/') {
            var next_token$1 = (_b = tokens[i + 1]) !== null && _b !== void 0 ? _b : '';
            if (next_token$1 === '/' || next_token$1 === '*') {
                env.comment = {
                    value: token + next_token$1,
                    pos: pos,
                };
                continue;
            }
        }
        if (env.brackets.length > 0 && token === env.brackets[env.brackets.length - 1].closing) {
            var pos$1 = env.brackets.pop().pos;
            var value$3 = new_tokens.splice(pos$1, new_tokens.length - pos$1);
            if (token === ')')
                { new_tokens.push(PARENTHESES$1(value$3, pos$1)); }
            if (token === ']')
                { new_tokens.push(BRACES$1(value$3, pos$1)); }
            if (token === '}')
                { new_tokens.push(BRACKETS$1(value$3, pos$1)); }
            new_tokens.push(token);
            continue;
        }
        if (brackets$1.includes(token)) {
            var closing = '';
            if (token === '(')
                { closing = ')'; }
            if (token === '[')
                { closing = ']'; }
            if (token === '{')
                { closing = '}'; }
            new_tokens.push(token);
            env.brackets.push({
                value: token,
                pos: new_tokens.length,
                closing: closing,
            });
            continue;
        }
        if (strings$1.includes(token)) {
            var previous_token$1 = tokens[i - 1];
            if (!previous_token$1 || previous_token$1 !== '\\') {
                env.string = {
                    value: token,
                    pos: pos,
                };
                continue;
            }
        }
        if (blank_vars.includes(token)) {
            new_tokens.push(KEYWORD$1(token, pos));
            var between = "";
            while (invisible.includes(tokens[i + 1])) {
                pos += tokens[i].length;
                i++;
                between += tokens[i];
            }
            new_tokens.push.apply(new_tokens, between);
            if (tokens[i + 1] && !/\W/g.test(tokens[i + 1])) {
                new_tokens.push(tokens[i + 1]);
                pos += tokens[i].length;
                i++;
            }
            continue;
        }
        if (keywords$1.includes(token)) {
            new_tokens.push(KEYWORD$1(token, pos));
            continue;
        }
        if (token == 'true' || token == 'false') {
            new_tokens.push(BOOLEAN$1(token, pos));
            continue;
        }
        if (statics$1.includes(token)) {
            new_tokens.push(STATIC$1(token, pos));
            continue;
        }
        if (!/\D/g.test(token)) {
            new_tokens.push(NUMBER$1(token, pos));
            continue;
        }
        var operator = '';
        for (var j = 0; j < operators$1.length; j++) {
            if (operators$1[j].length <= operator.length)
                { continue; }
            var t = code.substr(pos, operators$1[j].length);
            if (t === operators$1[j])
                { operator = operators$1[j]; }
        }
        if (operator) {
            var total = token.length;
            while (total < operator.length) {
                i++;
                total += tokens[i].length;
            }
            pos += total;
            pos -= tokens[i].length;
            new_tokens.push(OPERATOR$1(operator, pos));
            continue;
        }
        if (!/\W/g.test(token)) {
            new_tokens.push(VARIABLE$1(token, pos));
            continue;
        }
        if (token == '.') {
            var next_token$2 = tokens[i + 1];
            if (next_token$2 && !/\D/g.test(next_token$2))
                { new_tokens.push(NUMBER$1(token, pos)); }
            else
                { new_tokens.push(OPERATOR$1(token, pos)); }
            continue;
        }
        new_tokens.push(token);
    }
    if (env.string)
        { new_tokens.push(STRING$1(code.slice(env.string.pos), env.string.pos)); }
    if (env.comment)
        { new_tokens.push(COMMENT$1(code.substr(env.comment.pos), env.comment.pos)); }
    return new_tokens;
}

var STRING = function (value, pos) { return ({ type: 'string', value: value, pos: pos }); };
var NUMBER = function (value, pos) { return ({ type: 'number', value: value, pos: pos }); };
var BOOLEAN = function (value, pos) { return ({ type: 'boolean', value: value, pos: pos }); };
var KEYWORD = function (value, pos) { return ({ type: 'keyword', value: value, pos: pos }); };
var VARIABLE = function (value, pos) { return ({ type: 'variable', value: value, pos: pos }); };
var COMMENT = function (value, pos) { return ({ type: 'comment', value: value, pos: pos }); };
var STATIC = function (value, pos) { return ({ type: 'static', value: value, pos: pos }); };
var OPERATOR = function (value, pos) { return ({ type: 'operator', value: value, pos: pos }); };
var PARENTHESES = function (value, pos) { return ({ type: 'parentheses', value: value, pos: pos }); };
var BRACKETS = function (value, pos) { return ({ type: 'brackets', value: value, pos: pos }); };
var BRACES = function (value, pos) { return ({ type: 'braces', value: value, pos: pos }); };
var strings = [
    '\'',
    '`',
    '"' ];
var keywords = [
    'import',
    'use',
    'if',
    'else',
    'while',
    'for',
    'with',
    'cond',
    'case',
    'try',
    'catch',
    'finally',
    'throw',
    'defmodule',
    'def',
    'defp',
    'defmacro'
];
var brackets = [
    '{',
    '(',
    '[' ];
var statics = [
    'null',
    'undefined'
];
var operators = [
    '=',
    '=>',
    '+',
    '-',
    '*',
    '/',
    '%',
    '&',
    '|',
    '^',
    '!',
    '~' ];
function tokenize$1(code, tokens) {
    var _a, _b;
    var new_tokens = [];
    var env = {
        comment: null,
        string: null,
        brackets: [],
    };
    var pos = 0;
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i - 1])
            { pos += tokens[i - 1].length; }
        var previous_token = tokens[i - 1];
        var token = tokens[i];
        if (env.string) {
            if (token === '\n' && env.string.value !== '`') {
                new_tokens.push(STRING(code.slice(env.string.pos, pos), env.string.pos));
                new_tokens.push('\n');
                env.string = null;
                continue;
            }
            if (previous_token !== '\\' && token === env.string.value) {
                new_tokens.push(STRING(code.slice(env.string.pos, pos + 1), env.string.pos));
                env.string = null;
                continue;
            }
            continue;
        }
        if (env.comment) {
            var length = pos - env.comment.pos;
            var next_token = (_a = tokens[i + 1]) !== null && _a !== void 0 ? _a : '';
            var value = token + next_token;
            if (env.comment.value === '//' && token === '\n') {
                var value$1 = code.substr(env.comment.pos, length);
                new_tokens.push(COMMENT(value$1, env.comment.pos));
                pos -= tokens[i - 1].length;
                i--;
                env.comment = null;
                continue;
            }
            if (env.comment.value === '/*' && value === '*/') {
                var value$2 = code.substr(env.comment.pos, length + 2);
                new_tokens.push(COMMENT(value$2, env.comment.pos));
                i++;
                pos++;
                env.comment = null;
                continue;
            }
            continue;
        }
        if (token === '/') {
            var next_token$1 = (_b = tokens[i + 1]) !== null && _b !== void 0 ? _b : '';
            if (next_token$1 === '/' || next_token$1 === '*') {
                env.comment = {
                    value: token + next_token$1,
                    pos: pos,
                };
                continue;
            }
        }
        if (env.brackets.length > 0 && token === env.brackets[env.brackets.length - 1].closing) {
            var pos$1 = env.brackets.pop().pos;
            var value$3 = new_tokens.splice(pos$1, new_tokens.length - pos$1);
            if (token === ')')
                { new_tokens.push(PARENTHESES(value$3, pos$1)); }
            if (token === ']')
                { new_tokens.push(BRACES(value$3, pos$1)); }
            if (token === '}')
                { new_tokens.push(BRACKETS(value$3, pos$1)); }
            new_tokens.push(token);
            continue;
        }
        if (brackets.includes(token)) {
            var closing = '';
            if (token === '(')
                { closing = ')'; }
            if (token === '[')
                { closing = ']'; }
            if (token === '{')
                { closing = '}'; }
            new_tokens.push(token);
            env.brackets.push({
                value: token,
                pos: new_tokens.length,
                closing: closing,
            });
            continue;
        }
        if (strings.includes(token)) {
            var previous_token$1 = tokens[i - 1];
            if (!previous_token$1 || previous_token$1 !== '\\') {
                env.string = {
                    value: token,
                    pos: pos,
                };
                continue;
            }
        }
        if (keywords.includes(token)) {
            new_tokens.push(KEYWORD(token, pos));
            continue;
        }
        if (token === ':') {
            var next_token$2 = tokens[i + 1];
            if (next_token$2 && !/\W/g.test(next_token$2)) {
                new_tokens.push(STATIC(token + next_token$2, pos));
                i++;
                pos++;
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
        var operator = '';
        for (var j = 0; j < operators.length; j++) {
            if (operators[j].length <= operator.length)
                { continue; }
            var t = code.substr(pos, operators[j].length);
            if (t === operators[j])
                { operator = operators[j]; }
        }
        if (operator) {
            var total = token.length;
            while (total < operator.length) {
                i++;
                total += tokens[i].length;
            }
            pos += total;
            pos -= tokens[i].length;
            new_tokens.push(OPERATOR(operator, pos));
            continue;
        }
        if (!/\W/g.test(token)) {
            new_tokens.push(VARIABLE(token, pos));
            continue;
        }
        if (token == '.') {
            var next_token$3 = tokens[i + 1];
            if (next_token$3 && !/\D/g.test(next_token$3))
                { new_tokens.push(NUMBER(token, pos)); }
            else
                { new_tokens.push(token); }
            continue;
        }
        new_tokens.push(token);
    }
    if (env.string)
        { new_tokens.push(STRING(code.slice(env.string.pos), env.string.pos)); }
    if (env.comment)
        { new_tokens.push(COMMENT(code.substr(env.comment.pos), env.comment.pos)); }
    return new_tokens;
}

var languages = {
    typescript: tokenize$2,
    elixir: tokenize$1,
};

var colors = {
    string: '#C9FFD8',
    number: '#E1C9FF',
    operator: '#FF79C6',
    boolean: '#9A92FF',
    static: '#9A92FF',
    keyword: '#79CFFF',
    variable: '#83ADFF',
    propery: '#83ADFF',
    comment: '#46667E',
    normal: '#f8f8f2'
};
function highlight(code, language) {
    var tokens = tokenize(code, language);
    var html = codeFromTokens(tokens);
    return html;
}
function getElemsFromTokens(tokens) {
    var _a;
    var elems = [];
    for (var token of tokens) {
        if (typeof token === 'string' || typeof token.value === 'string') {
            var value = typeof token === 'string' ? token : token.value;
            var lines = value.split('\n');
            for (var i = 0; i < lines.length; i++) {
                if (i > 0)
                    { elems.push(null); }
                elems.push({
                    text: lines[i],
                    color: typeof token === 'string' ? colors.normal : (_a = colors[token.type]) !== null && _a !== void 0 ? _a : colors.normal
                });
            }
            continue;
        }
        if (typeof token.value !== 'string') {
            elems.push.apply(elems, getElemsFromTokens(token.value));
            continue;
        }
    }
    return elems;
}
function codeFromTokens(tokens) {
    var elems = getElemsFromTokens(tokens);
    if (elems[elems.length - 1])
        { elems.push(null); }
    var lines = [];
    var line = [];
    for (var i = 0; i < elems.length; i++) {
        if (!elems[i]) {
            lines.push(line);
            line = [];
            continue;
        }
        line.push(elems[i]);
    }
    return lines;
}
function tokenize_raw(code) {
    var tokens = [];
    var matches = code.matchAll(/\W/g);
    var current_token = 0;
    for (var match of matches) {
        var i = match.index;
        if (current_token != i)
            { tokens.push(code.slice(current_token, i)); }
        tokens.push(match[0]);
        current_token = i + 1;
    }
    if (current_token < code.length)
        { tokens.push(code.slice(current_token)); }
    return tokens;
}
function tokenize(code, language) {
    var tokenizer = languages[language];
    if (typeof tokenizer === 'undefined')
        { throw new Error(("Language " + language + " not found")); }
    var tokens = tokenize_raw(code);
    var new_tokens = tokenizer(code, tokens);
    return new_tokens;
}

var Cursor = function Cursor(editor, line, column) {
    this.line = line !== null && line !== void 0 ? line : 0;
    this.column = column !== null && column !== void 0 ? column : 0;
    this.editor = editor;
};
Cursor.prototype.clone = function clone () {
    return new Cursor(this.editor, this.line, this.column);
};
Cursor.prototype.validate = function validate (clone, change) {
    var lines = this.editor.lines;
    clone = clone !== null && clone !== void 0 ? clone : true;
    change = change !== null && change !== void 0 ? change : {
        line: true,
        column: true
    };
    var line = this.line;
    var column = this.column;
    if (change.line) {
        if (line < 0)
            { line = 0; }
        if (line >= lines.length)
            { line = lines.length - 1; }
    }
    if (change.column) {
        if (column < 0)
            { column = 0; }
        if (column > lines[line].length)
            { column = lines[line].length; }
    }
    if (clone) {
        return new Cursor(this.editor, line, column);
    }
    else {
        this.line = line;
        this.column = column;
        return this;
    }
};
// intended to be used in array.sort()
Cursor.prototype.compare = function compare (other) {
    return Cursor.compare(this, other);
};
Cursor.compare = function compare (a, b) {
    if (a.line < b.line)
        { return -1; }
    if (a.line > b.line)
        { return 1; }
    if (a.column < b.column)
        { return -1; }
    if (a.column > b.column)
        { return 1; }
    return 0;
};
Cursor.prototype.move = function move (change, clone) {
    clone = clone !== null && clone !== void 0 ? clone : true;
    if (clone)
        { return this.clone().move(change, false); }
    var lines = this.editor.lines;
    var validated = this.validate();
    if (change.line) {
        this.line = validated.line + change.line;
        if (this.line < 0)
            { this.line = 0; }
        if (this.line >= lines.length)
            { this.line = lines.length - 1; }
    }
    if (change.column) {
        this.column = validated.column + change.column;
        if (this.column < 0) {
            this.line--;
            if (this.line < 0) {
                this.line = 0;
                this.column = 0;
            }
            else {
                this.column = lines[this.line].length;
            }
        }
        if (this.column > lines[this.line].length) {
            this.line++;
            if (this.line >= lines.length) {
                this.line = lines.length - 1;
                this.column = lines[this.line].length;
            }
            else {
                this.column = 0;
            }
        }
    }
    return this;
};

var Selection = function Selection(editor, start, end) {
    this.start = end ? start : start.clone();
    this.end = end !== null && end !== void 0 ? end : start;
    this.start.selection = this;
    this.end.selection = this;
    this.editor = editor;
};
Selection.prototype.moveStart = function moveStart (change) {
    this.start.move(change, false);
    return this;
};
Selection.prototype.moveEnd = function moveEnd (change) {
    this.end.move(change, false);
    return this;
};
Selection.prototype.getText = function getText () {
    var lines = this.editor.lines;
    var affectedLines = lines.slice(this.start.line, this.end.line + 1);
    affectedLines[0] = affectedLines[0].substring(this.start.column);
    affectedLines[affectedLines.length - 1] = affectedLines[affectedLines.length - 1].substring(0, this.end.column);
    return affectedLines.join('\n');
};
Selection.prototype.setText = function setText (text) {
    var lines = this.editor.lines;
    lines[this.start.line] = lines[this.start.line].substring(0, this.start.column) + text + lines[this.end.line].substring(this.end.column);
    lines.splice(this.start.line + 1, Math.max(0, this.end.line - this.start.line));
    return lines.join('\n');
};

var extra = '';
var tab_size = 2;
var write_modes = {
    'Backspace': ['delete', -1],
    'Delete': ['delete', 1],
    'Tab': ['insert', ' '.repeat(tab_size)],
    'Enter': ['insert', '\n'],
};
function addTextCursor(editor, key, cursor, affected) {
    var assign;

    if (key.length > 1 && !(key in write_modes))
        { return editor.code; }
    var ref = ['insert', key];
    var mode = ref[0];
    var args = ref.slice(1);
    if (key in write_modes)
        { (assign = write_modes[key], mode = assign[0], args = assign.slice(1)); }
    cursor.validate(false, { column: true });
    var lines = editor.lines;
    var line = lines[cursor.line];
    var column = cursor.column;
    if (mode === 'delete') {
        var direction = args[0];
        var back = Math.max(0, -direction);
        var front = Math.max(0, direction);
        var lineText = line.substring(0, column - back);
        var lineEnd = line.substring(column + front);
        if (cursor.column < back || cursor.column > line.length - front) {
            if (back) {
                if (cursor.line > 0) {
                    var lineText$1 = lines[cursor.line - 1];
                    var lineEnd$1 = line;
                    var newLine = lineText$1 + lineEnd$1;
                    lines.splice(cursor.line - 1, 2, newLine);
                    cursor.line--;
                    cursor.column = lineText$1.length;
                    affected.map(function (v) {
                        if (v.line === cursor.line)
                            { v.column += lineText$1.length; }
                        v.line -= 1;
                    });
                }
            }
            if (front) {
                if (cursor.line < lines.length - 1) {
                    var lineText$2 = line;
                    var lineEnd$2 = lines[cursor.line + 1];
                    var newLine$1 = lineText$2 + lineEnd$2;
                    lines.splice(cursor.line, 2, newLine$1);
                    cursor.column = lineText$2.length;
                    affected.map(function (v) {
                        if (v.line === cursor.line + 1)
                            { v.column += lineText$2.length; }
                        v.line -= 1;
                    });
                }
            }
        }
        else {
            var newLine$2 = lineText + lineEnd;
            lines.splice(cursor.line, 1, newLine$2);
            cursor.column -= back;
            affected.map(function (v) { return v.column += v.line === cursor.line ? -1 : 0; });
        }
    }
    if (mode === 'insert') {
        var text = args[0];
        extra = '';
        if (key === 'Tab') {
            var skip = [
                '(',
                ')',
                '{',
                '}',
                '[',
                ']',
                '\'',
                '"'
            ];
            var nextChar = line[cursor.column];
            if (nextChar && skip.includes(nextChar)) {
                cursor.column += 1;
                return lines.join('\n');
            }
        }
        if (key === ' ') {
            var nextChar$1 = line[cursor.column];
            var prevChar = line[cursor.column - 1];
            var t = prevChar + nextChar$1;
            var spacing = [
                '{}',
                '[]',
                '()' ];
            if (nextChar$1 && prevChar && spacing.includes(t))
                { extra = ' '; }
        }
        if (text === '(')
            { extra = ')'; }
        if (text === '{')
            { extra = '}'; }
        if (text === '[')
            { extra = ']'; }
        if (text === '<')
            { extra = '>'; }
        if (text === '"')
            { extra = '"'; }
        if (text === '\'')
            { extra = '\''; }
        if (text === '`')
            { extra = '`'; }
        var lineText$3 = line.substring(0, column);
        var lineEnd$3 = line.substring(column);
        var newLine$3 = lineText$3 + text + extra + lineEnd$3;
        lines.splice(cursor.line, 1, newLine$3);
        if (text === '\n') {
            cursor.line++;
            cursor.column = 0;
        }
        else {
            cursor.column += text.length;
        }
        affected.map(function (v) {
            if (text === '\n')
                { return v.line++; }
            v.column += v.line === cursor.line ? text.length : 0;
        });
    }
    editor.code = lines.join('\n');
}
function addText(editor, key) {
    if (key === extra) {
        extra = '';
        return;
    }
    editor.cursors = editor.cursors.sort(Cursor.compare);
    for (var i = 0; i < editor.cursors.length; i++) {
        var cursor = editor.cursors[i];
        addTextCursor(editor, key, cursor, editor.cursors.slice(i + 1));
    }
    editor.cursors = editor.cursors.filter(function (cursor, i) {
        cursor = cursor.validate();
        return !editor.cursors.find(function (v, j) {
            v = v.validate();
            if (i >= j)
                { return false; }
            return v.line === cursor.line && v.column === cursor.column;
        });
    });
}

var shortcuts$2 = [];
function moveCursors(editor, change) {
    editor.cursors = editor.cursors.map(function (cursor) { return cursor.move(change, false); });
    editor.cursors = editor.cursors.filter(function (cursor, i) {
        cursor = cursor.validate();
        return !editor.cursors.find(function (v, j) {
            v = cursor.validate();
            if (i >= j)
                { return false; }
            return v.line === cursor.line && v.column === cursor.column;
        });
    });
}
shortcuts$2.push({
    name: 'Up',
    description: "Move cursors up",
    key: 'ArrowUp',
    ctrl: false,
    alt: false,
    shift: false,
    exec: function (editor) {
        moveCursors(editor, { line: -1 });
    }
});
shortcuts$2.push({
    name: 'Down',
    description: "Move cursors down",
    key: 'ArrowDown',
    ctrl: false,
    alt: false,
    shift: false,
    exec: function (editor) {
        moveCursors(editor, { line: 1 });
    }
});
shortcuts$2.push({
    name: 'Left',
    description: "Move cursors left",
    key: 'ArrowLeft',
    ctrl: false,
    alt: false,
    shift: false,
    exec: function (editor) {
        moveCursors(editor, { column: -1 });
    }
});
shortcuts$2.push({
    name: 'Right',
    description: "Move cursors right",
    key: 'ArrowRight',
    ctrl: false,
    alt: false,
    shift: false,
    exec: function (editor) {
        moveCursors(editor, { column: 1 });
    }
});

var shortcuts$1 = [];
shortcuts$1.push({
    name: 'CopyLineUp',
    description: "Copies an line up",
    key: 'ArrowUp',
    ctrl: false,
    alt: true,
    shift: true,
    exec: function (editor) {
        editor.cursors = editor.cursors.sort(Cursor.compare);
        var lines = editor.lines;
        var last = null;
        var loop = function ( i ) {
            var cursor = editor.cursors[i];
            if (last && last.line === cursor.line)
                { return; }
            last = cursor;
            var affected = editor.cursors.slice(i + 1);
            var line = lines[cursor.line];
            lines.splice(cursor.line, 0, line);
            affected.map(function (v) { return v.line += (v.line == cursor.line) ? 0 : 1; });
        };

        for (var i = 0; i < editor.cursors.length; i++) loop( i );
        editor.code = lines.join('\n');
    }
});
shortcuts$1.push({
    name: 'CopyLineDown',
    description: "Copies an line down",
    key: 'ArrowDown',
    ctrl: false,
    alt: true,
    shift: true,
    exec: function (editor) {
        editor.cursors = editor.cursors.sort(Cursor.compare);
        var lines = editor.lines;
        var last = null;
        for (var i = 0; i < editor.cursors.length; i++) {
            var cursor = editor.cursors[i];
            if (last && last.line === cursor.line)
                { continue; }
            last = cursor;
            var affected = editor.cursors.slice(i + 1);
            var line = lines[cursor.line];
            lines.splice(cursor.line, 0, line);
            cursor.line++;
            affected.map(function (v) { return v.line++; });
        }
        editor.code = lines.join('\n');
    }
});

var shortcuts = [];
shortcuts.push({
    name: 'CopyCursorUp',
    description: "Copies an cursor up",
    key: 'ArrowUp',
    ctrl: true,
    alt: true,
    shift: false,
    exec: function (editor) {
        var first_cursor = editor.cursors.reduce(function (acc, v) {
            if (v.line === acc.line)
                { return v.column < acc.column ? v : acc; }
            return v.line < acc.line ? v : acc;
        }, editor.cursors[0]);
        if (first_cursor.line < 1)
            { return; }
        editor.cursors.push(new Cursor(editor, first_cursor.line - 1, first_cursor.column));
    }
});
shortcuts.push({
    name: 'CopyCursorDown',
    description: "Copies an cursor down",
    key: 'ArrowDown',
    ctrl: true,
    alt: true,
    shift: false,
    exec: function (editor) {
        var last_cursor = editor.cursors.reduce(function (acc, v) {
            if (v.line === acc.line)
                { return v.column > acc.column ? v : acc; }
            return v.line > acc.line ? v : acc;
        }, editor.cursors[0]);
        if (last_cursor.line >= editor.lines.length - 1)
            { return; }
        editor.cursors.push(new Cursor(editor, last_cursor.line + 1, last_cursor.column));
    }
});

var Char = {
    width: 11,
    height: 20,
};
var keyboardShortcuts = [];
var EventController = function EventController(editor) {
    this.editor = editor;
};
EventController.prototype.onBlur = function onBlur (_event) {
    this.editor.cursors = [];
    this.editor.render();
};
EventController.prototype.onKeyDown = function onKeyDown (event) {
    if (this.editor.cursors.length < 1)
        { return; }
    event.preventDefault();
    for (var keyboardShortcut of keyboardShortcuts) {
        var exec = keyboardShortcut.exec;
        var ctrl = keyboardShortcut.ctrl;
            var alt = keyboardShortcut.alt;
            var shift = keyboardShortcut.shift;
            var key = keyboardShortcut.key;
        if (typeof key !== 'undefined' && event.key !== key)
            { continue; }
        if (typeof ctrl !== 'undefined' && ctrl !== event.ctrlKey)
            { continue; }
        if (typeof alt !== 'undefined' && alt !== event.altKey)
            { continue; }
        if (typeof shift !== 'undefined' && shift !== event.shiftKey)
            { continue; }
        exec(this.editor, event);
        this.editor.render();
        return;
    }
    addText(this.editor, event.key);
    this.editor.render();
};
EventController.prototype.onMouseDown = function onMouseDown (event) {
        var this$1$1 = this;

    event.preventDefault();
    var lines = this.editor.lines;
    if (!event.target)
        { return; }
    var editor = event.target;
    var x = event.clientX - editor.getBoundingClientRect().left;
    var y = event.clientY - editor.getBoundingClientRect().top;
    var cursor = new Cursor(this.editor, Math.floor(y / Char.height), Math.floor(x / Char.width)).validate(false);
    if (cursor.line < 0) {
        cursor.line = 0;
        cursor.column = 0;
    }
    if (cursor.line >= lines.length) {
        cursor.line = lines.length;
        cursor.column = lines[cursor.line].length;
    }
    if (cursor.column < 0)
        { cursor.column = 0; }
    if (cursor.column > lines[cursor.line].length)
        { cursor.column = lines[cursor.line].length; }
    if (event.altKey) {
        this.editor.cursors.push(cursor);
    }
    else {
        this.editor.cursors = [cursor];
    }
    this.editor.cursors = this.editor.cursors.filter(function (cursor, i) {
        cursor = cursor.validate();
        return !this$1$1.editor.cursors.find(function (v, j) {
            v = v.validate();
            if (i === j)
                { return false; }
            return v.line === cursor.line && v.column === cursor.column;
        });
    });
    this.editor.startSelection(cursor);
    this.editor.selections = [new Selection(this.editor, cursor)];
    this.editor.render();
};
EventController.prototype.onMouseMove = function onMouseMove (event) {
    event.preventDefault();
    var lastCursor = this.editor.getSelection();
    if (!lastCursor)
        { return; }
    var lines = this.editor.lines;
    if (!event.target)
        { return; }
    var editor = event.target;
    var x = event.clientX - editor.getBoundingClientRect().left;
    var y = event.clientY - editor.getBoundingClientRect().top;
    var cursor = new Cursor(this.editor, Math.floor(y / Char.height), Math.floor(x / Char.width)).validate(false);
    if (cursor.line < 0) {
        cursor.line = 0;
        cursor.column = 0;
    }
    if (cursor.line >= lines.length) {
        cursor.line = lines.length;
        cursor.column = lines[cursor.line].length;
    }
    if (cursor.column < 0)
        { cursor.column = 0; }
    if (cursor.column > lines[cursor.line].length)
        { cursor.column = lines[cursor.line].length; }
    var new_cursors = [lastCursor, cursor].sort(Cursor.compare);
    var selection = new (Function.prototype.bind.apply( Selection, [ null ].concat( [this.editor], new_cursors) ));
    this.editor.cursors.splice(this.editor.cursors.length - 1, 1, cursor);
    this.editor.selections = [selection];
    this.editor.render();
};
EventController.prototype.onMouseUp = function onMouseUp (event) {
    event.preventDefault();
    var lastCursor = this.editor.getSelection();
    if (!lastCursor)
        { return; }
    var lines = this.editor.lines;
    if (!event.target)
        { return; }
    var editor = event.target;
    var x = event.clientX - editor.getBoundingClientRect().left;
    var y = event.clientY - editor.getBoundingClientRect().top;
    var cursor = new Cursor(this.editor, Math.floor(y / Char.height), Math.floor(x / Char.width)).validate(false);
    if (cursor.line < 0) {
        cursor.line = 0;
        cursor.column = 0;
    }
    if (cursor.line >= lines.length) {
        cursor.line = lines.length;
        cursor.column = lines[cursor.line].length;
    }
    if (cursor.column < 0)
        { cursor.column = 0; }
    if (cursor.column > lines[cursor.line].length)
        { cursor.column = lines[cursor.line].length; }
    var new_cursors = [lastCursor, cursor].sort(Cursor.compare);
    var selection = new (Function.prototype.bind.apply( Selection, [ null ].concat( [this.editor], new_cursors) ));
    var same = cursor.line === lastCursor.line && cursor.column === lastCursor.column;
    this.editor.cursors.splice(this.editor.cursors.length - 1, 1, cursor);
    this.editor.selections = [selection];
    this.editor.endSelection(cursor, same);
    this.editor.render();
};
var Editor = function Editor() {
    this.cursors = [];
    this.selections = [];
    this.tokenized = [];
    this.activeSelection = null;
    this.canvas = null;
    this.eventController = new EventController(this);
    // TODO: make this more customizable
    this.code = '';
    this.language = 'typescript';
};

var prototypeAccessors = { lines: { configurable: true } };
Editor.prototype.startSelection = function startSelection (cursor) {
    this.activeSelection = cursor;
};
Editor.prototype.getSelection = function getSelection () {
    return this.activeSelection;
};
Editor.prototype.endSelection = function endSelection (cursor, same) {
    this.selections = same ? [] : [new Selection(this, this.activeSelection, cursor)];
    this.activeSelection = null;
};
Editor.prototype.mount = function mount (canvas) {
    this.canvas = canvas;
    this.canvas.addEventListener('blur', this.eventController.onKeyDown);
    this.canvas.addEventListener('keydown', this.eventController.onKeyDown);
    this.canvas.addEventListener('mousedown', this.eventController.onKeyDown);
    this.canvas.addEventListener('mousemove', this.eventController.onKeyDown);
    this.canvas.addEventListener('mouseup', this.eventController.onKeyDown);
};
Editor.prototype.tokenize = function tokenize () {
    this.tokenized = highlight(this.code, this.language);
    return this.tokenized;
};
Editor.prototype.render = function render () {
};
prototypeAccessors.lines.get = function () {
    return this.code.split(/\n/);
};

Object.defineProperties( Editor.prototype, prototypeAccessors );
keyboardShortcuts.push.apply(keyboardShortcuts, shortcuts$2);
keyboardShortcuts.push.apply(keyboardShortcuts, shortcuts$1);
keyboardShortcuts.push.apply(keyboardShortcuts, shortcuts);
keyboardShortcuts.push({
    name: 'Escape',
    description: 'Clear all cursors except the first one',
    key: 'Escape',
    exec: function (editor) {
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
    exec: function (editor) {
        return addText(editor, 'Tab');
    }
});
keyboardShortcuts.push({
    name: 'Select Line',
    description: 'Selects entire line',
    key: 'l',
    ctrl: true,
    exec: function (editor) {
    }
});

export { Editor };
