import { Writable } from "stream"
import { BinaryExprNode, BlockNode, BreakStatementNode, ContinueStatementNode, ExprNode, ExprStatementNode, FieldNode, FileNode, FuncCallExprNode, FuncNode, IfStatementNode, InitStatementNode, LiteralExprNode, LocalVarNode, ObjMethodNode, ObjNode, RefExprNode, ReturnStatementNode, StatementNode, WhileStatementNode } from "../ast/node.js"

export function transpile2Js(fileNode: FileNode, output: Writable) {
  for (const symbol of fileNode.locals) {
    if (symbol instanceof ObjNode) {
      genObj(symbol)
    } else if (symbol instanceof FuncNode) {
      genFuncDecl(symbol)
    }
  }
  for (const statmt of fileNode.statements) {
    genStatmt(statmt)
  }

  function genObj(obj: ObjNode): void {
    output.write(`const obj$${obj.name}={`)
    for (const method of obj.objMethods.values()) {
      genObjMethod(method)
    }
    for (const ctor of obj.ctors.values()) {
      output.write(`init$${ctor.name}`)
      genFuncParam(ctor)
      genCtorCodeBlock(ctor.body)
    }
    output.write("}")
  }

  function genObjMethod(method: ObjMethodNode): void {
    output.write(`${method.name}`)
    genMethodParam(method)
    genBlock(method.body)
  }

  function genFuncDecl(func: FuncNode): void {
    output.write(`function ${func.name}`)
    genFuncParam(func)
    genBlock(func.body)
  }

  function genMethodParam(func: FuncNode): void {
    const params = Array.from(func.params.values()).map(p => p.name)
    params.unshift("self")
    output.write("(")
    output.write(params.join(","))
    output.write(")")
  }

  function genFuncParam(func: FuncNode): void {
    const params = Array.from(func.params.values()).map(p => p.name)
    output.write("(")
    output.write(params.join(","))
    output.write(")")
  }

  function genCtorCodeBlock(block: BlockNode): void {
    output.write("{")
    output.write("const self={};self.$class=this;")
    for (const statmt of block.statements) {
      genStatmt(statmt)
    }
    output.write("return self;")
    output.write("}")
  }

  function genBlock(block: BlockNode): void {
    output.write("{")
    for (const local of block.locals.values()) {
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
    output.write("return")
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
      genVarExpr(expr)
    } else if (expr instanceof FuncCallExprNode) {
      genFuncCallExpr(expr)
    } else if (expr instanceof BinaryExprNode) {
      genBinaryExpr(expr)
    }
  }
  function genLiteralExpr(expr: LiteralExprNode) {
    output.write(expr.raw)
  }
  function genVarExpr(expr: RefExprNode) {
    output.write(expr.ref.name)
  }
  function genFuncCallExpr(expr: FuncCallExprNode) {
    if (expr.caller) {

    }
  }
  function genBinaryExpr(expr: BinaryExprNode) {
    output.write("(")
    genExpr(expr.left)
    output.write(expr.op)
    genExpr(expr.right)
    output.write(")")
  }
}