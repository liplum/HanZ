import { HzLiteral } from "./literal.js"
import { Operator } from "./token.js"

export const enum ExprType {
  var = "var",
  unary = "unary",
  binary = "binary",
  literal = "literal",
  nullaryCall = "nullary-call",
  naryCall = "nary-call",
}

export class HzExpr {
  get isLvalue(): boolean {
    return false
  }
}

export class HzVarExpr extends HzExpr {
  name: string
  constructor({ name }: { name: string }) {
    super()
    this.name = name
  }
  get isLvalue(): boolean {
    return true
  }
  toJSON() {
    return {
      type: ExprType.var,
      name: this.name,
    }
  }
}

export class HzBinaryExpr extends HzExpr {
  left: HzExpr
  op: Operator
  right: HzExpr
  constructor({ left, op, right }: { left: HzExpr, op: Operator, right: HzExpr }) {
    super()
    this.left = left
    this.op = op
    this.right = right
  }
  toJSON() {
    return {
      type: ExprType.var,
      left: this.left,
      op: this.op,
      right: this.right,
    }
  }
}

export class HzUnaryExpr extends HzExpr {
  op: Operator
  right: HzExpr
  constructor({ op, right }: { op: Operator, right: HzExpr }) {
    super()
    this.op = op
    this.right = right
  }
  toJSON() {
    return {
      type: ExprType.var,
      op: this.op,
      right: this.right,
    }
  }
}

export class HzLiteralExpr<T = unknown> extends HzExpr {
  value: HzLiteral<T>
  constructor(value: HzLiteral<T>) {
    super()
    this.value = value
  }
  toJSON() {
    return {
      type: ExprType.var,
      value: this.value,
    }
  }
}

export class HzFuncCallExpr extends HzExpr {
  caller?: HzExpr
}

export interface HzNaryCallSelector {
  selector: string
  arg: HzExpr
}

export class HzNaryFuncCallExpr extends HzFuncCallExpr {
  caller?: HzExpr
  selectors: HzNaryCallSelector[]

  constructor({ caller, selectors }: { caller?: HzExpr, selectors: HzNaryCallSelector[] }) {
    super()
    this.caller = caller
    this.selectors = selectors
  }
  toJSON() {
    return {
      type: ExprType.naryCall,
      caller: this.caller,
      selectors: this.selectors,
    }
  }
}

export class HzNullaryFuncCallExpr extends HzFuncCallExpr {
  caller?: HzExpr
  selector: string

  constructor({ caller, selector }: { caller?: HzExpr, selector: string }) {
    super()
    this.caller = caller
    this.selector = selector
  }
  toJSON() {
    return {
      type: ExprType.nullaryCall,
      caller: this.caller,
      selector: this.selector,
    }
  }
}
