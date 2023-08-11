import { HzFuncDecl, HzObjDecl } from "./declaration"
import { HzExpr } from "./expr"
import { TopLevel } from "./parser"
import { Block, Obj } from "./scope"
import { HzExprStatmt, HzIfStatmt, HzInitStatmt, HzStatmt, StatmtType } from "./statement"

function AST(topLevels: TopLevel[], global?: Block) {
  global ??= new Block()

  for (const topLevel of topLevels) {
    if (topLevel instanceof HzObjDecl) {
      visitObjDecl(global, topLevel)
    } else if (topLevel instanceof HzFuncDecl) {
      visitFuncDecl(global, topLevel)
    } else if (topLevel.type === StatmtType.expr) {
      visitExprStatmt(global, topLevel)
    } else if (topLevel.type === StatmtType.init) {
      visitInitStatmt(global, topLevel)
    }
  }

  function visitObjDecl(parent: Block, decl: HzObjDecl): void {
    const obj = new Obj(parent, decl.name)
    for (const field of decl.fields) {
      for (const name of field.names) {
        obj.defineVar(name)
      }
    }
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

  function visitExprStatmt(parent: Block, statmt: HzExprStatmt): void {

  }

  function visitInitStatmt(parent: Block, statmt: HzInitStatmt): void {

  }

  function visitExpr(parent: Block, expr: HzExpr): void {

  }
}
