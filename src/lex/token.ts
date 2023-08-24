export enum TokenType {
  number = "number",
  string = "string",
  id = "id",
  operator = "operator",
  eof = "eof",
  dot = ".",
  vBar = "|",
  colon = ":",
  comma = ",",
  init = ":=",
  lbracket = "[",
  rbracket = "]",
  lParen = "(",
  rParen = ")",
}

export enum Keyword {
  if = "if",
  else = "else",
  elif = "elif",
  object = "object",
  while = "while",
  func = "func",
  method = "method",
  break = "break",
  continue = "continue",
  return = "return",
  self = "self",
  discard = "_",
  undefined = "undefined",
  null = "null",
  true = "true",
  false = "false",
}

export const en2Keyword = {
  if: Keyword.if,
  else: Keyword.else,
  elif: Keyword.elif,
  object: Keyword.object,
  while: Keyword.while,
  func: Keyword.func,
  method: Keyword.method,
  break: Keyword.break,
  continue: Keyword.continue,
  return: Keyword.return,
  self: Keyword.self,
  _: Keyword.discard,
  true: Keyword.true,
  false: Keyword.false,
  undefined: Keyword.undefined,
  null: Keyword.null,
}

export const hanSimplified2Keyword = {
  如果: Keyword.if,
  又如果: Keyword.elif,
  否则: Keyword.else,
  对象: Keyword.object,
  每当: Keyword.while,
  函数: Keyword.func,
  方法: Keyword.method,
  中断: Keyword.break,
  继续: Keyword.continue,
  返回: Keyword.return,
  自己: Keyword.self,
  _: Keyword.discard,
  真值: Keyword.true,
  假值: Keyword.false,
  未定义: Keyword.undefined,
  空值: Keyword.null,
}

export function isKeyword(identifier: string): boolean {
  return Boolean(en2Keyword[identifier]) || Boolean(hanSimplified2Keyword[identifier])
}

export function parseKeyword(identifier: string): Keyword | undefined {
  return en2Keyword[identifier] ?? hanSimplified2Keyword[identifier]
}

export type IndependentTokenType = TokenType.dot | TokenType.eof | TokenType.vBar | TokenType.lbracket | TokenType.rbracket | TokenType.colon | TokenType.comma | TokenType.init | TokenType.lParen | TokenType.rParen

export type Token = ({
  type: IndependentTokenType
} | {
  type: TokenType.id
  lexeme: string | Keyword
} | {
  type: TokenType.string
  lexeme: string
} | {
  type: TokenType.operator
  operator: Op
} | {
  type: TokenType.number
  lexeme: string
}
) & {
  line: number
  pos: number
}

export enum Op {
  plus = "+",
  minus = "-",
  times = "*",
  divide = "/",
  modulo = "%",
  eq = "==",
  neq = "!=",
  gt = ">",
  lt = "<",
  gte = ">=",
  lte = "<=",
  plusAssign = "+=",
  minusAssign = "-=",
  timesAssign = "*=",
  divideAssign = "/=",
  moduloAssign = "%=",
  assign = "=",
}

export function isAssign(op: Op): boolean {
  return op === Op.assign
    || op === Op.plusAssign
    || op === Op.minusAssign
    || op === Op.timesAssign
    || op === Op.divideAssign
    || op === Op.moduloAssign
}
