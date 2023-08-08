// lexer.ts
import { TokenType, Keyword, Token, parseKeyword } from "./token.js"

function isDigit(char: string): boolean {
  const code = char.charCodeAt(0)
  // ASCII codes for '0' to '9'
  return code >= 48 && code <= 57
}

function isValidIdentifierChar(char: string): boolean {
  const code = char.charCodeAt(0)
  return (
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    code === 95 || // _
    (code >= 48 && code <= 57) || // 0-9
    (code >= 128 && code <= 1114111) // Unicode characters beyond ASCII
  )
}

export function lex(source: string) {
  let pos = 0
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
    const c = peek()
    if (c === "+") {
      advance()
      if (tryConsume("=")) return $op(TokenType.plusAssign)
      else if (tryConsume("+")) return $op(TokenType.increase)
      else return $op(TokenType.plus)
    } else if (c === "-") {
      advance()
      if (tryConsume("=")) return $op(TokenType.minusAssign)
      else if (tryConsume("-")) return $op(TokenType.decrease)
      else return $op(TokenType.minus)
    } else if (c === "*") {
      advance()
      if (tryConsume("=")) return $op(TokenType.timesAssign)
      else return $op(TokenType.times)
    } else if (c === "/") {
      advance()
      if (tryConsume("=")) return $op(TokenType.divideAssign)
      else return $op(TokenType.divide)
    } else if (c === "%") {
      advance()
      if (tryConsume("=")) return $op(TokenType.moduloAssign)
      else return $op(TokenType.modulo)
    } else if (c === "=") {
      advance()
      if (tryConsume("=")) return $op(TokenType.equal)
      else return $op(TokenType.assign)
    } else if (isDigit(c)) {
      return scanNumber()
    } else if (c === `"`) {
      return scanString()
    } else if (c == "\n") {
      advance()
      const token: Token = { type: TokenType.newLine, line, pos, column }
      line++
      column = 0
      return token
    } else if (c == ":") {
      advance()
      if (tryConsume("=")) return $op(TokenType.init)
      else throw $err("TODO")
    } else if (c == "|") {
      advance()
      return $op(TokenType.vBar)
    } else if (isValidIdentifierChar(c)) {
      return scanIdentifier()
    } else if (column == 0 && c === " ") {
      return scanIndent()
    } else {
      advance()
    }
  }

  function scanIdentifier(): Token {
    const chars: string[] = []
    while (isValidIdentifierChar(peek())) {
      const char = advance()
      chars.push(char)
    }
    const id = chars.join("")
    const keyword = parseKeyword(id)
    if (keyword) return $keyword(keyword)
    else return $identifier(id)
  }

  function scanNumber(): Token {
    const start = pos
    while (isDigit(peek())) {
      advance()
    }
    if (peek() == "." && isDigit(peekNext())) {
      // go over dot
      advance()
      while (isDigit(peek())) {
        advance()
      }
    }
    return $num(source.substring(start, pos))
  }

  function scanString(): Token {
    function scanEscape(): string {
      const char = advance()
      switch (char) {
        case "n": return "\n"
        case "r": return "\r"
        case "t": return "\t"
        case "\"": return "\""
        case "\\": return "\\"
        case "b": return "\b"
        case "f": return "\b"
        default: throw $err(`Invalid escape sequence: \\${char}, code=${char.charCodeAt(0)}`)
      }

    }
    // Consume staring quote
    advance()
    const chars: string[] = []
    while (peek() != "\"") {
      const char = advance()
      if (char === "\\") {
        const escapedChar = scanEscape()
        chars.push(escapedChar)
      } else {
        chars.push(char)
      }
    }
    if (isAtEnd()) {
      throw $err("Unterminated string")
    }
    // Consume closing quote
    advance()
    return $str(chars.join(""))
  }

  function scanIndent(): Token {
    let indent = 1
    while (peek() == " ") {
      advance()
      indent++
    }
    return $indent(indent)
  }

  function $err(msg: string) {
    return new LexError(msg, line, column, pos)
  }

  function $indent(value: number): Token {
    return { type: TokenType.indent, lexeme: value, line, pos, column }
  }

  function $num(value: string): Token {
    return { type: TokenType.number, lexeme: value, line, pos, column }
  }

  function $str(value: string): Token {
    return { type: TokenType.string, lexeme: value, line, pos, column }
  }

  function $keyword(keyword: Keyword): Token {
    return { type: TokenType.keyword, lexeme: keyword, line, pos, column }
  }

  function $op(operator: TokenType): Token {
    return { type: operator, lexeme: operator, line, pos, column }
  }

  function $identifier(name: string): Token {
    return { type: TokenType.identifier, lexeme: name, line, pos, column }
  }

  function advance(): string {
    pos++
    column++
    return source[pos - 1]
  }
  function peek(): string {
    return source[pos] ?? "\u0000"
  }
  function peekNext(): string {
    return source[pos + 1] ?? "\u0000"
  }
  function tryConsume(expected: string): boolean {
    if (peek() != expected) {
      return false
    }
    pos++
    return true
  }
  function isAtEnd(): boolean {
    return pos >= source.length
  }
}

export class LexError extends Error {
  line: number
  column: number
  pos: number
  constructor(message: string, line: number, column: number, pos: number) {
    super(message)
    this.name = this.constructor.name
    this.line = line
    this.column = column
    this.pos = pos
  }
}
