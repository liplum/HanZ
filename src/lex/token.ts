export enum TokenType {
  number = "number",
  string = "string",
  keyword = "keyword",
  identifier = "identifier",
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
}

export enum SoftKeyword {
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
}

export const hanSimplified2Identifier = {
  自己: SoftKeyword.self,
  真值: SoftKeyword.true,
  假值: SoftKeyword.false,
  未定义: SoftKeyword.undefined,
  空值: SoftKeyword.null,
}

export function isKeyword(identifier: string): boolean {
  return Boolean(en2Keyword[identifier]) || Boolean(hanSimplified2Keyword[identifier])
}

export function mapIdentifier(identifier: string): string {
  return hanSimplified2Identifier[identifier] ?? identifier
}

export function parseKeyword(identifier: string): Keyword | undefined {
  return en2Keyword[identifier] ?? hanSimplified2Keyword[identifier]
}

export type IndependentTokenType = TokenType.dot | TokenType.eof | TokenType.vBar | TokenType.lbracket | TokenType.rbracket | TokenType.colon | TokenType.comma | TokenType.init | TokenType.lParen | TokenType.rParen

export type Token = ({
  type: IndependentTokenType
} | {
  type: TokenType.keyword
  keyword: Keyword
} | {
  type: TokenType.identifier
  lexeme: string | SoftKeyword
} | {
  type: TokenType.string
  lexeme: string
} | {
  type: TokenType.operator
  operator: Operator
} | {
  type: TokenType.number
  lexeme: string
}
) & {
  line: number
  pos: number
}

export enum Operator {
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

export function isAssign(op: Operator): boolean {
  return op === Operator.assign
    || op === Operator.plusAssign
    || op === Operator.minusAssign
    || op === Operator.timesAssign
    || op === Operator.divideAssign
    || op === Operator.moduloAssign
}
