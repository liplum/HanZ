import { DeclType, FuncSign, HzFuncDecl, HzObjDecl, NaryFuncSign } from "./declaration"
import { HzExpr } from "./expr"
import { TopLevel } from "./parser"
import { HzExprStatmt, HzIfStatmt, HzInitStatmt, HzStatmt, StatmtType } from "./statement"

export class Block {
  parent?: Block
  vars: Var[] = []
  functions: FuncSign[] = []
  constructor(parent?: Block) {
    this.parent = parent
  }
}

export class Obj extends Block {
  name: string
  constructor(parent: Block | undefined, name: string) {
    super(parent)
    this.name = name
  }
}

export class Var {
  parent: Block
  name: string
  constructor(parent: Block, name: string) {
    this.parent = parent
    this.name = name
  }
}

export class Field extends Var {
  declare parent: Obj
  constructor(parent: Obj, name: string) {
    super(parent, name)
  }
}

function AST(topLevels: TopLevel[], global?: Block) {
  global ??= new Block()

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

  function visitObjDecl(parent: Block, decl: HzObjDecl): void {
    const obj = new Obj(parent, decl.name)
  }

  function visitFuncDecl(parent: Block, decl: HzFuncDecl): void {
    const func = new Block(parent)
    for (const statmt of decl.body) {
      $visitStatmt(func, statmt)
    }
  }

  function $visitStatmt(parent: Block, statmt: HzStatmt) {
    if (statmt.type === StatmtType.if) {
      visitIfStatmt(parent, statmt)
    }
  }

  function visitIfStatmt(parent: Block, statmt: HzIfStatmt): void {
    const block = new Block(parent)
    for (const sub of statmt.consequent) {
      $visitStatmt(block, sub)
    }
    if (statmt.alternate) {
      for (const sub of statmt.alternate) {
        $visitStatmt(block, sub)
      }
    }
  }

  function visitExprStatmt(parent: Block, statmt: HzExprStatmt): void {

  }

  function visitInitStatmt(parent: Block, statmt: HzInitStatmt): void {

  }

  function visitExpr(parent: Block, expr: HzExpr): void {

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

export type FuncSignPattern = NullaryFuncSignPattern | NaryFuncSignPattern

export type NullaryFuncSignPattern = string

export type NaryFuncSignPattern = string[]

function matchNarySign(pattern: NaryFuncSignPattern, declaredFunctions: NaryFuncSign): boolean {
  for (const declared of declaredFunctions) {
    for (const patternPart of pattern) {
      if (patternPart !== declared.selector) return false
    }
  }
  return true
}
