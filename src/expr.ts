import { HzLiteral } from "./literal"
import { AssignOp, BinaryOp, UnaryOp } from "./token.js"

export enum ExprType {
  unary = "unary",
  binary = "binary",
  literal = "literal",
  lvalue = "lvalue",
  assign = "assign",
}

export type HzExpr = HzLvalue | HzBinaryExpr | HzAssign | HzUnaryExpr | HzLiteralExpr

export interface HzLvalue {
  type: ExprType.lvalue
  value: HzExpr
}

export interface HzAssign {
  type: ExprType.assign
  left: HzLvalue
  op: AssignOp
  right: HzExpr
}

export interface HzBinaryExpr {
  type: ExprType.binary
  left: HzExpr
  op: BinaryOp
  right: HzExpr
}

export interface HzUnaryExpr {
  type: ExprType.unary
  op: UnaryOp
  right: HzExpr
}

export interface HzLiteralExpr {
  type: ExprType.literal
  value: HzLiteral
}
