import { HzLiteral } from "./literal"
import { Operator } from "./token.js"

export enum ExprType {
  var = "var",
  unary = "unary",
  binary = "binary",
  literal = "literal",
  call = "call",
}

export type HzExpr = HzBinaryExpr | HzUnaryExpr | HzLiteralExpr | HzVarExpr | HzFuncCallExpr

export interface HzVarExpr {
  type: ExprType.var
  var: string
}

export interface HzBinaryExpr {
  type: ExprType.binary
  left: HzExpr
  op: Operator
  right: HzExpr
}

export interface HzUnaryExpr {
  type: ExprType.unary
  op: Operator
  right: HzExpr
}

export interface HzLiteralExpr {
  type: ExprType.literal
  value: HzLiteral
}

export type HzFuncCallExpr = HzNullaryFuncCallExpr | HzPlainFuncCallExpr

export interface HzCallPart {
  selector: string
  arg: HzExpr
}

export interface HzPlainFuncCallExpr {
  type: ExprType.call
  caller?: HzExpr
  parts: HzCallPart[]
}

export interface HzNullaryFuncCallExpr {
  type: ExprType.call
  caller?: HzExpr
  selector: string
}
