import { DeclType, FuncSign, HzFuncDecl, HzObjDecl, NaryFuncSign } from "./declaration"
import { HzExpr } from "./expr"
import { TopLevel } from "./parser"
import { HzExprStatmt, HzInitStatmt, StatmtType } from "./statement"

export type FuncSignPattern = NullaryFuncSignPattern | NaryFuncSignPattern

export type NullaryFuncSignPattern = string

export type NaryFuncSignPattern = string[]

export type Ref = Var | Obj | Field | Method | Global
export type Scoped = Global | Obj | Func | Method

export class Global {
  vars: Var[] = []
  objects: Obj[] = []
  functions: Func[] = []
}

export class Var {
  parent: Scoped
  name: string
  constructor(parent: Scoped, name: string) {
    this.parent = parent
    this.name = name
  }
}

export class Obj {
  parent: Global
  name: string
  fields: Var[] = []
  constructor(parent: Global, name: string) {
    this.parent = parent
    this.name = name
  }
}

export class Field {
  parent: Obj
  name: string
  constructor(parent: Obj) {
    this.parent = parent
  }
}

export class Func {
  parent: Global
  vars: Var[] = []
  constructor(parent: Global) {
    this.parent = parent
  }
}

export class Method {
  parent: Obj
  vars: Var[] = []
  constructor(parent: Obj) {
    this.parent = parent
  }
}

function AST(topLevels: TopLevel[], global?: Global) {
  global ??= new Global()

  for (const topLevel of topLevels) {
    if (topLevel.type === DeclType.obj) {
      visitObjDecl(global, topLevel)
    } else if (topLevel.type === DeclType.func) {
      visitFuncDecl(global, topLevel)
    } else if (topLevel.type === StatmtType.expr) {
      visitExprStatmt(global, topLevel)
    } else if (topLevel.type === StatmtType.init) {
      visitInitStatmt(global, topLevel)
    }
  }

  function visitObjDecl(parent: Global, decl: HzObjDecl): Obj {
    const obj = new Obj(parent, decl.name)
    return obj
  }

  function visitFuncDecl(parent: Global, decl: HzFuncDecl): Func {
    const func = new Func(parent)
    return func
  }

  function visitExprStatmt(parent: Scoped, statmt: HzExprStatmt): void {

  }

  function visitInitStatmt(parent: Scoped, statmt: HzInitStatmt): void {

  }

  function visitExpr(parent: Scoped, expr: HzExpr): void {

  }
}

// export class Scope {
//   parent?: Scope

//   variables: Set<string> = new Set()

//   functions: FuncSign[] = []

//   constructor(parent?: Scope) {
//     this.parent = parent
//   }

//   findVar(name: string): boolean {
//     return this.variables.has(name)
//       || (this.parent ? this.parent.findVar(name) : false)
//   }

//   findFunc(pattern: FuncSignPattern): boolean {
//     let found = false
//     for (const func of this.functions) {
//       const isDeclaredNary = Array.isArray(func)
//       const isPatternNary = Array.isArray(pattern)
//       if (isDeclaredNary && isPatternNary) {
//         // both nary 
//         if (matchNarySign(pattern, func)) {
//           found = true
//           break
//         }
//       } else if (!isDeclaredNary && !isPatternNary) {
//         // both nullary
//         if (pattern === func.selector) {
//           found = true
//           break
//         }
//       }
//     }
//     return found
//       || (this.parent ? this.parent.findFunc(pattern) : false)
//   }
// }

function matchNarySign(pattern: NaryFuncSignPattern, declaredFunctions: NaryFuncSign): boolean {
  for (const declared of declaredFunctions) {
    for (const patternPart of pattern) {
      if (patternPart !== declared.selector) return false
    }
  }
  return true
}
