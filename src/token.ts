export const enum TokenType {
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
