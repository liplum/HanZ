import { HzFuncDecl, HzNaryFuncDecl, HzObjDecl, getFuncSignature, getNaryFuncRepr } from "../parse/declaration.js"
import { HzBinaryExpr, HzExpr, HzLiteralExpr, HzNaryFuncCallExpr, HzNullaryFuncCallExpr, HzVarExpr } from "../parse/expr.js"
import { HzFileDef } from "../parse/file.js"
import { HzBoolLiteral, HzNumberLiteral, HzStringLiteral } from "../parse/literal.js"
import { HzCodeBlock, HzExprStatmt, HzIfStatmt, HzInitStatmt, HzReturnStatmt, HzStatmt, HzWhileStatmt } from "../parse/statement.js"
import { SoftKeyword } from "../lex/token.js"
import { ASTNode, BinaryExprNode, BlockNode, CtorNode, ExprNode, ExprStatementNode, FieldNode, FuncCallExprNode, FuncNode, IfStatementNode, InitStatementNode, LiteralNode, LocalVarNode, ObjMethodNode, ObjNode, ParamNode, RefExprNode, ReturnStatementNode, SelfRefNode, StatementNode, WhileStatementNode } from "./node.js"
type NodeLinker<T> = (node: T) => void

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
      const exprStatmt = new ExprStatementNode()
      buildExprStatmt(exprStatmt, topLevel)
    } else if (topLevel instanceof HzInitStatmt) {
      const initNode = new InitStatementNode()
      file.addStatement(initNode)
      buildInitStatmt(initNode, topLevel)
    }
  }
  return file
}

function buildObjDecl(node: ObjNode, obj: HzObjDecl): void {
  for (const field of obj.fields) {
    for (const name of field.name) {
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
      const paramNode = new ParamNode(param ?? selector)
      node.defParam(paramNode)
    }
  }
  const codeBlockNode = new BlockNode()
  buildCodeBlock(codeBlockNode, ctor.body)
}

function buildObjMethodDecl(node: ObjMethodNode, method: HzFuncDecl): void {
  if (method instanceof HzNaryFuncDecl) {
    for (const { selector, param } of method.selectors) {
      const paramNode = new ParamNode(param ?? selector)
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
      const paramNode = new ParamNode(param ?? selector)
      node.defParam(paramNode)
    }
  }
  const codeBlockNode = new BlockNode()
  node.defBody(codeBlockNode)
  buildCodeBlock(codeBlockNode, func.body)
}

function buildCodeBlock(node: BlockNode, block: HzCodeBlock): void {
  const linker = (sub: StatementNode) => node.addStatement(sub)
  for (const local of block.locals) {
    node.defineLocal(new LocalVarNode(local.name))
  }
  for (const statmt of block) {
    buildStatmt(statmt, linker)
  }
}

function buildStatmt(statmt: HzStatmt, linker: NodeLinker<StatementNode>): void {
  if (statmt instanceof HzIfStatmt) {
    const ifNode = new IfStatementNode()
    linker(ifNode)
    buildIfStatmt(ifNode, statmt)
  } else if (statmt instanceof HzWhileStatmt) {
    const whileNode = new WhileStatementNode()
    linker(whileNode)
    buildWhileStatmt(whileNode, statmt)
  } else if (statmt instanceof HzInitStatmt) {
    const initNode = new InitStatementNode()
    linker(initNode)
    buildInitStatmt(initNode, statmt)
  } else if (statmt instanceof HzExprStatmt) {
    const exprStatmtNode = new ExprStatementNode()
    linker(exprStatmtNode)
    buildExprStatmt(exprStatmtNode, statmt)
  } else if (statmt instanceof HzReturnStatmt) {
    const returnNode = new ReturnStatementNode()
    linker(returnNode)
    buildReturnStatmt(returnNode, statmt)
  }
}

function buildIfStatmt(node: IfStatementNode, statmt: HzIfStatmt): IfStatementNode {
  buildExpr(statmt.condition, node, sub => node.defineCondition(sub))
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

function buildWhileStatmt(node: WhileStatementNode, statmt: HzWhileStatmt): void {
  buildExpr(statmt.condition, node, sub => node.defineCondition(sub))
  const bodyNode = new BlockNode()
  buildCodeBlock(bodyNode, statmt.body)
}

function buildExprStatmt(node: ExprStatementNode, statmt: HzExprStatmt): void {
  buildExpr(statmt.expr, node, sub => node.defineExpr(sub))
}

function buildReturnStatmt(node: ReturnStatementNode, statmt: HzReturnStatmt): void {
  buildExpr(statmt.value, node, sub => node.defValue(sub))
}

function buildInitStatmt(node: InitStatementNode, init: HzInitStatmt): void {
  const initVar = new LocalVarNode(init.name)
  for (let cur = this.parent; cur !== undefined; cur = cur.parent) {
    if (cur instanceof BlockNode) {
      cur.defineLocal(initVar)
      break
    }
  }
  node.setLvalue(initVar)
  buildExpr(init.value, node, sub => node.defRvalue(sub))
}

function buildExpr(expr: HzExpr, parent: ASTNode, linker: NodeLinker<ExprNode>): void {
  if (expr instanceof HzLiteralExpr) {
    const node = new LiteralNode()
    linker(node)
    buildLiteralExpr(node, expr)
  } else if (expr instanceof HzVarExpr) {
    const varRef = parent.findRef(expr.name)
    if (varRef === undefined) throw new SemanticAnalyzeError(`${expr.name} not declared`, expr)
    const node = new RefExprNode(varRef)
    linker(node)
  } else if (expr instanceof HzNullaryFuncCallExpr) {
    const node = new FuncCallExprNode()
    linker(node)
    const func = parent.findRef(getFuncSignature(expr.selector))
    if (!(func instanceof FuncNode)) throw new SemanticAnalyzeError(`${expr.selector} not declared`, node)
    node.setFunc(func)
    if (expr.caller) {
      buildExpr(expr.caller, node, caller => node.setCaller(caller))
    }
  } else if (expr instanceof HzNaryFuncCallExpr) {
    const node = new FuncCallExprNode()
    linker(node)
    const func = parent.findRef(getFuncSignature(expr.selectors))
    if (!(func instanceof FuncNode)) throw new SemanticAnalyzeError(`${getNaryFuncRepr(expr.selectors)} not declared`, node)
    node.setFunc(func)
    if (expr.caller) {
      buildExpr(expr.caller, node, caller => node.setCaller(caller))
    }
    for (const arg of expr.selectors) {
      buildExpr(arg.arg, node, arg => node.addArg(arg))
    }
  } else if (expr instanceof HzBinaryExpr) {
    const node = new BinaryExprNode(expr.op)
    buildBinaryExpr(node, expr)
  }
}
function buildLiteralExpr(node: LiteralNode, expr: HzLiteralExpr) {
  const literal = expr.value
  node.raw = literal.raw
  if (literal instanceof HzBoolLiteral) {
    node.value = literal.raw === SoftKeyword.true
  } else if (literal instanceof HzStringLiteral) {
    node.value = literal.raw
  } else if (literal instanceof HzNumberLiteral) {
    node.value = Number(literal.raw)
  }
}

function buildBinaryExpr(node: BinaryExprNode, expr: HzBinaryExpr): void {
  buildExpr(expr.left, node, sub => node.defLeft(sub))
  buildExpr(expr.right, node, sub => node.defRight(sub))
}

export class SemanticAnalyzeError extends Error {
  constructor(message: string, cause: unknown) {
    super(message)
    this.cause = cause
    this.name = this.constructor.name
  }
}
