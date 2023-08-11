import { Writable } from "stream"
import { TopLevel } from "../file.js"
import {  HzFuncDecl, HzObjDecl } from "../declaration"
import { HzExprStatmt, HzInitStatmt, StatmtType } from "../statement"
import { HzExpr } from "../expr"

interface Context {
  [key: string]: unknown
}

function transpile2Js(topLevels: TopLevel[], output: Writable) {
  const topLevelCtx: Context = {}
  

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