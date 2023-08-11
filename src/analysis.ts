import { HzFuncDecl, HzObjDecl } from "./declaration.js"
import { HzExpr } from "./expr.js"
import { TopLevel } from "./file.js"
import { HzBlock, HzObj } from "./scope.js"
import { HzExprStatmt, HzIfStatmt, HzInitStatmt, HzStatmt } from "./statement.js"

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
    const obj = new HzObj(parent, decl.name)
    for (const field of decl.fields) {
      for (const name of field.names) {
        obj.defineVar(name)
      }
    }
  }

  function visitFuncDecl(parent: HzBlock, decl: HzFuncDecl): void {
    const func = new HzBlock(parent)
    for (const statmt of decl.body) {
      $visitStatmt(func, statmt)
    }
  }

  function $visitStatmt(parent: HzBlock, statmt: HzStatmt) {
    if (statmt instanceof HzIfStatmt) {
      visitIfStatmt(parent, statmt)
    }
  }

  function visitIfStatmt(parent: HzBlock, statmt: HzIfStatmt): void {
    const block = new HzBlock(parent)
    visitExpr(block, statmt.condition)
    for (const sub of statmt.consequent) {
      $visitStatmt(block, sub)
    }
    if (statmt.alternate) {
      for (const sub of statmt.alternate) {
        $visitStatmt(block, sub)
      }
    }
  }

  function visitExprStatmt(parent: HzBlock, statmt: HzExprStatmt): void {

  }

  function visitInitStatmt(parent: HzBlock, statmt: HzInitStatmt): void {

  }

  function visitExpr(parent: HzBlock, expr: HzExpr): void {

  }
}
