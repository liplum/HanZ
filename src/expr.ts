import { HzLiteral } from "./literal"
import { Operator } from "./token.js"

export enum ExprType {
  var = "var",
  unary = "unary",
  binary = "binary",
  literal = "literal",
  call = "call",
}

export type HzExpr = HzBinaryExpr | HzUnaryExpr | HzLiteralExpr | VariableExpr | HzCallExpr

export interface VariableExpr {
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

export type HzCallExpr = HzNullaryCallExpr | HzPlainCallExpr

export interface HzCallingPart {
  selector: string
  argument: HzExpr
}

export interface HzPlainCallExpr {
  type: ExprType.call
  parts: HzCallingPart[]
}

export interface HzNullaryCallExpr {
  type: ExprType.call
  selector: string
}

