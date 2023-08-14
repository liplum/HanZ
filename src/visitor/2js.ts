import { Writable } from "stream"
import { BinaryExprNode, BlockNode, BreakStatementNode, ContinueStatementNode, CtorNode, DynamicFuncCallExprNode, ExprNode, ExprStatementNode, FieldNode, FileNode, FuncCallExprNode, FuncNode, IfStatementNode, InitStatementNode, LiteralExprNode, ObjMethodNode, ObjNode, RefExprNode, ReturnStatementNode, SelfRefNode, StatementNode, WhileStatementNode } from "../ast/node.js"

export function transpile2Js(fileNode: FileNode, output: Writable) {
  for (const symbol of fileNode.locals.values()) {
    if (symbol instanceof ObjNode) {
      genObj(symbol)
    } else if (symbol instanceof FuncNode) {
      genFuncDecl(symbol)
    }
  }
  for (const statmt of fileNode.statements) {
    genStatmt(statmt)
  }

  output.end()

  function genObj(obj: ObjNode): void {
    output.write(`class ${obj.name}{`)
    for (const ctor of obj.ctors.values()) {
      output.write(`static init$${ctor.name}`)
      genFuncParams(ctor)
      genCtorCodeBlock(ctor.body)
    }
    for (const field of obj.fields.values()) {
      output.write(`${field.name}(){return this._$${field.name};}`)
    }
    for (const method of obj.objMethods.values()) {
      output.write(`${method.name}`)
      genFuncParams(method)
      genBlock(method.body)
    }
    output.write("}")


    function genCtorCodeBlock(block: BlockNode): void {
      output.write("{")
      output.write(`const self=new ${obj.name}();`)
      for (const statmt of block.statements) {
        genStatmt(statmt)
      }
      output.write("return self;")
      output.write("}")
    }
  }

  function genFuncDecl(func: FuncNode): void {
    output.write(`function ${func.name}`)
    genFuncParams(func)
    genBlock(func.body)
  }
  function genFuncParams(func: FuncNode): void {
    const params = Array.from(func.params.values()).map(p => p.name)
    output.write("(")
    output.write(params.join(","))
    output.write(")")
  }

  function genBlock(block: BlockNode): void {
    output.write("{")
    for (const local of block.locals.values()) {
      if (local instanceof SelfRefNode) continue
      if (local.constant) {
        output.write(`const ${local.name};`)
      } else {
        output.write(`let ${local.name};`)
      }
    }
    for (const statmt of block.statements) {
      genStatmt(statmt)
    }
    output.write("}")
  }

  function genStatmt(statmt: StatementNode): void {
    if (statmt instanceof IfStatementNode) {
      genIfStatmt(statmt)
    } else if (statmt instanceof WhileStatementNode) {
      genWhileStatmt(statmt)
    } else if (statmt instanceof InitStatementNode) {
      genInitStatmt(statmt)
    } else if (statmt instanceof ExprStatementNode) {
      genExprStatmt(statmt)
    } else if (statmt instanceof ReturnStatementNode) {
      genReturnStatmt(statmt)
    } else if (statmt instanceof BreakStatementNode) {
      genBreakStatmt(statmt)
    } else if (statmt instanceof ContinueStatementNode) {
      genContinueStatmt(statmt)
    }
  }

  function genIfStatmt(statmt: IfStatementNode): void {
    output.write("if(")
    genExpr(statmt.condition)
    output.write(")")
    genBlock(statmt.consequent)
    if (statmt.alternate) {
      output.write("else")
      genBlock(statmt.alternate)
    }
  }

  function genWhileStatmt(statmt: WhileStatementNode): void {
    output.write("while(")
    genExpr(statmt.condition)
    output.write(")")
    genBlock(statmt.body)
  }
  function genExprStatmt(statmt: ExprStatementNode): void {
    genExpr(statmt.expr)
    output.write(";")
  }
  function genInitStatmt(statmt: InitStatementNode): void {
    output.write(`${statmt.lvalue.name}=`)
    genExpr(statmt.rvalue)
    output.write(";")
  }
  function genReturnStatmt(statmt: ReturnStatementNode): void {
    output.write("return ")
    genExpr(statmt.value)
    output.write(";")
  }
  function genBreakStatmt(statmt: BreakStatementNode): void {
    output.write("break;")
  }
  function genContinueStatmt(statmt: ContinueStatementNode): void {
    output.write("continue;")
  }
  function genExpr(expr: ExprNode): void {
    if (expr instanceof LiteralExprNode) {
      genLiteralExpr(expr)
    } else if (expr instanceof RefExprNode) {
      genRefExpr(expr)
    } else if (expr instanceof FuncCallExprNode) {
      genFuncCallExpr(expr)
    } else if (expr instanceof DynamicFuncCallExprNode) {
      genDynamicFuncCallExpr(expr)
    } else if (expr instanceof BinaryExprNode) {
      genBinaryExpr(expr)
    }
  }
  function genLiteralExpr(expr: LiteralExprNode) {
    output.write(expr.raw)
  }
  function genRefExpr(expr: RefExprNode) {
    const ref = expr.ref
    if (ref instanceof SelfRefNode) {
      if (expr.hasAncestorOf(ObjMethodNode)) {
        output.write("this")
      } else {
        throw new TranspileError("Unknown ref", ref)
      }
    } else if (ref instanceof FieldNode) {
      if (expr.hasAncestorOf(ObjMethodNode)) {
        output.write(`this._$${ref.name}`)
      } else if (expr.hasAncestorOf(CtorNode)) {
        output.write(`self._$${ref.name}`)
      } else {
        throw new TranspileError("Unknown ref", ref)
      }
    } else {
      output.write(expr.ref.name)
    }
  }
  function genFuncCallExpr(expr: FuncCallExprNode) {
    if (expr.caller) {
      if (!expr.caller.isSingle) output.write("(")
      genExpr(expr.caller)
      if (!expr.caller.isSingle) output.write(")")
      output.write(".")
    }
    output.write(expr.func.name)
    output.write("(")
    for (let i = 0; i < expr.args.length; i++) {
      const arg = expr.args[i]
      genExpr(arg)
      if (i < expr.args.length - 1) {
        output.write(",")
      }
    }
    output.write(")")
  }
  function genDynamicFuncCallExpr(expr: DynamicFuncCallExprNode) {
    if (expr.caller) {
      if (!expr.caller.isSingle) output.write("(")
      genExpr(expr.caller)
      if (!expr.caller.isSingle) output.write(")")
      output.write(".")
    }
    output.write(expr.funcName)
    output.write("(")
    for (let i = 0; i < expr.args.length; i++) {
      const arg = expr.args[i]
      genExpr(arg)
      if (i < expr.args.length - 1) {
        output.write(",")
      }
    }
    output.write(")")
  }
  function genBinaryExpr(expr: BinaryExprNode) {
    const isOuter = !(expr.parent instanceof ExprNode)
    if (!isOuter) output.write("(")
    genExpr(expr.left)
    output.write(expr.op)
    genExpr(expr.right)
    if (!isOuter) output.write(")")
  }
}


export class TranspileError extends Error {
  constructor(message: string, cause: unknown) {
    super(message)
    this.cause = cause
    this.name = this.constructor.name
  }
}
