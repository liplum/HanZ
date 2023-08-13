import { HzFuncDecl, HzNaryFuncDecl, HzNullaryFuncDecl, HzObjDecl, HzVarDecl, getFuncSignature } from "../parse/declaration.js"
import { HzBinaryExpr, HzExpr, HzLiteralExpr, HzNaryFuncCallExpr, HzNullaryFuncCallExpr, HzVarExpr } from "../parse/expr.js"
import { HzFileDef, TopLevel } from "../parse/file.js"
import { HzBoolLiteral, HzNumberLiteral, HzStringLiteral } from "../parse/literal.js"
import { HzCodeBlock, HzExprStatmt, HzIfStatmt, HzInitStatmt, HzReturnStatmt, HzStatmt, HzVarDeclStatmt, HzWhileStatmt } from "../parse/statement.js"
import { SoftKeyword } from "../lex/token.js"
import { ASTNode, BlockNode, CtorNode, ExprNode, ExprStatementNode, FieldNode, FuncNode, IfStatementNode, LiteralNode, LocalVarNode, ObjMethodNode, ObjNode, RefExprNode, ReturnStatementNode, SelfRefNode, StatementNode, WhileStatementNode } from "./node.js"

/**
 * Semantic analysis consists of two phrases:
 * 1. Building AST partially and defining symbols(variables, functions, methods, objects,constructors).
 */
export function semanticAnalyze(fileDef: HzFileDef): BlockNode {
  const file = new BlockNode()
  // Defining symbols
  for (const topLevel of fileDef.topLevels) {
    if (topLevel instanceof HzObjDecl) {
      const objNode = new ObjNode(topLevel.name)
      file.defineLocal(objNode)
      buildObjDecl(objNode, topLevel)
    } else if (topLevel instanceof HzFuncDecl) {
      const funNode = new FuncNode(topLevel.signature)
      file.defineLocal(funNode)
      buildFuncDecl(funNode, topLevel)
    } else if (topLevel instanceof HzExprStatmt) {
      buildExprStatmt(file, topLevel)
    } else if (topLevel instanceof HzInitStatmt) {
      visitInitStatmt(file, topLevel)
    }
  }
  return file
}

function buildObjDecl(node: ObjNode, obj: HzObjDecl): void {
  for (const field of obj.fields) {
    for (const name of field.names) {
      node.defineMember(new FieldNode(name))
    }
  }
  for (const ctor of obj.ctors) {
    const ctorNode = new CtorNode(ctor.signature)
    node.defineMember(ctorNode)
    buildCtorDecl(ctorNode, ctor)
  }
  for (const method of obj.objMethods) {
    const methodNode = new ObjMethodNode(method.signature)
    node.defineMember(methodNode)
    buildObjMethodDecl(methodNode, method)
  }
}

function buildCtorDecl(node: CtorNode, ctor: HzFuncDecl): void {
  if (ctor instanceof HzNaryFuncDecl) {
    for (const { selector, param } of ctor.selectors) {
      const paramNode = new LocalVarNode(param ?? selector)
      node.defParam(paramNode)
    }
  }
  const codeBlockNode = new BlockNode()
  buildCodeBlock(codeBlockNode, ctor.body)
}

function buildObjMethodDecl(node: ObjMethodNode, method: HzFuncDecl): void {
  if (method instanceof HzNaryFuncDecl) {
    for (const { selector, param } of method.selectors) {
      const paramNode = new LocalVarNode(param ?? selector)
      node.defParam(paramNode)
    }
  }
  const codeBlockNode = new BlockNode()
  node.defBody(codeBlockNode)
  codeBlockNode.defineLocal(new SelfRefNode())
  buildCodeBlock(codeBlockNode, method.body)
}

function buildFuncDecl(node: FuncNode, func: HzFuncDecl): void {
  if (func instanceof HzNaryFuncDecl) {
    for (const { selector, param } of func.selectors) {
      const paramNode = new LocalVarNode(param ?? selector)
      node.defParam(paramNode)
    }
  }
  const codeBlockNode = new BlockNode()
  node.defBody(codeBlockNode)
  buildCodeBlock(codeBlockNode, func.body)
}

function buildCodeBlock(node: BlockNode, block: HzCodeBlock): void {
  for (const statmt of block) {
    buildStatmt(statmt)
  }
}

function buildStatmt(statmt: HzStatmt, parent: BlockNode): void {
  if (statmt instanceof HzIfStatmt) {
    const ifNode = new IfStatementNode()
    buildIfStatmt(ifNode, statmt)
  } else if (statmt instanceof HzWhileStatmt) {
    visitWhileStatmt(statmt)
  } else if (statmt instanceof HzInitStatmt) {
    visitInitStatmt(statmt)
  } else if (statmt instanceof HzExprStatmt) {
    const exprStatmtNode = new ExprStatementNode()
    buildExprStatmt(exprStatmtNode, statmt)
  } else if (statmt instanceof HzReturnStatmt) {
    visitReturnStatmt(statmt)
  } else if (statmt instanceof HzVarDeclStatmt) {
    visitVarDeclStatmt(statmt)
  }
}

function buildIfStatmt(node: IfStatementNode, statmt: HzIfStatmt): IfStatementNode {
  buildExpr(statmt.condition, (sub) => node.defineCondition(sub))
  // consequent
  const consequentNode = new BlockNode()
  node.defineConsequent(consequentNode)
  buildCodeBlock(consequentNode, statmt.consequent)
  // alternate
  if (statmt.alternate) {
    const alternateNode = new BlockNode()
    node.defineAlternate(alternateNode)
    buildCodeBlock(alternateNode, statmt.alternate)
  }
  return node
}

function visitWhileStatmt(node: WhileStatementNode, statmt: HzWhileStatmt): void {
  buildExpr(statmt.condition, (sub) => node.defineCondition(sub))
  const bodyNode = new BlockNode()
  buildCodeBlock(bodyNode, statmt.body)
}

function buildExprStatmt(node: ExprStatementNode, statmt: HzExprStatmt): void {
  buildExpr(statmt.expr, (sub) => node.defineExpr(sub))
}

function visitReturnStatmt(node: ReturnStatementNode, statmt: HzReturnStatmt): void {
  buildExpr(statmt.value, (sub) => node.defValue(sub))
}

function visitInitStatmt(node:,init: HzInitStatmt): void {
  parent.defineVar(init.name)
  buildExpr(init.value)
}

function visitVarDeclStatmt(statmt: HzVarDeclStatmt): void {
  visitVarDecl(statmt.declare)
}

function visitVarDecl(decl: HzVarDecl) {
  for (const name of decl.names) {
    parent.defineVar(name)
  }
}

type NodeLinker<T> = (node: T) => void
function buildExpr(expr: HzExpr, linker: NodeLinker<ExprNode>): void {
  if (expr instanceof HzLiteralExpr) {
    buildLiteralExpr(expr, linker)
  } else if (expr instanceof HzVarExpr) {
    buildVarExpr(expr, linker)
  } else if (expr instanceof HzNullaryFuncCallExpr) {
    buildNullaryFuncCallExpr(expr, linker)
  } else if (expr instanceof HzNaryFuncCallExpr) {
    buildNaryFuncCallExpr(expr, linker)
  } else if (expr instanceof HzBinaryExpr) {
    buildBinaryExpr(expr, linker)
  }
}
function buildLiteralExpr(expr: HzLiteralExpr, linker: NodeLinker<ExprNode>): LiteralNode {
  const node = new LiteralNode()
  linker(node)
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

function buildVarExpr(expr: HzVarExpr, linker: NodeLinker<ExprNode>): RefExprNode {
  const name = expr.name
  const ref = parent.findRef(name)
  if (ref === undefined) {
    throw new SemanticAnalyzeError(`${name} not declared`, expr)
  }
  return new RefExprNode(ref)
}

function buildNullaryFuncCallExpr(expr: HzNullaryFuncCallExpr, linker: NodeLinker<ExprNode>): void {
  if (expr.caller) {
    buildExpr(expr.caller)
  }
  // if a function doesn't have a caller, it's not a method, check if it exists.
  if (!expr.caller) {
    if (!parent.findFunc(getFuncSignature(expr.selector))) {
      throw new SemanticAnalyzeError("Function not declared", expr)
    }
  }
}
function buildNaryFuncCallExpr(expr: HzNaryFuncCallExpr, linker: NodeLinker<ExprNode>): void {
  if (expr.caller) {
    buildExpr(expr.caller)
  }
  for (const { arg } of expr.selectors) {
    buildExpr(arg)
  }
  // if a function doesn't have a caller, it's not a method, check if it exists.
  if (!expr.caller) {
    if (!parent.findFunc(getFuncSignature(expr.selectors))) {
      throw new SemanticAnalyzeError("Function not declared", expr)
    }
  }
}
function buildBinaryExpr(expr: HzBinaryExpr, linker: NodeLinker<ExprNode>): void {
  buildExpr(expr.left)
  buildExpr(expr.right)
}

export class SemanticAnalyzeError extends Error {
  constructor(message: string, cause: unknown) {
    super(message)
    this.cause = cause
    this.name = this.constructor.name
  }
}
