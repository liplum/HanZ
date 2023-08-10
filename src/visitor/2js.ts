import { Writable } from "stream"
import { TopLevel } from "../parser"
import { DeclType, HzFuncDecl, HzObjDecl } from "../declaration"
import { HzExprStatmt, HzInitStatmt, StatmtType } from "../statement"
import { HzExpr } from "../expr"

function transpile2Js(topLevels: TopLevel[], output: Writable) {
  for (const topLevel of topLevels) {
    if (topLevel.type === DeclType.obj) {
      visitObjDecl(topLevel)
    } else if (topLevel.type === DeclType.func) {
      visitFuncDecl(topLevel)
    } else if (topLevel.type === StatmtType.expr) {
      visitExprStatmt(topLevel)
    } else if (topLevel.type === StatmtType.init) {
      visitInitStatmt(topLevel)
    }
  }

  function visitObjDecl(decl: HzObjDecl): void {
    output.write("s")
  }

  function visitFuncDecl(decl: HzFuncDecl): void {

  }

  function visitExprStatmt(statmt: HzExprStatmt): void {

  }

  function visitInitStatmt(statmt: HzInitStatmt): void {

  }

  function visitExpr(expr: HzExpr): void {

  }
}