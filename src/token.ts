export enum TokenType {
  number = "number",
  string = "string",
  keyword = "keyword",
  identifier = "identifier",
  indent = "indent",
  newLine = "new-line",
  plus = "+",
  minus = "-",
  times = "*",
  divide = "/",
  modulo = "%",
  plusAssign = "+=",
  minusAssign = "-=",
  timesAssign = "*=",
  divideAssign = "/=",
  moduloAssign = "%=",
  equal = "==",
  assign = "=",
  init = ":=",
  vBar = "|",
  increase = "++",
  decrease = "++",
}

export enum Keyword {
  if = "if",
  object = "object",
  while = "while",
  until = "until",
  func = "func",
  break = "break",
  continue = "continue",
}

export const en2Keyword = {
  if: Keyword.if,
  object: Keyword.object,
  while: Keyword.while,
  until: Keyword.until,
  func: Keyword.func,
  break: Keyword.break,
  continue: Keyword.continue,
}

export const zh2Keyword = {
  如果: Keyword.if,
  对象: Keyword.object,
  当: Keyword.while,
  直到: Keyword.until,
  函数: Keyword.func,
  中断: Keyword.break,
  继续: Keyword.continue,
}

export function isKeyword(identifier: string): boolean {
  return Boolean(en2Keyword[identifier]) || Boolean(zh2Keyword[identifier])
}

export function parseKeyword(identifier: string): Keyword | undefined {
  return en2Keyword[identifier] ?? zh2Keyword[identifier]
}

export type Token = ({
  type: TokenType
  lexeme: string
} | {
  type: TokenType.keyword
  lexeme: Keyword
} | {
  type: TokenType.identifier
  lexeme: string
} | {
  type: TokenType.string
  lexeme: string
} | {
  type: TokenType.number
  lexeme: string
} | {
  type: TokenType.indent
  lexeme: number
} | {
  type: TokenType.newLine
}
) & {
  line: number
  column: number
  pos: number
}
