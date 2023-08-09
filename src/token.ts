export enum TokenType {
  number = "number",
  string = "string",
  keyword = "keyword",
  identifier = "identifier",
  eof = "eof",
  dot = ".",
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
  colon = ":",
  comma = ",",
  lbracket = "[",
  rbracket = "]",
}

export enum Keyword {
  if = "if",
  object = "object",
  while = "while",
  until = "until",
  func = "func",
  break = "break",
  continue = "continue",
  self = "self",
  return = "return",
}

export const en2Keyword = {
  if: Keyword.if,
  object: Keyword.object,
  while: Keyword.while,
  until: Keyword.until,
  func: Keyword.func,
  break: Keyword.break,
  continue: Keyword.continue,
  self: Keyword.self,
  return: Keyword.return,
}

export const hanSimplified2Keyword = {
  如果: Keyword.if,
  对象: Keyword.object,
  当: Keyword.while,
  直到: Keyword.until,
  函数: Keyword.func,
  中断: Keyword.break,
  继续: Keyword.continue,
  自己: Keyword.self,
  返回: Keyword.return,
}

export function isKeyword(identifier: string): boolean {
  return Boolean(en2Keyword[identifier]) || Boolean(hanSimplified2Keyword[identifier])
}

export function parseKeyword(identifier: string): Keyword | undefined {
  return en2Keyword[identifier] ?? hanSimplified2Keyword[identifier]
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
  type: TokenType.dot
} | {
  type: TokenType.eof
}
) & {
  line: number
  pos: number
}

export enum BinaryOp {
  plus = "+",
  minus = "-",
  times = "*",
  divide = "/",
  modulo = "%",
  equal = "==",
  memberAccess = ".",
}

export enum AssignOp {
  plusAssign = "+=",
  minusAssign = "-=",
  timesAssign = "*=",
  divideAssign = "/=",
  moduloAssign = "%=",
  assign = "=",
  init = ":=",
}

export enum UnaryOp {
  plus = "+",
  minus = "-",
}
