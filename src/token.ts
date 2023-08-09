export enum TokenType {
  number = "number",
  string = "string",
  keyword = "keyword",
  identifier = "identifier",
  operator = "operator",
  discard = "discard",
  eof = "eof",
  dot = ".",
  vBar = "|",
  colon = ":",
  comma = ",",
  lbracket = "[",
  rbracket = "]",
}

export enum Keyword {
  if = "if",
  else = "else",
  elif = "elif",
  object = "object",
  while = "while",
  func = "func",
  break = "break",
  continue = "continue",
  self = "self",
  return = "return",
}

export const en2Keyword = {
  if: Keyword.if,
  else: Keyword.else,
  elif: Keyword.elif,
  object: Keyword.object,
  while: Keyword.while,
  func: Keyword.func,
  break: Keyword.break,
  continue: Keyword.continue,
  self: Keyword.self,
  return: Keyword.return,
}

export const hanSimplified2Keyword = {
  如果: Keyword.if,
  否则: Keyword.else,
  又如果: Keyword.elif,
  对象: Keyword.object,
  当: Keyword.while,
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

export type IndependentTokenType = TokenType.dot | TokenType.eof | TokenType.vBar | TokenType.lbracket | TokenType.rbracket | TokenType.colon | TokenType.comma | TokenType.discard

export type Token = ({
  type: IndependentTokenType
} | {
  type: TokenType.keyword
  keyword: Keyword
} | {
  type: TokenType.identifier
  lexeme: string
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

export enum BinaryOp {
  plus = "+",
  minus = "-",
  times = "*",
  divide = "/",
  modulo = "%",
  equal = "==",
  gt = ">",
  lt = "<",
  gte = ">=",
  lte = "<=",
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

export type Operator = UnaryOp | BinaryOp | AssignOp