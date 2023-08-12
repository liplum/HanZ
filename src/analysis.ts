import { HzFuncDecl, HzObjDecl } from "./declaration.js"
import { HzExpr } from "./expr.js"
import { TopLevel } from "./file.js"
import { HzBlock, HzObj } from "./scope.js"
import { HzCodeBlock, HzExprStatmt, HzIfStatmt, HzInitStatmt, HzStatmt } from "./statement.js"

export function semanticAnalyze(topLevels: TopLevel[], global?: HzBlock) {
  global ??= new HzBlock()

  for (const topLevel of topLevels) {
    if (topLevel instanceof HzObjDecl) {
      visitObjDecl(global, topLevel)
    } else if (topLevel instanceof HzFuncDecl) {
      visitFuncDecl(global, topLevel)
    } else if (topLevel instanceof HzExprStatmt) {
      visitExprStatmt(global, topLevel)
    } else if (topLevel instanceof HzInitStatmt) {
      visitInitStatmt(global, topLevel)
    }
  }

  function visitObjDecl(parent: HzBlock, decl: HzObjDecl): void {
    parent.defineConst(decl.name)
    decl.scope = new HzObj(parent, decl.name)
    // object self is a const
    decl.scope.defineConst(decl.name)
    for (const field of decl.fields) {
      for (const name of field.names) {
        decl.scope.defineVar(name)
      }
    }
    for (const method of decl.objMethods) {
      visitObjMethodsDecl(decl.scope, method)
    }
  }

  function visitObjMethodsDecl(parent: HzObj, decl: HzFuncDecl) {

  }

  function visitFuncDecl(parent: HzBlock, decl: HzFuncDecl): void {
    const func = new HzBlock(parent)
    for (const statmt of decl.body) {
      visitStatmt(func, statmt)
    }
  }

  function visitStatmt(parent: HzBlock, statmt: HzStatmt) {
    if (statmt instanceof HzIfStatmt) {
      visitIfStatmt(parent, statmt)
    }
  }

  function visitIfStatmt(parent: HzBlock, statmt: HzIfStatmt): void {
    visitExpr(parent, statmt.condition)
    visitCodeBlock(parent, statmt.consequent)
    if (statmt.alternate) {
      visitCodeBlock(parent, statmt.alternate)
    }
  }

  function visitCodeBlock(parent: HzBlock, block: HzCodeBlock): void {
    block.scope = new HzBlock(parent)
    for (const statmt of block) {
      visitStatmt(block.scope, statmt)
    }
  }

  function visitExprStatmt(parent: HzBlock, statmt: HzExprStatmt): void {
    
  }

  function visitInitStatmt(parent: HzBlock, statmt: HzInitStatmt): void {

  }

  function visitExpr(parent: HzBlock, expr: HzExpr): void {

  }
}

export class SemanticAnalyzeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}
