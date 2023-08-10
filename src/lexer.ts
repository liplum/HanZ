// lexer.ts
import { TokenType, Keyword, Token, parseKeyword, Operator, IndependentTokenType, mapIdentifier } from "./token.js"

function isDigitChar(code: number): boolean {
  // ASCII codes for '0' to '9'
  return code >= 48 && code <= 57
}

function isValidIdentifierChar(char: string): boolean {
  return /\p{ID_Continue}/u.test(char)
}

function isQuote(code: number): boolean {
  return code === 34 || code == 0x201C || code == 0x201D
}

export function lex(source: string) {
  let pos = 0
  let line = 0
  const tokens: Token[] = []
  while (pos < source.length) {
    scan()
  }
  tokens.push({ type: TokenType.eof, pos, line })
  return tokens

  function scan(): void {
    const char = peek()
    const code = char.charCodeAt(0)
    if (code === 32 || code === 9 || code === 10) { // " ", "\t", "\n"
      advance()
      if (code === 10) {
        line++
      }
    } else if (code === 91 || code === 0x3010) { // "[", "【"
      advance()
      tokens.push($token(TokenType.lbracket))
    } else if (code === 93 || code === 0x3011) { // "]", "】"
      advance()
      tokens.push($token(TokenType.rbracket))
    } else if (code === 46 || code === 0x3002) { // ".", "。"
      advance()
      tokens.push($dot())
    } else if (code === 44 || code === 0xFF0C) { // comma, Fullwidth comma
      tokens.push($token(TokenType.comma))
    } else if (code === 43) { // "+"
      advance()
      if (tryConsumeCode(61)) tokens.push($op(Operator.plusAssign)) // "="
      else tokens.push($op(Operator.plus))
    } else if (code === 45) { // "-"
      advance()
      if (tryConsumeCode(61)) tokens.push($op(Operator.minusAssign)) // "="
      else tokens.push($op(Operator.minus))
    } else if (code === 42) { // "*"
      advance()
      if (tryConsumeCode(61)) tokens.push($op(Operator.timesAssign)) // "="
      else tokens.push($op(Operator.times)) // *
    } else if (code === 47) { // "/"
      advance()
      if (tryConsumeCode(61)) tokens.push($op(Operator.divideAssign)) // "="
      else if (tryConsumeCode(47)) ignoreComment()
      else tokens.push($op(Operator.divide))
    } else if (code === 37) { // "%"
      advance()
      if (tryConsumeCode(61)) tokens.push($op(Operator.moduloAssign)) // "="
      else tokens.push($op(Operator.modulo))
    } else if (code === 61) { // "="
      advance()
      if (tryConsumeCode(61)) tokens.push($op(Operator.eq)) // "="
      else tokens.push($op(Operator.assign))
    } else if (isDigitChar(code)) {
      scanNumber()
    } else if (isQuote(code)) { // `"`, left/right double quotation mark
      scanString()
    } else if (code === 58 || code === 0xFF1A) { // ":", Fullwidth Colon
      advance()
      if (tryConsumeCode(61)) tokens.push($token(TokenType.init)) // "="
      else tokens.push($token(TokenType.colon))
    } else if (code === 124 || code === 0xFF5C) { // "|", Fullwidth Vertical Line
      advance()
      tokens.push($token(TokenType.vBar))
    } else if (isValidIdentifierChar(char)) {
      scanIdentifier()
    } else {
      throw $err(`Unrecognized character '${char}'[${code}]`)
    }
  }

  function ignoreComment(): void {
    while (peekCode() != 10 && !isAtEnd()) { // "/n"
      advance()
    }
  }

  function scanIdentifier(): void {
    const chars: string[] = []
    const initial = advance()
    chars.push(initial)
    while (isValidIdentifierChar(peek())) {
      const char = advance()
      chars.push(char)
    }
    let identifier = chars.join("")
    const keyword = parseKeyword(identifier)
    if (keyword) {
      tokens.push($keyword(keyword))
    } else {
      identifier = mapIdentifier(identifier)
      tokens.push($identifier(identifier))
    }
  }

  function scanNumber(): void {
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
    tokens.push($num(source.substring(start, pos)))
  }

  function scanString(): void {
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
    tokens.push($str(chars.join("")))
  }

  function $err(msg: string) {
    return new LexError(msg, line, pos)
  }

  function $num(value: string): Token {
    return { type: TokenType.number, lexeme: value, line, pos }
  }

  function $str(lexeme: string): Token {
    return { type: TokenType.string, lexeme, line, pos }
  }

  function $keyword(keyword: Keyword): Token {
    return { type: TokenType.keyword, keyword, line, pos }
  }

  function $token(type: IndependentTokenType): Token {
    return { type, line, pos }
  }

  function $op(operator: Operator): Token {
    return { type: TokenType.operator, operator: operator, line, pos }
  }

  function $identifier(lexeme: string): Token {
    return { type: TokenType.identifier, lexeme, line, pos }
  }

  function $dot(): Token {
    return { type: TokenType.dot, line, pos }
  }

  function advance(): string {
    pos++
    return source[pos - 1]
  }
  function peek(): string {
    return source[pos] ?? "\0"
  }
  function peekNext(): string {
    return source[pos + 1] ?? "\0"
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

  constructor(message: string, line: number, pos: number) {
    super(message)
    this.name = this.constructor.name
    this.line = line
    this.pos = pos
  }
}
