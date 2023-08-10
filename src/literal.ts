export enum LiteralType {
  string = "string",
  number = "number",
  bool = "bool",
}

export type HzLiteral = HzStringLiteral | HzBoolLiteral | HzNumberLiteral

export interface HzStringLiteral {
  type: LiteralType.string
  value: string
}

export interface HzNumberLiteral {
  type: LiteralType.number
  value: string
}

export interface HzBoolLiteral {
  type: LiteralType.bool
  value: string
}