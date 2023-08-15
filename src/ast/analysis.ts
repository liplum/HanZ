import { HzFuncDecl, HzNaryFuncDecl, HzObjDecl, HzVarDecl, getFuncSignature } from "../parse/declaration.js"
import { HzBinaryExpr, HzExpr, HzLiteralExpr, HzNaryFuncCallExpr, HzNullaryFuncCallExpr, HzRefExpr } from "../parse/expr.js"
import { HzFileDef } from "../parse/file.js"
import { HzBoolLiteral, HzNumberLiteral, HzStringLiteral } from "../parse/literal.js"
import { HzBreakStatmt, HzCodeBlock, HzContinueStatmt, HzExprStatmt, HzIfStatmt, HzInitStatmt, HzReturnStatmt, HzStatmt, HzWhileStatmt } from "../parse/statement.js"
import { SoftKeyword } from "../lex/token.js"
import { ASTNode, BinaryExprNode, BlockNode, BreakStatementNode, ClassMethodNode, CtorNode, DynamicFuncCallExprNode, ExprNode, ExprStatementNode, FieldNode, FileNode, FuncCallExprNode, FuncNode, IfStatementNode, InitStatementNode, LiteralExprNode, LocalVarNode, ObjMethodNode, ObjNode, ParamNode, RefExprNode, ReturnStatementNode, SelfRefNode, StatementNode, WhileStatementNode } from "./node.js"
type NodeLinker<T> = (node: T) => void

export function semanticAnalyze(fileDef: HzFileDef): FileNode {
  const fileNode = new FileNode()
  // Defining symbols

  return fileNode
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
  for (let cur = node.parent; cur !== undefined; cur = cur.parent) {
    if (cur instanceof BlockNode) {
      cur.defineLocal(initVar)
      break
    }
  }
  node.lvalue = initVar
  buildExpr(init.value, node, sub => node.defRvalue(sub))
}

function buildExpr(expr: HzExpr, parent: ASTNode, link: NodeLinker<ExprNode>): void {
  if (expr instanceof HzLiteralExpr) {
    const node = new LiteralExprNode()
    link(node)
    buildLiteralExpr(node, expr)
  } else if (expr instanceof HzRefExpr) {
    const varRef = parent.findRef(expr.name)
    if (varRef === undefined) throw new SemanticAnalyzeError(`${expr.name} not declared`, expr)
    const node = new RefExprNode(varRef)
    link(node)
  } else if (expr instanceof HzNullaryFuncCallExpr) {
    const signature = getFuncSignature(expr.selector)
    const func = parent.findRef(signature)
    let node: FuncCallExprNode | DynamicFuncCallExprNode
    if (func instanceof FuncNode) {
      node = new FuncCallExprNode()
      node.setFunc(func)
    } else {
      node = new DynamicFuncCallExprNode()
      node.funcName = signature
    }
    link(node)
    if (expr.caller) {
      buildExpr(expr.caller, node, caller => node.setCaller(caller))
    }
  } else if (expr instanceof HzNaryFuncCallExpr) {
    const signature = getFuncSignature(expr.selectors)
    let node: FuncCallExprNode | DynamicFuncCallExprNode
    const func = parent.findRef(signature)
    if (func instanceof FuncNode) {
      node = new FuncCallExprNode()
      node.setFunc(func)
    } else {
      node = new DynamicFuncCallExprNode()
      node.funcName = signature
    }
    link(node)
    if (expr.caller) {
      buildExpr(expr.caller, node, caller => node.setCaller(caller))
    }
    for (const arg of expr.selectors) {
      buildExpr(arg.arg, node, arg => node.addArg(arg))
    }
  } else if (expr instanceof HzBinaryExpr) {
    const node = new BinaryExprNode(expr.op)
    link(node)
    buildBinaryExpr(node, expr)
  }
}

export class SemanticAnalyzeError extends Error {
  constructor(message: string, cause: unknown) {
    super(message)
    this.cause = cause
    this.name = this.constructor.name
  }
}
