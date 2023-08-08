export const enum TokenType {
  number,
  string,
  keyword,
  identifier,
  indent,
  newLine,
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
}

export const enum Keyword {
  if,
  object,
  while,
  until,
  func,
  break,
  continue,
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
}
) & {
  line: number
  column: number
  pos: number
}
