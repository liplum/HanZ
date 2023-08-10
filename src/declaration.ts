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

export interface HzFuncSignaturePart {
  selector: string
  /**
   * Undefined means discard.
   */
  param?: string
}

export type HzFuncDecl = HzPlainFuncDecl | HzNullaryFuncDecl

export interface HzPlainFuncDecl {
  type: DeclType.func
  parts: HzFuncSignaturePart[]
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
