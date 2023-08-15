import { HzFuncDecl, HzNaryFuncDecl, HzObjDecl, HzVarDecl, getFuncSignature } from "../parse/declaration.js"
import { HzBinaryExpr, HzExpr, HzLiteralExpr, HzNaryFuncCallExpr, HzNullaryFuncCallExpr, HzVarExpr } from "../parse/expr.js"
import { HzFileDef } from "../parse/file.js"
import { HzBoolLiteral, HzNumberLiteral, HzStringLiteral } from "../parse/literal.js"
import { HzBreakStatmt, HzCodeBlock, HzContinueStatmt, HzExprStatmt, HzIfStatmt, HzInitStatmt, HzReturnStatmt, HzStatmt, HzWhileStatmt } from "../parse/statement.js"
import { SoftKeyword } from "../lex/token.js"
import { ASTNode, BinaryExprNode, BlockNode, BreakStatementNode, ClassMethodNode, CtorNode, DynamicFuncCallExprNode, ExprNode, ExprStatementNode, FieldNode, FileNode, FuncCallExprNode, FuncNode, IfStatementNode, InitStatementNode, LiteralExprNode, LocalVarNode, ObjMethodNode, ObjNode, ParamNode, RefExprNode, ReturnStatementNode, SelfRefNode, StatementNode, WhileStatementNode } from "./node.js"
type NodeLinker<T> = (node: T) => void

export function semanticAnalyze(fileDef: HzFileDef): FileNode {
  const fileNode = new FileNode()
  // Defining symbols
  for (const topLevel of fileDef.topLevels) {
    if (topLevel instanceof HzObjDecl) {
      const objNode = new ObjNode(topLevel.name)
      fileNode.defineLocal(objNode)
      buildObjDecl(objNode, topLevel)
    } else if (topLevel instanceof HzFuncDecl) {
      const funNode = new FuncNode(topLevel.signature)
      fileNode.defineLocal(funNode)
      buildFuncDecl(funNode, topLevel)
    } else if (topLevel instanceof HzExprStatmt) {
      const exprStatmt = new ExprStatementNode()
      fileNode.addStatement(exprStatmt)
      buildExprStatmt(exprStatmt, topLevel)
    } else if (topLevel instanceof HzInitStatmt) {
      const initNode = new InitStatementNode()
      fileNode.addStatement(initNode)
      buildInitStatmt(initNode, topLevel)
    } else if (Array.isArray(topLevel)) {
      for (const varDecl of topLevel) {
        if (varDecl instanceof HzVarDecl) {
          const local = new LocalVarNode(varDecl.name)
          fileNode.defineLocal(local)
        }
      }
    }
  }
  return fileNode
}

function buildObjDecl(node: ObjNode, obj: HzObjDecl): void {
  for (const field of obj.fields) {
    node.defineField(new FieldNode(field.name))
  }
  for (const ctor of obj.ctors) {
    const ctorNode = new CtorNode(ctor.signature)
    node.defineCtor(ctorNode)
    buildCtorDecl(ctorNode, ctor)
  }
  for (const method of obj.objMethods) {
    const methodNode = new ObjMethodNode(method.signature)
    node.defineObjMethod(methodNode)
    buildObjMethodDecl(methodNode, method)
  }

  for (const method of obj.classMethods) {
    const methodNode = new ClassMethodNode(method.signature)
    node.defineClassMethod(methodNode)
    buildClassMethodDecl(methodNode, method)
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
  node.defBody(codeBlockNode)
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

function buildClassMethodDecl(node: ClassMethodNode, method: HzFuncDecl): void {
  if (method instanceof HzNaryFuncDecl) {
    for (const { selector, param } of method.selectors) {
      const paramNode = new ParamNode(param ?? selector)
      node.defParam(paramNode)
    }
  }
  const codeBlockNode = new BlockNode()
  node.defBody(codeBlockNode)
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
  const link = (sub: StatementNode) => node.addStatement(sub)
  for (const local of block.locals) {
    node.defineLocal(new LocalVarNode(local.name))
  }
  for (const statmt of block) {
    buildStatmt(statmt, link)
  }
}

function buildStatmt(statmt: HzStatmt, link: NodeLinker<StatementNode>): void {
  if (statmt instanceof HzIfStatmt) {
    const ifNode = new IfStatementNode()
    link(ifNode)
    buildIfStatmt(ifNode, statmt)
  } else if (statmt instanceof HzWhileStatmt) {
    const whileNode = new WhileStatementNode()
    link(whileNode)
    buildWhileStatmt(whileNode, statmt)
  } else if (statmt instanceof HzInitStatmt) {
    const initNode = new InitStatementNode()
    link(initNode)
    buildInitStatmt(initNode, statmt)
  } else if (statmt instanceof HzExprStatmt) {
    const exprStatmtNode = new ExprStatementNode()
    link(exprStatmtNode)
    buildExprStatmt(exprStatmtNode, statmt)
  } else if (statmt instanceof HzReturnStatmt) {
    const returnNode = new ReturnStatementNode()
    link(returnNode)
    buildReturnStatmt(returnNode, statmt)
  } else if (statmt instanceof HzBreakStatmt) {
    const breakNode = new BreakStatementNode()
    link(breakNode)
  } else if (statmt instanceof HzContinueStatmt) {
    const continueNode = new BreakStatementNode()
    link(continueNode)
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
  } else if (expr instanceof HzVarExpr) {
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
function buildLiteralExpr(node: LiteralExprNode, expr: HzLiteralExpr) {
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
