import { HzStatmt } from "./statement"

export enum DeclType {
  var = "var",
  func = "func",
  obj = "obj",
  ctor = "ctor",
  param = "param",
}

export type HzDecl = HzVarDecl | HzFuncDecl | HzParamDecl

export interface HzVarDecl {
  type: DeclType.var
  vars: string[]
}

export interface HzFuncDecl {
  type: DeclType.func
  name: string
  params: HzParamDecl[]
  body: HzStatmt[]
}

export interface HzParamDecl {
  type: DeclType.param
  name: string
}

export interface HzObjDecl {
  type: DeclType.obj
  name: string
  fields: HzVarDecl[]
  methods: HzFuncDecl[]
}

