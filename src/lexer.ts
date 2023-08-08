// lexer.ts

import { TokenType, Keyword, Token } from "./token"

export function lex(source: string) {
  let pos = -1
  let line = 0
  let column = 0
  const tokens: Token[] = []
  while (pos < source.length) {
    const token = scan()
    if (token) {
      tokens.push(token)
    }
  }
  return tokens

  function scan(): Token | undefined {
    const c = advance()
    if (c === "+") {
      if (tryConsume("=")) return $op(TokenType.plusAssign)
      else return $op(TokenType.plus)
    } else if (c === "-") {
      if (tryConsume("=")) return $op(TokenType.minusAssign)
      else return $op(TokenType.minus)
    } else if (c === "*") {
      if (tryConsume("=")) return $op(TokenType.timesAssign)
      else return $op(TokenType.times)
    } else if (c === "/") {
      if (tryConsume("=")) return $op(TokenType.divideAssign)
      else return $op(TokenType.divide)
    } else if (c === "%") {
      if (tryConsume("=")) return $op(TokenType.moduloAssign)
      else return $op(TokenType.modulo)
    } else if (c === "=") {
      if (tryConsume("=")) return $op(TokenType.equal)
      else return $op(TokenType.assign)
    }
  }

  function $str(value: string): Token {
    return { type: TokenType.string, lexeme: value, line, pos, column }
  }

  function $keyword(keyword: Keyword): Token {
    return { type: TokenType.keyword, lexeme: keyword, line, pos, column }
  }

  function $op(operator: TokenType): Token {
    return { type: operator, lexeme: operator.toString(), line, pos, column }
  }


  function advance(): string {
    pos++
    return source[pos - 1]
  }
  function peek(): string {
    return source[pos] ?? "\u0000"
  }
  function tryConsume(expected: string): boolean {
    if (peek() != expected) {
      return false
    }
    pos++
    return true
  }
}
