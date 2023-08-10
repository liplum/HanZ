import { Writable } from "stream"
import { TopLevel } from "../parser"
import { DeclType, HzFuncDecl, HzObjDecl } from "../declaration"
import { HzExprStatmt, HzInitStatmt, StatmtType } from "../statement"
import { HzExpr } from "../expr"

interface Context {
  [key: string]: unknown
}

function transpile2Js(topLevels: TopLevel[], output: Writable) {
  const topLevelCtx: Context = {}
  for (const topLevel of topLevels) {
    if (topLevel.type === DeclType.obj) {
      visitObjDecl(topLevel, topLevelCtx)
    } else if (topLevel.type === DeclType.func) {
      visitFuncDecl(topLevel, topLevelCtx)
    } else if (topLevel.type === StatmtType.expr) {
      visitExprStatmt(topLevel, topLevelCtx)
    } else if (topLevel.type === StatmtType.init) {
      visitInitStatmt(topLevel, topLevelCtx)
    }
  }

  function visitObjDecl(decl: HzObjDecl, ctx: Context): void {
    for (const field of decl.fields) {
      
    }
  }

  function visitFuncDecl(decl: HzFuncDecl, ctx: Context): void {

  }

  function visitExprStatmt(statmt: HzExprStatmt, ctx: Context): void {

  }

  function visitInitStatmt(statmt: HzInitStatmt, ctx: Context): void {

  }

  function visitExpr(expr: HzExpr, ctx: Context): void {

  }
}