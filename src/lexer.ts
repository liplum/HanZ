// lexer.ts
export enum TokenType {
  number,
  string,
  keyword,
  identifier,
  operator,
  indent,
  newLine,
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
}

export function lex(input: string) {
  let pos = 0
}
