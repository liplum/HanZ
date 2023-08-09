export enum DeclType {
  var = "var",
  varGroup = "var-group",
  func = "func",
  obj = "obj",
  ctor = "ctor",
  param = "param",
}

export type HzDecl = HzVarDecl | HzVarGroupDecl | HzFuncDecl | HzParamDecl

export interface HzVarDecl {
  type: DeclType.var
  name: string
}

export interface HzVarGroupDecl {
  type: DeclType.varGroup
  names: string[]
}

export interface HzFuncDecl {
  type: DeclType.func
  name: string
  params: HzParamDecl[]
}

export interface HzParamDecl {
  type: DeclType.param
  name: string
}

