import { Position } from 'vscode-languageserver-types';

export interface IRangeContent {
  text: string;
  range?: {
    start: Position;
    end: Position;
  };
}

export interface IOptions {
  /**
   * 0 for compact display, otherwise number of spaces for each indent
   */
  indent: number;
  /**
   * whether to omit quotes if possible
   */
  quoteAsNeeded: boolean;
  /**
   * preferred quote character, `'` by default
   */
  quote: '\'' | '"';
  /**
   * whether to add trailing commas
   */
  trailing: boolean;
  /**
   * whether to quote multiline strings as template literals
   */
  template: boolean;
}

export interface IRenderItem {
  type?: string;
  value?: string;
  data?: IRenderItem[];
  separator?: IRenderItem[];
}
