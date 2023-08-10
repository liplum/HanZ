import { DeclType, HzFuncDecl, HzFuncSignaturePart, HzObjDecl, HzVarDecl } from "./declaration.js"
import { ExprType, HzFuncCallExpr, HzCallPart, HzExpr } from "./expr.js"
import { LiteralType } from "./literal.js"
import { HzBreakStatmt, HzContinueStatmt, HzExprStatmt, HzIfStatmt, HzInitStatmt, HzReturnStatmt, HzStatmt, HzVarDeclStatmt, HzWhileStatmt, StatmtType } from "./statement.js"
import { Keyword, Operator as Op, SpecialIdentifier, Token, TokenType, isAssign } from "./token.js"

export type TopLevel = HzObjDecl | HzFuncDecl | HzExprStatmt | HzInitStatmt

const opPrecedences = {
  [Op.plus]: 2,
  [Op.minus]: 2,

  [Op.times]: 4,
  [Op.divide]: 4,
  [Op.modulo]: 4,

  [Op.lt]: 6,
  [Op.lte]: 6,
  [Op.gt]: 6,
  [Op.gte]: 6,

  [Op.eq]: 7,
  [Op.neq]: 7,

  [Op.assign]: 14,
  [Op.plusAssign]: 14,
  [Op.minusAssign]: 14,
  [Op.timesAssign]: 14,
  [Op.divideAssign]: 14,
  [Op.moduloAssign]: 14,
}

export function isLvalue(expr: HzExpr): boolean {
  return expr.type === ExprType.var
}

export function parse(tokens: Token[]) {
  let pos = 0
  const topLevels: TopLevel[] = []
  while (peek().type !== TokenType.eof) {
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
    } else if (t.type === TokenType.identifier && peekNext()?.type === TokenType.init) {
      return parseInitStatmt()
    } else {
      return parseExprStatmt()
    }
  }

  function parseBlock(): HzStatmt[] {
    if (!tryConsume(TokenType.lbracket)) {
      throw new ParseError("Expect '['", peek())
    }
    const all: HzStatmt[] = []
    while (peek().type !== TokenType.rbracket) {
      const statmt = parseStatmt()
      all.push(statmt)
    }
    if (!tryConsume(TokenType.rbracket)) {
      throw new ParseError("Expect ']'", peek())
    }
    return all
  }

  function parseInitStatmt(): HzInitStatmt {
    const nameToken = advance()
    if (nameToken.type !== TokenType.identifier) {
      throw new ParseError("Expect identifier", nameToken)
    }
    if (!tryConsume(TokenType.init)) {
      throw new ParseError("Expect ':='", peek())
    }
    const value = parseExpr()
    if (!tryConsume(TokenType.dot)) {
      throw new ParseError("Expect '.' to end 'init'", peek())
    }
    return { type: StatmtType.init, name: nameToken.lexeme, value }
  }

  function parseExprStatmt(): HzExprStatmt {
    const expr = parseExpr()
    if (!tryConsume(TokenType.dot)) {
      throw new ParseError("Expect '.' to end expr", peek())
    }
    return { type: StatmtType.expr, expr }
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
    } else if (t.type === TokenType.identifier && peekNext()?.type === TokenType.init) {
      return parseInitStatmt()
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
      throw new ParseError("Expect identifier after 'object'", nameToken)
    }
    const name = nameToken.lexeme
    if (!tryConsume(TokenType.lbracket)) {
      throw new ParseError("Expect '[' to start object declaration", peek())
    }
    const fields: HzVarDecl[] = []
    const methods: HzFuncDecl[] = []
    const ctors: HzFuncDecl[] = []
    while (peek().type !== TokenType.rbracket) {
      const t = peek()
      if (t.type === TokenType.vBar) {
        const field = parseVarDecl()
        fields.push(field)
      } else if (t.type === TokenType.keyword && t.keyword === Keyword.func) {
        const method = parseFuncDecl()
        methods.push(method)
      } else if (t.type === TokenType.identifier && t.lexeme === name) {
        const ctor = parseCtorDecl()
        ctors.push(ctor)
      } else {
        throw new ParseError("Unrecognized token in object declaration", t)
      }
    }
    if (!tryConsume(TokenType.rbracket)) {
      throw new ParseError("Expect ']' to end object declaration", peek())
    }
    return { type: DeclType.obj, name, ctors, fields, methods }

    function parseCtorDecl(): HzFuncDecl {
      if (!tryConsume(TokenType.identifier, name)) {
        throw new ParseError("Expect 'func'", peek())
      }
      const selectors = parseFuncSelectors()
      const body = parseBlock()
      if (Array.isArray(selectors)) {
        return { type: DeclType.func, parts: selectors, body }
      } else {
        return { type: DeclType.func, selector: selectors.selector, body }
      }
    }
  }

  function parseVarDecl(): HzVarDecl {
    if (!tryConsume(TokenType.vBar)) {
      throw new ParseError("Expect '|' to start variable declaration", peek())
    }
    const vars: string[] = []
    while (peek().type !== TokenType.vBar) {
      const t = advance()
      if (t.type === TokenType.identifier) {
        // var name
        vars.push(t.lexeme)
      }
    }
    if (!tryConsume(TokenType.vBar)) {
      throw new ParseError("Expect '|' to end variable declaration", peek())
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
    const selectors = parseFuncSelectors()
    const body = parseBlock()
    if (Array.isArray(selectors)) {
      return { type: DeclType.func, parts: selectors, body }
    } else {
      return { type: DeclType.func, selector: selectors.selector, body }
    }
  }

  function parseFuncSelectors(): HzFuncSignaturePart[] | { selector: string } {
    const parts: HzFuncSignaturePart[] = []
    do {
      const selector = advance()
      if (selector.type !== TokenType.identifier) {
        throw new ParseError("Except selector", selector)
      }
      if (!tryConsume(TokenType.colon)) {
        if (parts.length === 0) {
          // nullary
          return { selector: selector.lexeme }
        } else {
          throw new ParseError("Expect ':' after first selector", peek())
        }
      }
      const param = advance()
      if (param.type !== TokenType.identifier) {
        throw new ParseError("Except parameter", param)
      }
      if (param.type === TokenType.identifier) {
        if (param.lexeme === SpecialIdentifier.discard) {
          parts.push({ selector: selector.lexeme })
        } else {
          parts.push({ selector: selector.lexeme, param: param.lexeme })
        }
      }
      // continue scanning if the next token is still an identifier.
    } while (peek().type === TokenType.identifier)
    return parts
  }

  function parseExpr(): HzExpr {
    let left = parsePrimary()
    for (; ;) {
      const opToken = peek()
      if (opToken.type !== TokenType.operator) break
      advance()
      if (isAssign(opToken.operator) && !isLvalue(left)) {
        throw new ParseError("Cannot assign a rvalue", opToken)
      }
      const precedence = opPrecedences[opToken.operator] ?? 0
      if (precedence === 0) break
      let right = parsePrimary(left)
      for (; ;) {
        const nextOpToken = peek()
        if (nextOpToken.type !== TokenType.operator) break
        const nextPrecedence = opPrecedences[nextOpToken.operator] ?? 0
        if (precedence >= nextPrecedence) {
          break
        }
        advance()
        const nextRight = parsePrimary(left, right)
        right = { type: ExprType.binary, left: right, op: nextOpToken.operator, right: nextRight }
      }
      left = { type: ExprType.binary, left, op: opToken.operator, right }
    }
    return left
  }

  function parsePrimary(left?: HzExpr, right?: HzExpr): HzExpr {
    const t = peek()
    if (t.type === TokenType.number) {
      advance()
      const value = { type: LiteralType.number, value: t.lexeme }
      return { type: ExprType.literal, value }
    } else if (t.type === TokenType.string) {
      advance()
      const value = { type: LiteralType.string, value: t.lexeme }
      return { type: ExprType.literal, value }
    } else if (t.type === TokenType.identifier) {
      const nextToken = peekNext()
      if (nextToken?.type === TokenType.identifier) {
        advance()
        // function call
        return parseFuncCallChainingExpr(left ?? { type: ExprType.var, var: t.lexeme })
      } else if (nextToken?.type === TokenType.colon) {
        // independent function call
        return parseFuncCallChainingExpr()
      } else {
        advance()
        return { type: ExprType.var, var: t.lexeme }
      }
    }
    throw new ParseError("Unrecognized primary token", t)
  }

  function parseFuncCallChainingExpr(caller?: HzExpr): HzFuncCallExpr {
    for (; ;) {
      caller = parseFuncCallExpr(caller)
      if (tryConsume(TokenType.comma)) {
        // method chaining
        continue
      }
      break
    }
    return caller
  }

  function parseFuncCallExpr(caller?: HzExpr): HzFuncCallExpr {
    const parts: HzCallPart[] = []
    do {
      const selector = peek()
      if (selector.type !== TokenType.identifier) {
        throw new ParseError("Expect selector", selector)
      }
      advance()
      if (!tryConsume(TokenType.colon)) {
        if (parts.length === 0) {
          // nullary
          return { type: ExprType.call, caller, selector: selector.lexeme }
        } else {
          throw new ParseError("Expect ':' after first selector", peek())
        }
      }
      const arg = parseExpr()
      parts.push({ selector: selector.lexeme, arg })
    } while (peek().type === TokenType.identifier)
    return { type: ExprType.call, caller, parts }
  }

  function advance(): Token {
    pos++
    return tokens[pos - 1]
  }

  function peek(): Token {
    return tokens[pos]
  }

  function peekNext(): Token | undefined {
    return tokens[pos + 1]
  }

  // overloading
  function tryConsume(expected: TokenType): boolean
  function tryConsume(expected: TokenType.keyword, value: Keyword): boolean
  function tryConsume(expected: TokenType.identifier, value: string): boolean
  function tryConsume(expected: TokenType.operator, value: Op): boolean
  function tryConsume(expected: TokenType, value?: string | Keyword | Op): boolean {
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