import { HzExpr } from "./expr"

export enum StatmtType {
  if = "if",
  while = "while",
  until = "until",
  expr = "expr",
}


export type HzStatmt = HzExprStatmt

export interface HzIfStatmt {
  type: StatmtType.if
  condition: HzExpr
  body: HzStatmt[]
  else: HzStatmt[]
}

export interface HzWhileStatmt {
  type: StatmtType.while
  condition: HzExpr
  body: HzStatmt[]
}

export interface HzUntilStatmt {
  type: StatmtType.until
  condition: HzExpr
  body: HzStatmt[]
}

export interface HzExprStatmt {
  type: StatmtType.expr
  expr: HzExpr
}
