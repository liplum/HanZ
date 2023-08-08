// lexer.ts
import { TokenType, Keyword, Token, parseKeyword } from "./token.js"

function isDigitChar(code: number): boolean {
  // ASCII codes for '0' to '9'
  return code >= 48 && code <= 57
}

function isValidIdentifierChar(code: number): boolean {
  return (
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    code === 95 || // _
    code === 24 || // $
    (code >= 48 && code <= 57) || // 0-9
    (code >= 128 && code <= 1114111) // Unicode characters beyond ASCII
  ) && code !== 0x7684 // "的" is kept for member access
}

function isQuote(code: number): boolean {
  return code === 34 || code == 0x201C || code == 0x201D
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
    const code = peekCode()
    if (code === 35) { // "#"
      ignoreComment()
      return
    } else if (code === 43) { // "+"
      advance()
      if (tryConsumeCode(61)) return $op(TokenType.plusAssign) // "="
      else if (tryConsumeCode(43)) return $op(TokenType.increase) // "+"
      else return $op(TokenType.plus)
    } else if (code === 45) { // "-"
      advance()
      if (tryConsumeCode(61)) return $op(TokenType.minusAssign) // "="
      else if (tryConsumeCode(45)) return $op(TokenType.decrease) // "-"
      else return $op(TokenType.minus)
    } else if (code === 42) { // "*"
      advance()
      if (tryConsumeCode(61)) return $op(TokenType.timesAssign) // "="
      else return $op(TokenType.times) // *
    } else if (code === 47) { // "/"
      advance()
      if (tryConsumeCode(61)) return $op(TokenType.divideAssign) // "="
      else return $op(TokenType.divide)
    } else if (code === 37) { // "%"
      advance()
      if (tryConsumeCode(61)) return $op(TokenType.moduloAssign) // "="
      else return $op(TokenType.modulo)
    } else if (code === 61) { // "="
      advance()
      if (tryConsumeCode(61)) return $op(TokenType.equal) // "="
      else return $op(TokenType.assign)
    } else if (isDigitChar(code)) {
      return scanNumber()
    } else if (isQuote(code)) { // `"`, left/right double quotation mark
      return scanString()
    } else if (code === 10) { // "\n"
      advance()
      const token: Token = { type: TokenType.newLine, line, pos, column }
      line++
      column = 0
      return token
    } else if (code === 58 || code === 0xFF1A) { // ":", Fullwidth Colon
      advance()
      if (tryConsumeCode(61)) return $op(TokenType.init)
      else $op(TokenType.colon)
    } else if (code === 124 || code === 0xFF5C) { // "|", Fullwidth Vertical Line
      advance()
      return $op(TokenType.vBar)
    } else if (code === 46 || code === 0x7684) { // ".", "的"
      advance()
      return $op(TokenType.memberAccess)
    } else if (isValidIdentifierChar(code)) {
      return scanIdentifier()
    } else if (column === 0 && code === 32) { // " "
      return scanIndent()
    } else {
      advance()
    }
  }

  function ignoreComment(): void {
    while (peekCode() != 10 && !isAtEnd()) { // "/n"
      advance()
    }
  }

  function scanIdentifier(): Token {
    const chars: string[] = []
    while (isValidIdentifierChar(peekCode())) {
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
    while (isDigitChar(peekCode())) {
      advance()
    }
    // "."
    if (peekCode() == 0x002E && isDigitChar(peekNextCode())) {
      // go over dot
      advance()
      while (isDigitChar(peekCode())) {
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
        default: throw $err(`Invalid escape sequence: \\${char}, code=${char}`)
      }

    }
    // Consume staring quote
    advance()
    const chars: string[] = []
    while (!isQuote(peekCode())) {
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

  function $indent(size: number): Token {
    return { type: TokenType.indent, size, line, pos, column }
  }

  function $num(value: string): Token {
    return { type: TokenType.number, lexeme: value, line, pos, column }
  }

  function $str(lexeme: string): Token {
    return { type: TokenType.string, lexeme, line, pos, column }
  }

  function $keyword(lexeme: Keyword): Token {
    return { type: TokenType.keyword, lexeme, line, pos, column }
  }

  function $op(operator: TokenType): Token {
    return { type: operator, lexeme: operator, line, pos, column }
  }

  function $identifier(lexeme: string): Token {
    return { type: TokenType.identifier, lexeme, line, pos, column }
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
  function peekCode(): number {
    return source[pos]?.charCodeAt(0) ?? 0
  }
  function peekNextCode(): number {
    return source[pos + 1]?.charCodeAt(0) ?? 0
  }
  function tryConsumeCode(expected: number): boolean {
    if (peekCode() != expected) {
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
