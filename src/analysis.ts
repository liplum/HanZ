import { HzFuncDecl, HzNaryFuncDecl, HzNullaryFuncDecl, HzObjDecl, HzVarDecl } from "./declaration.js"
import { HzExpr, HzLiteralExpr, HzNullaryFuncCallExpr, HzVarExpr } from "./expr.js"
import { TopLevel } from "./file.js"
import { HzBoolLiteral, HzNumberLiteral, HzStringLiteral } from "./literal.js"
import { HzBlock, HzNullaryFunc, HzObj, HzVar } from "./scope.js"
import { HzCodeBlock, HzExprStatmt, HzIfStatmt, HzInitStatmt, HzReturnStatmt, HzStatmt, HzVarDeclStatmt, HzWhileStatmt } from "./statement.js"
import { SoftKeyword } from "./token.js"

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

  function visitObjDecl(parent: HzBlock, obj: HzObjDecl): void {
    // adds this name to parent as a const
    parent.defineVar(obj.name, { const: true })
    obj.scope = new HzObj(parent, obj.name)
    // adds "self" to this scope as a const
    obj.scope.defineField(SoftKeyword.self, { const: true })
    for (const field of obj.fields) {
      for (const name of field.names) {
        obj.scope.defineField(name)
      }
    }
    for (const method of obj.objMethods) {
      visitObjMethodsDecl(obj.scope, method)
    }
  }

  function visitObjMethodsDecl(parent: HzObj, method: HzFuncDecl) {
    method.scope = new HzBlock(parent)
    if (method instanceof HzNaryFuncDecl) {
      for (const { selector } of method.selectors) {
        method.scope.defineVar(selector)
      }
    }
    for (const statmt of method.body) {
      visitStatmt(method.scope, statmt)
    }
  }

  function visitFuncDecl(parent: HzBlock, func: HzFuncDecl): void {
    func.scope = new HzBlock(parent)
    if (func instanceof HzNaryFuncDecl) {
      for (const { selector } of func.selectors) {
        func.scope.defineVar(selector)
      }
    }
    for (const statmt of func.body) {
      visitStatmt(func.scope, statmt)
    }
  }

  function visitStatmt(parent: HzBlock, statmt: HzStatmt) {
    if (statmt instanceof HzIfStatmt) {
      visitIfStatmt(parent, statmt)
    } else if (statmt instanceof HzWhileStatmt) {
      visitWhileStatmt(parent, statmt)
    } else if (statmt instanceof HzInitStatmt) {
      visitInitStatmt(parent, statmt)
    } else if (statmt instanceof HzExprStatmt) {
      visitExprStatmt(parent, statmt)
    } else if (statmt instanceof HzReturnStatmt) {
      visitReturnStatmt(parent, statmt)
    } else if (statmt instanceof HzVarDeclStatmt) {
      visitVarDeclStatmt(parent, statmt)
    }
  }

  function visitIfStatmt(parent: HzBlock, statmt: HzIfStatmt): void {
    visitExpr(parent, statmt.condition)
    visitCodeBlock(parent, statmt.consequent)
    if (statmt.alternate) {
      visitCodeBlock(parent, statmt.alternate)
    }
  }

  function visitWhileStatmt(parent: HzBlock, statmt: HzWhileStatmt): void {
    visitExpr(parent, statmt.condition)
    visitCodeBlock(parent, statmt.body)
  }

  function visitCodeBlock(parent: HzBlock, block: HzCodeBlock): void {
    block.scope = new HzBlock(parent)
    for (const statmt of block) {
      visitStatmt(block.scope, statmt)
    }
  }

  function visitExprStatmt(parent: HzBlock, statmt: HzExprStatmt): void {
    visitExpr(parent, statmt.expr)
  }

  function visitReturnStatmt(parent: HzBlock, statmt: HzReturnStatmt): void {
    visitExpr(parent, statmt.value)
  }

  function visitInitStatmt(parent: HzBlock, init: HzInitStatmt): void {
    parent.defineVar(init.name)
    visitExpr(parent, init.value)
  }

  function visitVarDeclStatmt(parent: HzBlock, statmt: HzVarDeclStatmt): void {
    visitVarDecl(parent, statmt.declare)
  }

  function visitVarDecl(parent: HzBlock, decl: HzVarDecl) {
    for (const name of decl.names) {
      parent.defineVar(name)
    }
  }

  function visitExpr(parent: HzBlock, expr: HzExpr): void {
    if (expr instanceof HzLiteralExpr) {
      visitLiteralExpr(parent, expr)
    } else if (expr instanceof HzVarExpr) {
      visitVarExpr(parent, expr)
    } else if (expr instanceof HzNullaryFuncCallExpr) {
      visitNullaryFuncCallExpr(parent, expr)
    }
  }
  function visitLiteralExpr(parent: HzBlock, expr: HzLiteralExpr): void {
    const literal = expr.value
    if (literal instanceof HzBoolLiteral) {
      literal.value = literal.raw === SoftKeyword.true
    } else if (literal instanceof HzStringLiteral) {
      literal.value = literal.raw
    } else if (literal instanceof HzNumberLiteral) {
      literal.value = Number(literal.raw)
    }
  }
  function visitVarExpr(parent: HzBlock, expr: HzVarExpr): void {
    const name = expr.name
    if (!parent.findSymbol(name)) {
      throw new SemanticAnalyzeError(`${name} isn't declared`, expr)
    }
  }
  function visitNullaryFuncCallExpr(parent: HzBlock, expr: HzNullaryFuncCallExpr) {
    if (expr.caller) {
      visitExpr(parent, expr.caller)
    }
    expr.selector
  }
}

export class SemanticAnalyzeError extends Error {
  constructor(message: string, cause: unknown) {
    super(message)
    this.cause = cause
    this.name = this.constructor.name
  }
}
