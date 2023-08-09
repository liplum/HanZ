import { DeclType, HzFuncDecl, HzObjDecl,HzVarDecl } from "./declaration.js"
import { ExprType, HzExpr } from "./expr.js"
import { LiteralType } from "./literal.js"
import { HzBreakStatmt, HzContinueStatmt, HzExprStatmt, HzIfStatmt, HzReturnStatmt, HzStatmt, HzVarDeclStatmt, HzWhileStatmt, StatmtType } from "./statement.js"
import { Keyword, Operator, Token, TokenType } from "./token.js"

export type TopLevel = HzObjDecl | HzFuncDecl | HzExprStatmt

export function parser(tokens: Token[]) {
  let pos = 0
  const topLevels: TopLevel[] = []
  while (pos < tokens.length) {
    const topLevel = parseTopLevel()
    topLevels.push(topLevel)
  }
  return topLevels

  function parseTopLevel(): TopLevel {
    const t = peek()
    if (t.type === TokenType.keyword) {
      if (t.keyword === Keyword.object) {
        return parseObjectDecl()
      } else if (t.keyword === Keyword.func) {
        return parseFuncDecl()
      }
      throw new ParseError(`Unexpected Keyword '${t.keyword}'`, t)
    } else {
      return parseExprStatmt()
    }
  }

  function parseBlock(): HzStatmt[] {
    // consume "["
    if (!tryConsume(TokenType.lbracket)) {
      throw new ParseError("Expect '['", peek())
    }
    const all: HzStatmt[] = []
    while (peek().type !== TokenType.rbracket) {
      const statmt = parseStatmt()
      all.push(statmt)
    }
    // consume "]"
    advance()
    return all
  }
  function parseExprStatmt(): HzExprStatmt {
    const expr = parseExpr()
    if (!tryConsume(TokenType.dot)) {
      throw new ParseError("Expect '.' to end expr", peek())
    }
    return { type: StatmtType.expr, expr }
  }
  function parseExpr(): HzExpr {
    // TODO:
    return { type: ExprType.literal, value: { type: LiteralType.string, value: "" } }
  }

  function parseStatmt(): HzStatmt {
    const t = peek()
    if (t.type === TokenType.vBar) {
      // var declaration
      return parseVarDeclStatmt()
    } else if (t.type === TokenType.keyword) {
      // if, while, return, break, continue
      if (t.keyword === Keyword.if) {
        return parseIfStatmt()
      } else if (t.keyword === Keyword.while) {
        return parseWhileStatmt()
      } else if (t.keyword === Keyword.return) {
        return parseReturnStatmt()
      } else if (t.keyword === Keyword.break) {
        return parseBreakStatmt()
      } else if (t.keyword === Keyword.continue) {
        return parseContinueStatmt()
      }
    } else {
      return parseExprStatmt()
    }
    throw new ParseError("Unrecognized Statement", t)
  }

  function parseReturnStatmt(): HzReturnStatmt {
    // consume `return`
    if (!tryConsume(TokenType.keyword, Keyword.return)) {
      throw new ParseError("Expect 'return'", peek())
    }
    const value = parseExpr()
    if (!tryConsume(TokenType.dot)) {
      throw new ParseError("Expect '.' to end 'return'", peek())
    }
    return { type: StatmtType.return, value }
  }
  function parseBreakStatmt(): HzBreakStatmt {
    // consume `break`
    if (!tryConsume(TokenType.keyword, Keyword.break)) {
      throw new ParseError("Expect 'break'", peek())
    }
    if (!tryConsume(TokenType.dot)) {
      throw new ParseError("Expect '.' after 'break'", peek())
    }
    return { type: StatmtType.break }
  }
  function parseContinueStatmt(): HzContinueStatmt {
    // consume `continue`
    if (!tryConsume(TokenType.keyword, Keyword.continue)) {
      throw new ParseError("Expect 'continue'", peek())
    }
    if (!tryConsume(TokenType.dot)) {
      throw new ParseError("Expect '.' after 'continue'", peek())
    }
    return { type: StatmtType.continue }
  }
  function parseIfStatmt(): HzIfStatmt {
    // consume `if`
    if (!tryConsume(TokenType.keyword, Keyword.if)) {
      throw new ParseError("Expect 'if'", peek())
    }
    const condition = parseExpr()
    const consequent = parseBlock()
    let alternate: HzStatmt[] | undefined
    // if it has the `else` branch
    if (tryConsume(TokenType.keyword, Keyword.else)) {
      alternate = parseBlock()
    }
    return { type: StatmtType.if, condition, consequent, alternate }
  }
  function parseWhileStatmt(): HzWhileStatmt {
    // consume `while`
    if (!tryConsume(TokenType.keyword, Keyword.while)) {
      throw new ParseError("Expect 'while'", peek())
    }
    const statmt: Partial<HzWhileStatmt> = { type: StatmtType.while }
    statmt.condition = parseExpr()
    statmt.body = parseBlock()
    return statmt as HzWhileStatmt
  }

  function parseObjectDecl(): HzObjDecl {
    if (!tryConsume(TokenType.keyword, Keyword.object)) {
      throw new ParseError("Expect 'object'", peek())
    }
    const nameToken = advance()
    if (nameToken.type !== TokenType.identifier) {
      throw new ParseError("Expect identifier after 'func'", nameToken)
    }
    const name = nameToken.lexeme
    return { type: DeclType.obj, name, fields: [], methods: [] }
  }

  function parseVarDecl(): HzVarDecl {
    // consume `|`
    advance()
    const vars: string[] = []
    while (peek().type !== TokenType.vBar) {
      const t = advance()
      if (t.type === TokenType.identifier) {
        // var name
        vars.push(t.lexeme)
      }
    }
    return { type: DeclType.var, vars }
  }

  function parseVarDeclStatmt(): HzVarDeclStatmt {
    const declare = parseVarDecl()
    return { type: StatmtType.varDecl, declare }
  }

  function parseFuncDecl(): HzFuncDecl {
    if (!tryConsume(TokenType.keyword, Keyword.func)) {
      throw new ParseError("Expect 'func'", peek())
    }

    return { type: DeclType.func, name: "", params: [], body: [] }
  }

  function advance(): Token {
    pos++
    return tokens[pos - 1]
  }
  function peek(): Token {
    return tokens[pos]
  }
  // overloading
  function tryConsume(expected: TokenType): boolean
  function tryConsume(expected: TokenType.keyword, value: Keyword): boolean
  function tryConsume(expected: TokenType.identifier, value: string): boolean
  function tryConsume(expected: TokenType.operator, value: Operator): boolean
  function tryConsume(expected: TokenType, value?: string | Keyword | Operator): boolean {
    const t = peek()
    if (t === undefined) return false
    if (t.type != expected) return false
    if (t.type === TokenType.keyword && t.keyword !== value) return false
    if (t.type === TokenType.identifier && t.lexeme !== value) return false
    if (t.type === TokenType.operator && t.operator !== value) return false
    pos++
    return true
  }
  function isAtEnd(): boolean {
    return pos >= tokens.length
  }
}

export class ParseError extends Error {
  token: Token
  constructor(message: string, token: Token) {
    super(message)
    this.name = this.constructor.name
    this.token = token
  }
}
