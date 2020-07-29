import { Position } from 'vscode-languageserver-types';

export interface IRangeContent {
  text: string;
  range?: {
    start: Position;
    end: Position;
  };
}
