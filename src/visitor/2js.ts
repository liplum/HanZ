import { Writable } from "stream"
import { TopLevel } from "../file.js"
import { HzFuncDecl, HzNaryFuncDecl, HzNullaryFuncDecl, HzObjDecl, HzVarDecl, NaryFuncSelectorDecl } from "../declaration.js"
import { HzBreakStatmt, HzCodeBlock, HzContinueStatmt, HzExprStatmt, HzIfStatmt, HzInitStatmt, HzReturnStatmt, HzStatmt, HzVarDeclStatmt, HzWhileStatmt, StatmtType } from "../statement.js"
import { HzBinaryExpr, HzExpr, HzLiteralExpr, HzNaryFuncCallExpr, HzNullaryFuncCallExpr, HzVarExpr } from "../expr.js"
import { HzNaryFunc, HzNullaryFunc } from "../scope.js"

export function transpile2Js(topLevels: TopLevel[], output: Writable) {
  for (const topLevel of topLevels) {
    if (topLevel instanceof HzObjDecl) {
      genObjDecl(topLevel)
    } else if (topLevel instanceof HzFuncDecl) {
      genFuncDecl(topLevel)
    } else if (topLevel instanceof HzExprStatmt) {
      genExprStatmt(topLevel)
    } else if (topLevel instanceof HzInitStatmt) {
      genInitStatmt(topLevel)
    }
  }

  function genObjDecl(obj: HzObjDecl): void {
    output.write(`const obj$${obj.name}={`)
    for (const ctor of obj.ctors) {
      output.write(`init$${ctor.signature}`)
      genFuncParam(ctor)
      genCtorCodeBlock(ctor.body)
    }

    for (const method of obj.objMethods) {
      genMethod(method)
    }
    output.write("}")
  }

  function genMethod(method: HzFuncDecl): void {
    output.write(`${method.signature}`)
    genMethodParam(method)
    genCodeBlock(method.body)
  }

  function genFuncDecl(func: HzFuncDecl): void {
    output.write(`function ${func.signature}`)
    genFuncParam(func)
    genCodeBlock(func.body)
  }

  function genMethodParam(func: HzFuncDecl): void {
    if (func instanceof HzNullaryFuncDecl) {
      output.write("(self)")
    } else if (func instanceof HzNaryFuncDecl) {
      output.write("(self,")
      output.write(func.selectors.map(({ selector, param }) => {
        return param ? param : selector
      }).join(","))
      output.write(")")
    }
  }

  function genFuncParam(func: HzFuncDecl): void {
    if (func instanceof HzNullaryFuncDecl) {
      output.write("()")
    } else if (func instanceof HzNaryFuncDecl) {
      output.write("(")
      output.write(func.selectors.map(({ selector, param }) => {
        return param ? param : selector
      }).join(","))
      output.write(")")
    }
  }

  function genCtorCodeBlock(block: HzCodeBlock): void {
    output.write("{")
    output.write("const self={};self.$class=this;")
    for (const statmt of block) {
      genStatmt(statmt)
    }
    output.write("return self;")
    output.write("}")
  }

  function genCodeBlock(block: HzCodeBlock): void {
    output.write("{")
    for (const statmt of block) {
      genStatmt(statmt)
    }
    output.write("}")
  }

  function genStatmt(statmt: HzStatmt): void {
    if (statmt instanceof HzIfStatmt) {
      genIfStatmt(statmt)
    } else if (statmt instanceof HzWhileStatmt) {
      genWhileStatmt(statmt)
    } else if (statmt instanceof HzInitStatmt) {
      genInitStatmt(statmt)
    } else if (statmt instanceof HzExprStatmt) {
      genExprStatmt(statmt)
    } else if (statmt instanceof HzReturnStatmt) {
      genReturnStatmt(statmt)
    } else if (statmt instanceof HzVarDeclStatmt) {
      genVarDeclStatmt(statmt)
    } else if (statmt instanceof HzBreakStatmt) {
      genBreakStatmt(statmt)
    } else if (statmt instanceof HzContinueStatmt) {
      genContinueStatmt(statmt)
    }
  }

  function genIfStatmt(statmt: HzIfStatmt): void {
    output.write(`if(${genExpr(statmt.condition)})`)
    genCodeBlock(statmt.consequent)
    if (statmt.alternate) {
      output.write("else")
      genCodeBlock(statmt.alternate)
    }
  }

  function genWhileStatmt(statmt: HzWhileStatmt): void {
    output.write(`while(${genExpr(statmt.condition)})`)
    genCodeBlock(statmt.body)
  }
  function genExprStatmt(statmt: HzExprStatmt): void {
    genExpr(statmt.expr)
    output.write(";")
  }
  function genInitStatmt(statmt: HzInitStatmt): void {
    output.write(`let ${statmt.name}=${statmt.value};`)
  }
  function genReturnStatmt(statmt: HzReturnStatmt): void {
    output.write(`return ${statmt.value};`)
  }
  function genVarDeclStatmt(statmt: HzVarDeclStatmt): void {
    genVarDecl(statmt.declare)
    output.write(";")
  }
  function genVarDecl(decl: HzVarDecl): void {
    output.write("let ")
    output.write(decl.names.join(","))
  }
  function genBreakStatmt(statmt: HzBreakStatmt): void {
    output.write("break;")
  }
  function genContinueStatmt(statmt: HzContinueStatmt): void {
    output.write("continue;")
  }
  function genExpr(expr: HzExpr): void {
    if (expr instanceof HzLiteralExpr) {
      genLiteralExpr(expr)
    } else if (expr instanceof HzVarExpr) {
      genVarExpr(expr)
    } else if (expr instanceof HzNullaryFuncCallExpr) {
      genNullaryFuncCallExpr(expr)
    } else if (expr instanceof HzNaryFuncCallExpr) {
      genNaryFuncCallExpr(expr)
    } else if (expr instanceof HzBinaryExpr) {
      genBinaryExpr(expr)
    }
  }
  function genLiteralExpr(expr: HzLiteralExpr) {
    output.write(expr.value.raw)
  }
  function genVarExpr(expr: HzVarExpr) {
    
  }
  function genNullaryFuncCallExpr(expr: HzNullaryFuncCallExpr) {

  }
  function genNaryFuncCallExpr(expr: HzNaryFuncCallExpr) {

  }
  function genBinaryExpr(expr: HzBinaryExpr) {

  }
}