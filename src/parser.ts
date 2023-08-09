import { DeclType, HzFuncDecl, HzObjDecl } from "./declaration.js"
import { ExprType, HzExpr } from "./expr.js"
import { LiteralType } from "./literal.js"
import { HzIfStatmt, HzUntilStatmt, HzWhileStatmt, StatmtType } from "./statement.js"
import { Keyword, Token, TokenType } from "./token.js"

export function parser(tokens: Token[]) {
  let pos = 0

  function parse() {
    const t = peek()
    if (t === undefined) return
    if (t.type === TokenType.keyword) {
      if (t.lexeme === Keyword.object) {
        return parseObjectDecl()
      } else if (t.lexeme === Keyword.func) {
        return parseFuncDecl()
      } else if (t.lexeme === Keyword.if) {
        return parseIf()
      } else if (t.lexeme === Keyword.while) {
        return parseWhile()
      } else if (t.lexeme === Keyword.until) {
        return parseUntil()
      }
    }
  }

  function parseExpr(): HzExpr {
    // TODO:
    return { type: ExprType.literal, value: { type: LiteralType.string, value: "" } }
  }

  function parseIf(): HzIfStatmt | undefined {
    // consume `if`
    advance()
    const condition = parseExpr()
    tryConsume(TokenType.newLine)
    return
  }
  function parseWhile(): HzWhileStatmt | undefined {
    return
  }
  function parseUntil(): HzUntilStatmt | undefined {
    return

  }
  function parseObjectDecl(): HzObjDecl | undefined {
    return
  }

  function parseVarDecl() {

  }

  function parseFuncDecl(): HzFuncDecl {
    return { type: DeclType.func, name: "", params: [], body: [] }
  }

  function advance(): Token {
    pos++
    return tokens[pos - 1]
  }
  function peek(): Token | undefined {
    return tokens[pos]
  }
  function peekNext(): Token | undefined {
    return tokens[pos + 1]
  }
  function tryConsume(expected: TokenType): boolean {
    if (peek()?.type != expected) {
      return false
    }
    pos++
    return true
  }
  function isAtEnd(): boolean {
    return pos >= tokens.length
  }
}
