import JSON5 from 'json5';
import { IOptions, IRenderItem } from './types';

const MULTILINE = 'MULTILINE';
const SINGLELINE = 'SINGLELINE';
const KEY = 'KEY';
const COMMA = { type: 'comma', value: ',' };
const BR = { type: 'br', value: '\n' };

const charMapBase = {
  '\\': '\\\\',
  '\r': '\\r',
  '\t': '\\t',
};
const charMapQuote = {
  ...charMapBase,
  '\'': '\\\'',
  '\n': '\\n',
} as any;
const charMapTemplate = {
  ...charMapBase,
  '`': '\\`',
} as any;

function quoteString(str: string, {
  quote,
  quoteAsNeeded,
  template,
}: IOptions): string {
  if (template && /\n/.test(str)) {
    const quoted = str.replace(/[\\`\r\t]/g, m => charMapTemplate[m]);
    return `\`${quoted}\``;
  }
  if (!quoteAsNeeded || /\W/.test(str)) {
    const re = new RegExp(`[\\\\\\r\\n\\t${quote}]`, 'g');
    const quoted = str.replace(re, m => charMapQuote[m]);
    return quote + quoted + quote;
  }
  return str;
}

function getSpace(level: number, indent: number): IRenderItem {
  return { type: 'space', value: ' '.repeat(indent * level) };
}

function render(data: any, options: IOptions, level = 0): IRenderItem {
  if (Array.isArray(data)) {
    const arr: IRenderItem[] = [];
    const ret = {
      type: MULTILINE,
      separator: [COMMA],
      data: arr,
    };
    arr.push({ value: '[' });
    if (data.length) {
      const rendered = data.map(item => render(item, options, level + 1));
      arr.push(
        ...options.indent ? [BR] : [],
        getSpace(level + 1, options.indent),
        ...join(rendered, options, level + 1),
        ...options.indent ? [BR] : [],
        getSpace(level, options.indent),
      );
    } else {
      ret.type = SINGLELINE;
    }
    arr.push({ value: ']' });
    return ret;
  }
  if (data === null) {
    return {
      type: SINGLELINE,
      separator: [COMMA],
      data: [{ value: data, type: 'null' }],
    };
  }
  if (typeof data === 'object') {
    const arr: IRenderItem[] = [];
    const ret = {
      type: MULTILINE,
      separator: [COMMA],
      data: arr,
    };
    arr.push({ value: '{' });
    const rendered = Object.keys(data)
    .map(key => [
      {
        type: KEY,
        data: [{ value: quoteString(key, options), type: 'key' }],
        separator: [{ value: ':' }],
      },
      render(data[key], options, level + 1),
    ])
    .reduce((res, cur) => [...res, ...cur], []);
    if (rendered.length) {
      arr.push(
        ...options.indent ? [BR] : [],
        getSpace(level + 1, options.indent),
        ...join(rendered, options, level + 1),
        ...options.indent ? [BR] : [],
        getSpace(level, options.indent),
      );
    } else {
      ret.type = SINGLELINE;
    }
    arr.push({ value: '}' });
    return ret;
  }
  return {
    type: SINGLELINE,
    separator: [COMMA],
    data: [{ value: typeof data === 'string' ? quoteString(data, { ...options, quoteAsNeeded: false }) : data }],
  };
}

function join(rendered: IRenderItem[], options: IOptions, level: number): IRenderItem[] {
  const arr: IRenderItem[] = [];
  for (let i = 0; i < rendered.length; i += 1) {
    const item = rendered[i];
    const next = rendered[i + 1];
    if (item.data) arr.push(...item.data);
    // trailing separators
    if (item.separator && (next || options.trailing)) {
      arr.push(...item.separator);
    }
    if (next) {
      if (item.type === KEY) {
        if (options.indent) arr.push({ value: ' ' });
      } else {
        arr.push(
          ...options.indent ? [BR] : [],
          getSpace(level, options.indent)
        );
      }
    }
  }
  return arr;
}

export function format(input: string, options: IOptions): string {
  const obj = JSON5.parse(input);
  const rendered = render(obj, options);
  return (rendered.data || []).map(({ value }) => `${value}`).join('');
}
