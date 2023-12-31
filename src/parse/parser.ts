import { HzFuncDecl, HzNaryFuncDecl, HzNullaryFuncDecl, HzObjDecl, HzVarDecl, NaryFuncSelectorDecl } from "./declaration.js"
import { HzFuncCallExpr, HzNaryCallSelector, HzExpr, HzBinaryExpr, HzLiteralExpr, HzRefExpr, HzNullaryFuncCallExpr, HzNaryFuncCallExpr } from "./expr.js"
import { HzFileDef, TopLevel } from "./file.js"
import { HzLiteral, LiteralType } from "./literal.js"
import { HzBreakStatmt, HzCodeBlock, HzContinueStatmt, HzExprStatmt, HzIfStatmt, HzInitStatmt, HzReturnStatmt, HzStatmt, HzWhileStatmt } from "./statement.js"
import { Keyword, Op, Token, TokenType, isAssign } from "../lex/token.js"

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

export function parse(tokens: Token[]): HzFileDef {
  let pos = 0
  const topLevels: TopLevel[] = []
  while (peek().type !== TokenType.eof) {
    const topLevel = parseTopLevel()
    topLevels.push(topLevel)
  }
  return new HzFileDef(topLevels)

  function parseTopLevel(): TopLevel {
    const t = peek()
    if (t.type === TokenType.id) {
      if (t.lexeme === Keyword.object) {
        return parseObjectDecl()
      } else if (t.lexeme === Keyword.func) {
        return parseFuncDecl()
      } else if (peekNext()?.type === TokenType.init) {
        return parseInitStatmt()
      } else {
        return parseExprStatmt()
      }
    } else if (t.type === TokenType.vBar) {
      return parseVarDecl()
    } else {
      return parseExprStatmt()
    }
  }

  function parseBlock(): HzCodeBlock {
    if (!tryConsume(TokenType.lbracket)) {
      throw new ParseError("Expect '['", peek())
    }
    const statements: HzStatmt[] = []
    const locals: HzVarDecl[] = []
    while (peek().type !== TokenType.rbracket) {
      parseStatmt(
        statmt => {
          statements.push(statmt)
        },
        varDecl => {
          locals.push(varDecl)
        })
    }
    if (!tryConsume(TokenType.rbracket)) {
      throw new ParseError("Expect ']'", peek())
    }
    return new HzCodeBlock(statements, locals)
  }

  function parseInitStatmt(): HzInitStatmt {
    const nameToken = advance()
    if (nameToken.type !== TokenType.id) {
      throw new ParseError("Expect identifier", nameToken)
    }
    if (!tryConsume(TokenType.init)) {
      throw new ParseError("Expect ':='", peek())
    }
    const value = parseExpr()
    if (!tryConsume(TokenType.dot)) {
      throw new ParseError("Expect '.' to end 'init'", peek())
    }
    return new HzInitStatmt({ name: nameToken.lexeme, value })
  }

  function parseExprStatmt(): HzExprStatmt {
    const expr = parseExpr()
    if (!tryConsume(TokenType.dot)) {
      throw new ParseError("Expect '.' to end expr", peek())
    }
    return new HzExprStatmt({ expr })
  }

  function parseStatmt(getStatmt: (statmt: HzStatmt) => void, getVarDecl: (varDecl: HzVarDecl) => void): void {
    const t = peek()
    if (t.type === TokenType.vBar) {
      // var declaration
      const varDecls = parseVarDecl()
      for (const varDecl of varDecls) {
        getVarDecl(varDecl)
      }
    } else if (t.type === TokenType.id) {
      // if, while, return, break, continue
      if (t.lexeme === Keyword.if) {
        getStatmt(parseIfStatmt())
      } else if (t.lexeme === Keyword.while) {
        getStatmt(parseWhileStatmt())
      } else if (t.lexeme === Keyword.return) {
        getStatmt(parseReturnStatmt())
      } else if (t.lexeme === Keyword.break) {
        getStatmt(parseBreakStatmt())
      } else if (t.lexeme === Keyword.continue) {
        getStatmt(parseContinueStatmt())
      } else if (peekNext()?.type === TokenType.init) {
        getStatmt(parseInitStatmt())
      } else {
        getStatmt(parseExprStatmt())
      }
    } else {
      getStatmt(parseExprStatmt())
    }
  }

  function parseReturnStatmt(): HzReturnStatmt {
    // consume `return`
    if (!tryConsume(TokenType.id, Keyword.return)) {
      throw new ParseError("Expect 'return'", peek())
    }
    const value = parseExpr()
    if (!tryConsume(TokenType.dot)) {
      throw new ParseError("Expect '.' to end 'return'", peek())
    }
    return new HzReturnStatmt(value)
  }

  function parseBreakStatmt(): HzBreakStatmt {
    // consume `break`
    if (!tryConsume(TokenType.id, Keyword.break)) {
      throw new ParseError("Expect 'break'", peek())
    }
    if (!tryConsume(TokenType.dot)) {
      throw new ParseError("Expect '.' after 'break'", peek())
    }
    return new HzBreakStatmt()
  }

  function parseContinueStatmt(): HzContinueStatmt {
    // consume `continue`
    if (!tryConsume(TokenType.id, Keyword.continue)) {
      throw new ParseError("Expect 'continue'", peek())
    }
    if (!tryConsume(TokenType.dot)) {
      throw new ParseError("Expect '.' after 'continue'", peek())
    }
    return new HzContinueStatmt()
  }

  function parseIfStatmt(): HzIfStatmt {
    // consume `if`
    if (!tryConsume(TokenType.id, Keyword.if)) {
      throw new ParseError("Expect 'if'", peek())
    }
    function parseWithoutIf(): HzIfStatmt {
      const condition = parseExpr()
      const consequent = parseBlock()
      let alternate: HzCodeBlock | undefined
      // for cascading if
      if (tryConsume(TokenType.id, Keyword.elif)) {
        alternate = new HzCodeBlock([parseWithoutIf()])
      }
      // for else branch
      if (tryConsume(TokenType.id, Keyword.else)) {
        alternate = parseBlock()
      }
      alternate ??= new HzCodeBlock()
      return new HzIfStatmt({ condition, consequent, alternate })
    }
    return parseWithoutIf()
  }

  function parseWhileStatmt(): HzWhileStatmt {
    // consume `while`
    if (!tryConsume(TokenType.id, Keyword.while)) {
      throw new ParseError("Expect 'while'", peek())
    }
    const condition = parseExpr()
    const body = parseBlock()
    return new HzWhileStatmt({ condition, body })
  }

  function parseObjectDecl(): HzObjDecl {
    if (!tryConsume(TokenType.id, Keyword.object)) {
      throw new ParseError("Expect 'object'", peek())
    }
    const nameToken = advance()
    if (nameToken.type !== TokenType.id) {
      throw new ParseError("Expect identifier after 'object'", nameToken)
    }
    const name = nameToken.lexeme
    if (!tryConsume(TokenType.lbracket)) {
      throw new ParseError("Expect '[' to start object declaration", peek())
    }
    const fields: HzVarDecl[] = []
    const ctors: HzFuncDecl[] = []
    const objMethods: HzFuncDecl[] = []
    const classMethods: HzFuncDecl[] = []
    while (peek().type !== TokenType.rbracket) {
      const t = peek()
      if (t.type === TokenType.vBar) {
        const varDecls = parseVarDecl()
        for (const varDecl of varDecls) {
          fields.push(varDecl)
        }
      } else if (t.type === TokenType.id) {
        if (t.lexeme === name) {
          // constructor
          const ctor = parseCtorDecl()
          ctors.push(ctor)
        } else if (t.lexeme === Keyword.method) {
          const method = parseMethodDecl()
          objMethods.push(method)
        } else {
          // class method
          const method = parseMethodDecl(true)
          classMethods.push(method)
        }
      } else {
        throw new ParseError("Unrecognized token in object declaration", t)
      }
    }
    if (!tryConsume(TokenType.rbracket)) {
      throw new ParseError("Expect ']' to end object declaration", peek())
    }
    return new HzObjDecl({ name, ctors, fields, objMethods, classMethods })

    function parseCtorDecl(): HzFuncDecl {
      if (!tryConsume(TokenType.id, name)) {
        throw new ParseError("Expect 'func'", peek())
      }
      const selectors = parseFuncSelectors()
      const body = parseBlock()
      if (Array.isArray(selectors)) {
        return new HzNaryFuncDecl({ selectors, body })
      } else {
        return new HzNullaryFuncDecl({ selector: selectors, body })
      }
    }

    function parseMethodDecl(isClassMethod?: boolean): HzFuncDecl {
      if (!isClassMethod && !tryConsume(TokenType.id, Keyword.method)) {
        throw new ParseError("Expect 'method'", peek())
      }
      const selectors = parseFuncSelectors()
      const body = parseBlock()
      if (Array.isArray(selectors)) {
        return new HzNaryFuncDecl({ selectors, body })
      } else {
        return new HzNullaryFuncDecl({ selector: selectors, body })
      }
    }

  }

  function parseVarDecl(): HzVarDecl[] {
    if (!tryConsume(TokenType.vBar)) {
      throw new ParseError("Expect '|' to start variable declaration", peek())
    }
    const vars: HzVarDecl[] = []
    while (peek().type !== TokenType.vBar) {
      const t = advance()
      if (t.type === TokenType.id) {
        // var name
        vars.push(new HzVarDecl(t.lexeme))
      }
    }
    if (!tryConsume(TokenType.vBar)) {
      throw new ParseError("Expect '|' to end variable declaration", peek())
    }
    return vars
  }

  function parseFuncDecl(): HzFuncDecl {
    if (!tryConsume(TokenType.id, Keyword.func)) {
      throw new ParseError("Expect 'func'", peek())
    }
    const selectors = parseFuncSelectors()
    const body = parseBlock()
    if (Array.isArray(selectors)) {
      return new HzNaryFuncDecl({ selectors, body })
    } else {
      return new HzNullaryFuncDecl({ selector: selectors, body })
    }
  }

  function parseFuncSelectors(): NaryFuncSelectorDecl[] | string {
    const parts: NaryFuncSelectorDecl[] = []
    do {
      const selector = advance()
      if (selector.type !== TokenType.id) {
        throw new ParseError("Except selector", selector)
      }
      if (!tryConsume(TokenType.colon)) {
        if (parts.length === 0) {
          // nullary
          return selector.lexeme
        } else {
          throw new ParseError("Expect ':' after first selector", peek())
        }
      }
      const param = advance()
      if (param.type !== TokenType.id) {
        throw new ParseError("Except parameter", param)
      }
      if (param.type === TokenType.id) {
        if (param.lexeme === Keyword.discard) {
          parts.push({ selector: selector.lexeme })
        } else {
          parts.push({ selector: selector.lexeme, param: param.lexeme })
        }
      }
      // continue scanning if the next token is still an identifier.
    } while (peek().type === TokenType.id)
    return parts
  }

  function parseExpr(): HzExpr {
    let left = parsePrimary()
    for (; ;) {
      const opToken = peek()
      if (opToken.type !== TokenType.operator) break
      advance()
      if (isAssign(opToken.operator) && !left.isLvalue) {
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
        right = new HzBinaryExpr({ left: right, op: nextOpToken.operator, right: nextRight })
      }
      left = new HzBinaryExpr({ left, op: opToken.operator, right })
    }
    return left
  }

  function parsePrimary(left?: HzExpr, right?: HzExpr): HzExpr {
    const t = peek()
    if (t.type === TokenType.number) {
      advance()
      return new HzLiteralExpr(new HzLiteral(LiteralType.number, t.lexeme))
    } else if (t.type === TokenType.string) {
      advance()
      return new HzLiteralExpr(new HzLiteral(LiteralType.string, t.lexeme))
    } else if (t.type === TokenType.id) {
      const nextToken = peekNext()
      if (nextToken?.type === TokenType.id) {
        advance()
        // function call
        return parseFuncCallExpr(new HzRefExpr({ name: t.lexeme }))
      } else if (nextToken?.type === TokenType.colon) {
        // independent function call
        return parseFuncCallExpr()
      } else if (t.lexeme === Keyword.true || t.lexeme === Keyword.false) {
        return new HzLiteralExpr(new HzLiteral(LiteralType.bool, t.lexeme))
      } else if (t.lexeme === Keyword.null) {
        return new HzLiteralExpr(new HzLiteral(LiteralType.null, t.lexeme))
      } else if (t.lexeme === Keyword.undefined) {
        return new HzLiteralExpr(new HzLiteral(LiteralType.undefined, t.lexeme))
      } else {
        advance()
        return new HzRefExpr({ name: t.lexeme })
      }
    } else if (t.type === TokenType.lParen) {
      // consume "("
      advance()
      const expr = parseExpr()
      // consume ")"
      if (!tryConsume(TokenType.rParen)) {
        throw new ParseError("Unclosed parentheses", peek())
      }
      return expr
    }
    throw new ParseError("Unrecognized primary token", t)
  }

  function parseFuncCallExpr(caller?: HzExpr): HzFuncCallExpr {
    for (; ;) {
      caller = parseFuncCallExprImpl(caller)
      if (tryConsume(TokenType.comma)) {
        // method chaining
        continue
      }
      break
    }
    return caller

    function parseFuncCallExprImpl(caller?: HzExpr): HzFuncCallExpr {
      const selectors: HzNaryCallSelector[] = []
      do {
        const selector = peek()
        if (selector.type !== TokenType.id) {
          throw new ParseError("Expect selector", selector)
        }
        advance()
        if (!tryConsume(TokenType.colon)) {
          if (selectors.length === 0) {
            // nullary
            return new HzNullaryFuncCallExpr({ caller, selector: selector.lexeme })
          } else {
            throw new ParseError("Expect ':' after first selector", peek())
          }
        }
        const arg = parseExpr()
        selectors.push({ selector: selector.lexeme, arg })
      } while (peek().type === TokenType.id)
      return new HzNaryFuncCallExpr({ caller, selectors })
    }
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
  function tryConsume(expected: TokenType.id, value: string | Keyword): boolean
  function tryConsume(expected: TokenType.operator, value: Op): boolean
  function tryConsume(expected: TokenType, value?: string | Keyword | Op): boolean {
    const t = peek()
    if (t === undefined) return false
    if (t.type != expected) return false
    if (t.type === TokenType.id && t.lexeme !== value) return false
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
