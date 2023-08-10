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

export type HzStatmt = HzIfStatmt | HzWhileStatmt | HzExprStatmt | HzVarDeclStatmt | HzReturnStatmt | HzBreakStatmt | HzContinueStatmt | HzInitStatmt

export interface HzIfStatmt {
  type: StatmtType.if
  condition: HzExpr
  consequent: HzStatmt[]
  alternate?: HzStatmt[]
}

export interface HzWhileStatmt {
  type: StatmtType.while
  condition: HzExpr
  body: HzStatmt[]
}

export interface HzExprStatmt {
  type: StatmtType.expr
  expr: HzExpr
}

export interface HzVarDeclStatmt {
  type: StatmtType.varDecl
  declare: HzVarDecl
}

export interface HzReturnStatmt {
  type: StatmtType.return
  value: HzExpr
}

export interface HzBreakStatmt {
  type: StatmtType.break
}

export interface HzContinueStatmt {
  type: StatmtType.continue
}

export interface HzInitStatmt {
  type: StatmtType.init
  name: string
  value: HzExpr
}