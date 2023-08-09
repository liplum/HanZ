import { HzStatmt } from "./statement"

export enum DeclType {
  var = "var",
  func = "func",
  obj = "obj",
  ctor = "ctor",
}

export interface HzVarDecl {
  type: DeclType.var
  vars: string[]
}

export interface HzFuncSignaturePart {
  name: string
  param: string
}

export interface HzFuncDecl {
  type: DeclType.func
  signature: HzFuncSignaturePart[]
  body: HzStatmt[]
}

export interface HzCtorDecl {
  type: DeclType.ctor
  signature: HzFuncSignaturePart[]
  body: HzStatmt[]
}

export interface HzObjDecl {
  type: DeclType.obj
  name: string
  ctors: HzCtorDecl[]
  fields: HzVarDecl[]
  methods: HzFuncDecl[]
}
