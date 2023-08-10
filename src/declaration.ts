import { HzStatmt } from "./statement"

export enum DeclType {
  var = "var",
  func = "func",
  obj = "obj",
}

export interface HzVarDecl {
  type: DeclType.var
  vars: string[]
}

export type FuncSign = NullaryFuncSign | NaryFuncSign

export interface NullaryFuncSign {
  selector: string
}

export interface NaryFuncSignPart {
  selector: string
  /**
   * Undefined means discard.
   */
  param?: string
}

export type NaryFuncSign = NaryFuncSignPart[]

export type HzFuncDecl = HzNaryFuncDecl | HzNullaryFuncDecl

export interface HzNaryFuncDecl {
  type: DeclType.func
  parts: FuncSign[]
  body: HzStatmt[]
}

export interface HzNullaryFuncDecl {
  type: DeclType.func
  selector: string
  body: HzStatmt[]
}

export interface HzObjDecl {
  type: DeclType.obj
  name: string
  ctors: HzFuncDecl[]
  fields: HzVarDecl[]
  methods: HzFuncDecl[]
}
