import { HzFuncDecl, HzNaryFuncDecl, HzNullaryFuncDecl, HzObjDecl, HzVarDecl, getFuncSignature } from "../parse/declaration.js"
import { HzBinaryExpr, HzExpr, HzLiteralExpr, HzNaryFuncCallExpr, HzNullaryFuncCallExpr, HzVarExpr } from "../parse/expr.js"
import { HzFileDef, TopLevel } from "../parse/file.js"
import { HzBoolLiteral, HzNumberLiteral, HzStringLiteral } from "../parse/literal.js"
import { HzCodeBlock, HzExprStatmt, HzIfStatmt, HzInitStatmt, HzReturnStatmt, HzStatmt, HzVarDeclStatmt, HzWhileStatmt } from "../parse/statement.js"
import { SoftKeyword } from "../lex/token.js"
import { ASTNode, BlockNode, CtorNode, ExprNode, FieldNode, FuncNode, IfStatementNode, LiteralNode, LocalVarNode, ObjMethodNode, ObjNode, RefExprNode, StatementNode, WhileStatementNode } from "./node.js"

export function semanticAnalyze(fileDef: HzFileDef): BlockNode {
  const file = new BlockNode()
  for (const topLevel of fileDef.topLevels) {
    if (topLevel instanceof HzObjDecl) {
      visitObjDecl(file, topLevel)
    } else if (topLevel instanceof HzFuncDecl) {
      visitFuncDecl(topLevel)
    } else if (topLevel instanceof HzExprStatmt) {
      visitExprStatmt(topLevel)
    } else if (topLevel instanceof HzInitStatmt) {
      visitInitStatmt(topLevel)
    }
  }
  return file

  function visitObjDecl(parent: BlockNode, obj: HzObjDecl): void {
    const node = new ObjNode(obj.name)
    parent.defineLocal(node)
    for (const field of obj.fields) {
      for (const name of field.names) {
        node.defineMember(new FieldNode(name))
      }
    }
    for (const ctor of obj.ctors) {
      visitCtorDecl(node, ctor)
    }
    for (const method of obj.objMethods) {
      visitObjMethodDecl(node, method)
    }
  }

  function visitCtorDecl(parent: ObjNode, ctor: HzFuncDecl): void {
    const node = new CtorNode(ctor.signature)
    parent.defineMember(node)
    if (ctor instanceof HzNaryFuncDecl) {
      for (const { selector, param } of ctor.selectors) {
        node.defParam(new LocalVarNode(param ?? selector))
      }
    }
    visitCodeBlock(node, ctor.body)
  }

  function visitObjMethodDecl(parent: ObjNode, method: HzFuncDecl): void {
    const node = new ObjMethodNode(method.signature)
    parent.defineMember(node)
    if (method instanceof HzNaryFuncDecl) {
      for (const { selector, param } of method.selectors) {
        node.defParam(new LocalVarNode(param ?? selector))
      }
    }
    visitCodeBlock(node, method.body)
  }

  function visitFuncDecl(parent: ASTNode, func: HzFuncDecl): FuncNode {
    const node = new FuncNode(func.signature)
    if (parent instanceof BlockNode) {
      parent.defineLocal(node)
    } else if (parent instanceof ObjNode) {
      parent.defineMember(node)
    }
    if (func instanceof HzNaryFuncDecl) {
      for (const { selector, param } of func.selectors) {
        node.defParam(new LocalVarNode(param ?? selector))
      }
    }
    node.block = visitCodeBlock(func.body, node)
    return node
  }

  function visitCodeBlock(parent: ASTNode, block: HzCodeBlock): void {
    if (parent instanceof BlockNode) {

    }
    const node = new BlockNode()
    node.parent = parent
    for (const statmt of block) {
      visitStatmt(statmt)
    }
    return node
  }

  function visitStatmt(statmt: HzStatmt): StatementNode {
    if (statmt instanceof HzIfStatmt) {
      return visitIfStatmt(statmt)
    } else if (statmt instanceof HzWhileStatmt) {
      visitWhileStatmt(statmt)
    } else if (statmt instanceof HzInitStatmt) {
      visitInitStatmt(statmt)
    } else if (statmt instanceof HzExprStatmt) {
      visitExprStatmt(statmt)
    } else if (statmt instanceof HzReturnStatmt) {
      visitReturnStatmt(statmt)
    } else if (statmt instanceof HzVarDeclStatmt) {
      visitVarDeclStatmt(statmt)
    }
  }

  function visitIfStatmt(statmt: HzIfStatmt): IfStatementNode {
    const node = new IfStatementNode()
    node.condition = visitExpr(statmt.condition, node)
    node.consequent = visitCodeBlock(statmt.consequent, node)
    if (statmt.alternate) {
      node.alternate = visitCodeBlock(statmt.alternate, node)
    }
    return node
  }

  function visitWhileStatmt(statmt: HzWhileStatmt, parent: ASTNode): void {
    const node = new WhileStatementNode()
    visitExpr(statmt.condition)
    visitCodeBlock(statmt.body)
  }

  function visitExprStatmt(statmt: HzExprStatmt): void {
    visitExpr(statmt.expr)
  }

  function visitReturnStatmt(statmt: HzReturnStatmt): void {
    visitExpr(statmt.value)
  }

  function visitInitStatmt(init: HzInitStatmt): void {
    parent.defineVar(init.name)
    visitExpr(init.value)
  }

  function visitVarDeclStatmt(statmt: HzVarDeclStatmt): void {
    visitVarDecl(statmt.declare)
  }

  function visitVarDecl(decl: HzVarDecl) {
    for (const name of decl.names) {
      parent.defineVar(name)
    }
  }

  function visitExpr(expr: HzExpr, parent: ASTNode): ExprNode {
    if (expr instanceof HzLiteralExpr) {
      return visitLiteralExpr(expr)
    } else if (expr instanceof HzVarExpr) {
      return visitVarExpr(expr, parent)
    } else if (expr instanceof HzNullaryFuncCallExpr) {
      visitNullaryFuncCallExpr(expr)
    } else if (expr instanceof HzNaryFuncCallExpr) {
      visitNaryFuncCallExpr(expr)
    } else if (expr instanceof HzBinaryExpr) {
      visitBinaryExpr(expr)
    }
  }
  function visitLiteralExpr(expr: HzLiteralExpr): LiteralNode {
    const node = new LiteralNode()
    const literal = expr.value
    node.raw = literal.raw
    if (literal instanceof HzBoolLiteral) {
      node.value = literal.raw === SoftKeyword.true
    } else if (literal instanceof HzStringLiteral) {
      node.value = literal.raw
    } else if (literal instanceof HzNumberLiteral) {
      node.value = Number(literal.raw)
    }
    return node
  }

  function visitVarExpr(expr: HzVarExpr, parent: ASTNode): RefExprNode {
    const name = expr.name
    const ref = parent.findRef(name)
    if (ref === undefined) {
      throw new SemanticAnalyzeError(`${name} not declared`, expr)
    }
    return new RefExprNode(ref)
  }

  function visitNullaryFuncCallExpr(expr: HzNullaryFuncCallExpr): void {
    if (expr.caller) {
      visitExpr(expr.caller)
    }
    // if a function doesn't have a caller, it's not a method, check if it exists.
    if (!expr.caller) {
      if (!parent.findFunc(getFuncSignature(expr.selector))) {
        throw new SemanticAnalyzeError("Function not declared", expr)
      }
    }
  }
  function visitNaryFuncCallExpr(expr: HzNaryFuncCallExpr): void {
    if (expr.caller) {
      visitExpr(expr.caller)
    }
    for (const { arg } of expr.selectors) {
      visitExpr(arg)
    }
    // if a function doesn't have a caller, it's not a method, check if it exists.
    if (!expr.caller) {
      if (!parent.findFunc(getFuncSignature(expr.selectors))) {
        throw new SemanticAnalyzeError("Function not declared", expr)
      }
    }
  }
  function visitBinaryExpr(expr: HzBinaryExpr): void {
    visitExpr(expr.left)
    visitExpr(expr.right)
  }
}

export class SemanticAnalyzeError extends Error {
  constructor(message: string, cause: unknown) {
    super(message)
    this.cause = cause
    this.name = this.constructor.name
  }
}
