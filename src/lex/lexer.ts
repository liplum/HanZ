// lexer.ts
import { TokenType, Keyword, Token, parseKeyword, Op as Op, IndependentTokenType } from "./token.js"

function isDigitChar(code: number): boolean {
  // ASCII codes for '0' to '9'
  return code >= 48 && code <= 57
}

function isValidIdChar(char: string): boolean {
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
    } else if (code === 40 || code === 0xFF08) {//  "(", fullwidth right parentheses
      advance()
      tokens.push($token(TokenType.lParen))
    } else if (code === 41 || code === 0xFF09) { //  ")", fullwidth left parentheses
      advance()
      tokens.push($token(TokenType.rParen))
    } else if (code === 44 || code === 0xFF0C) { // ",", fullwidth comma
      advance()
      tokens.push($token(TokenType.comma))
    } else if (code === 43) { // "+"
      advance()
      if (tryConsumeCode(61)) tokens.push($op(Op.plusAssign)) // "="
      else tokens.push($op(Op.plus))
    } else if (code === 45) { // "-"
      advance()
      if (tryConsumeCode(61)) tokens.push($op(Op.minusAssign)) // "="
      else tokens.push($op(Op.minus))
    } else if (code === 42) { // "*"
      advance()
      if (tryConsumeCode(61)) tokens.push($op(Op.timesAssign)) // "="
      else tokens.push($op(Op.times)) // *
    } else if (code === 47) { // "/"
      advance()
      if (tryConsumeCode(61)) tokens.push($op(Op.divideAssign)) // "="
      else if (tryConsumeCode(47)) ignoreComment()
      else tokens.push($op(Op.divide))
    } else if (code === 37) { // "%"
      advance()
      if (tryConsumeCode(61)) tokens.push($op(Op.moduloAssign)) // "="
      else tokens.push($op(Op.modulo))
    } else if (code === 61) { // "="
      advance()
      if (tryConsumeCode(61)) tokens.push($op(Op.eq)) // "="
      else tokens.push($op(Op.assign))
    } else if (code === 60) { // "<"
      advance()
      if (tryConsumeCode(61)) tokens.push($op(Op.lte)) // "="
      else tokens.push($op(Op.lt))
    } else if (code === 62) { // ">"
      advance()
      if (tryConsumeCode(61)) tokens.push($op(Op.gte)) // "="
      else tokens.push($op(Op.gt))
    } else if (isDigitChar(code)) {
      scanNumber()
    } else if (isQuote(code)) { // `"`, left/right double quotation mark
      scanString()
    } else if (code === 58 || code === 0xFF1A) { // ":", fullwidth Colon
      advance()
      if (tryConsumeCode(61)) tokens.push($token(TokenType.init)) // "="
      else tokens.push($token(TokenType.colon))
    } else if (code === 124 || code === 0xFF5C) { // "|", fullwidth Vertical Line
      advance()
      tokens.push($token(TokenType.vBar))
    } else if (isValidIdChar(char)) {
      scanId()
    } else {
      throw $err(`Unrecognized character '${char}'[${code}]`)
    }
  }

  function ignoreComment(): void {
    while (peekCode() != 10 && !isAtEnd()) { // "/n"
      advance()
    }
  }

  function scanId(): void {
    const chars: string[] = []
    const initial = advance()
    chars.push(initial)
    while (isValidIdChar(peek())) {
      const char = advance()
      chars.push(char)
    }
    const identifier = chars.join("")
    const keyword = parseKeyword(identifier)
    if (keyword) {
      tokens.push($keyword(keyword))
    } else {
      tokens.push($id(identifier))
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
    return { type: TokenType.id, lexeme: keyword, line, pos }
  }

  function $token(type: IndependentTokenType): Token {
    return { type, line, pos }
  }

  function $op(operator: Op): Token {
    return { type: TokenType.operator, operator: operator, line, pos }
  }

  function $id(lexeme: string): Token {
    return { type: TokenType.id, lexeme, line, pos }
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
