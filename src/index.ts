import {
  ExtensionContext,
  commands,
  workspace,
} from 'coc.nvim';
import { Position, Range } from 'vscode-languageserver-types';
import { IRangeContent, IOptions } from './types';
import { format } from './format';

const optionsJSON: IOptions = {
  indent: 2,
  quote: '"',
  quoteAsNeeded: false,
  trailing: false,
  template: false,
};
const optionsJS: IOptions = {
  indent: 2,
  quote: '\'',
  quoteAsNeeded: true,
  trailing: true,
  template: true,
};

async function getContent(hasSelection = false): Promise<IRangeContent> {
  const { nvim } = workspace;
  const doc = await workspace.document;
  if (hasSelection) {
    await nvim.command('normal! `<');
    const start = await workspace.getCursorPosition();
    await nvim.command('normal! `>');
    let end = await workspace.getCursorPosition();
    end = Position.create(end.line, end.character + 1);
    const range = Range.create(start, end);
    return {
      range,
      text: doc.textDocument.getText(range),
    };
  }
  return {
    text: doc.textDocument.getText(),
  };
}

function getOptions(args: string[]): IOptions {
  const rawOptions: { [key: string]: string } = {};
  let key;
  for (const arg of args) {
    if (arg.startsWith('--')) {
      let value;
      [key, value] = arg.slice(2).split('=');
      key = key.replace(/-(\w)/g, (_m, g) => g.toUpperCase());
      rawOptions[key] = value ?? 'true';
    } else if (key) {
      rawOptions[key] = arg;
    }
  }
  let options: IOptions;
  if (rawOptions.presetJs === 'true') {
    options = { ...optionsJS };
  } else {
    options = { ...optionsJSON };
  }
  if (rawOptions.indent != null) options.indent = +rawOptions.indent;
  if (rawOptions.quote === '\'' || rawOptions.quote === '"') options.quote = rawOptions.quote;
  if (rawOptions.quoteAsNeeded != null) options.quoteAsNeeded = rawOptions.quoteAsNeeded === 'true';
  if (rawOptions.template != null) options.template = rawOptions.template === 'true';
  if (rawOptions.trailing != null) options.trailing = rawOptions.trailing === 'true';
  return options;
}

async function formatJson(content: IRangeContent, options: IOptions): Promise<void> {
  const formatted = format(content.text, options);
  if (content.range) {
    const doc = await workspace.document;
    doc.applyEdits([{ range: content.range, newText: formatted }]);
  } else {
    const buffer = await workspace.nvim.buffer;
    const [, last] = await workspace.nvim.eval('getpos("$")') as number[];
    buffer.setLines(formatted.split('\n'), {
      start: 0,
      end: last,
    });
  }
}

export function activate(context: ExtensionContext): void {
  context.subscriptions.push(commands.registerCommand(
    'formatJson',
    async (...args: string[]) => {
      await formatJson(await getContent(), getOptions(args));
    },
  ));

  context.subscriptions.push(commands.registerCommand(
    'formatJson.selected',
    async (...args: string[]) => {
      await formatJson(await getContent(true), getOptions(args));
    },
  ));
}
