import { HzVarDecl } from "./declaration"
import { HzExpr } from "./expr"

export enum StatmtType {
  if = "if",
  while = "while",
  expr = "expr",
  varDecl = "var-decl",
  return = "return",
  break = "break",
  continue = "continue",
  init = "init",
}

export class HzCodeBlock {
  statements: HzStatmt[]
  locals: HzVarDecl[]
  constructor(statements?: HzStatmt[], locals?: HzVarDecl[]) {
    this.statements = statements ?? []
    this.locals = locals ?? []
  }
  toJSON() {
    return this.statements
  }
  [Symbol.iterator](): Iterator<HzStatmt> {
    return this.statements.values()
  }
}

export class HzStatmt { }

export class HzIfStatmt extends HzStatmt {
  condition: HzExpr
  consequent: HzCodeBlock
  alternate?: HzCodeBlock
  constructor({ condition, consequent, alternate }: { condition: HzExpr, consequent: HzCodeBlock, alternate: HzCodeBlock }) {
    super()
    this.condition = condition
    this.consequent = consequent
    this.alternate = alternate
  }

  toJSON() {
    return {
      type: StatmtType.if,
      condition: this.condition,
      consequent: this.consequent,
      alternate: this.alternate,
    }
  }
}

export class HzWhileStatmt extends HzStatmt {
  condition: HzExpr
  body: HzCodeBlock
  constructor({ condition, body }: { condition: HzExpr, body: HzCodeBlock }) {
    super()
    this.condition = condition
    this.body = body
  }
  toJSON() {
    return {
      type: StatmtType.while,
      condition: this.condition,
      body: this.body,
    }
  }
}

export class HzExprStatmt extends HzStatmt {
  expr: HzExpr
  constructor({ expr }: { expr: HzExpr }) {
    super()
    this.expr = expr
  }
  toJSON() {
    return {
      type: StatmtType.expr,
      expr: this.expr,
    }
  }
}

export class HzReturnStatmt extends HzStatmt {
  constructor(
    public value: HzExpr
  ) {
    super()
  }
  toJSON() {
    return {
      type: StatmtType.return,
      value: this.value,
    }
  }
}

export class HzBreakStatmt extends HzStatmt {
  constructor() {
    super()
  }
  toJSON() {
    return {
      type: StatmtType.break,
    }
  }
}

export class HzContinueStatmt extends HzStatmt {
  constructor() {
    super()
  }
  toJSON() {
    return {
      type: StatmtType.break,
    }
  }
}

export class HzInitStatmt extends HzStatmt {
  name: string
  value: HzExpr
  constructor({ name, value }: { name: string, value: HzExpr }) {
    super()
    this.name = name
    this.value = value
  }
  toJSON() {
    return {
      type: StatmtType.init,
      name: this.name,
      value: this.value,
    }
  }
}