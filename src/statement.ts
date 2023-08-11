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

export class HzStatmt { }

export class HzIfStatmt extends HzStatmt {
  condition: HzExpr
  consequent: HzStatmt[]
  alternate?: HzStatmt[]
  constructor({ condition, consequent, alternate }: { condition: HzExpr, consequent: HzStatmt[], alternate: HzStatmt[] }) {
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
  body: HzStatmt[]
  constructor({ condition, body }: { condition: HzExpr, body: HzStatmt[] }) {
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

export class HzVarDeclStatmt extends HzStatmt {
  declare: HzVarDecl
  constructor({ declare }: { declare: HzVarDecl }) {
    super()
    this.declare = declare
  }
  toJSON() {
    return {
      type: StatmtType.varDecl,
      declare: this.declare,
    }
  }
}

export class HzReturnStatmt extends HzStatmt {
  value: HzExpr
  constructor({ value }: { value: HzExpr }) {
    super()
    this.value = value
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