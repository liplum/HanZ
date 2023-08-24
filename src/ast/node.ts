import { Keyword, Op } from "../lex/token.js"
import { HzObjDecl, HzFuncDecl, HzVarDecl, HzNaryFuncDecl, getFuncSignature } from "../parse/declaration.js"
import { HzFileDef } from "../parse/file.js"
import { HzBreakStatmt, HzCodeBlock, HzContinueStatmt, HzExprStatmt, HzIfStatmt, HzInitStatmt, HzReturnStatmt, HzStatmt, HzWhileStatmt } from "../parse/statement.js"
import { HzBinaryExpr, HzExpr, HzFuncCallExpr, HzLiteralExpr, HzNaryFuncCallExpr, HzNullaryFuncCallExpr, HzRefExpr } from "../parse/expr.js"
import { LiteralType } from "../parse/literal.js"

export type ASTNodeClass<T = unknown> = { new(...args: unknown[]): T }
export abstract class ASTNode {
  parent?: ASTNode
  abstract get isLeaf(): boolean
  *children(): Iterable<ASTNode> { }
  build(): void { }
  link(): void { }
  findRef(name: string): RefNode | undefined {
    return this.parent?.findRef(name)
  }
  hasAncestorOf(clz: ASTNodeClass<unknown>): boolean {
    for (let cur = this.parent; cur !== undefined; cur = cur.parent) {
      if (cur instanceof clz) return true
    }
    return false
  }
}

export class BlockNode extends ASTNode {
  locals: Map<string, RefNode> = new Map()
  statements: StatementNode[] = []
  def: HzCodeBlock
  constructor(def: HzCodeBlock) {
    super()
    this.def = def
  }
  findRef(name: string): RefNode | undefined {
    return this.locals.get(name) ?? this.parent?.findRef(name)
  }
  defineLocal(local: LocalVarNode): void {
    if (this.locals.has(local.name))
      throw new ASTNodeDefinedError("Local variable already defined in block", this, local)
    local.parent = this
    this.locals.set(local.name, local)
  }
  addStatement(statement: StatementNode): true {
    this.statements.push(statement)
    statement.parent = this
    return true
  }
  get isLeaf(): boolean {
    return false
  }
  *children(): Iterable<ASTNode> {
    yield* this.locals.values()
    yield* this.statements.values()
  }
  build(): void {
    for (const local of this.def.locals) {
      this.defineLocal(new LocalVarNode(local.name))
    }
    for (const statmt of this.def.statements) {
      const node = makeStatementNode(statmt)
      this.addStatement(node)
    }
  }
}

export class FileNode extends ASTNode {
  declare parent: undefined
  locals: Map<string, ObjNode | FuncNode | LocalVarNode> = new Map()
  def: HzFileDef
  statements: StatementNode[] = []
  constructor(def: HzFileDef) {
    super()
    this.def = def
  }
  findRef(name: string): ObjNode | FuncNode | LocalVarNode | undefined {
    return this.locals.get(name)
  }
  defineLocal(symbol: ObjNode | FuncNode | LocalVarNode): void {
    if (this.locals.has(symbol.name))
      throw new ASTNodeDefinedError("Top-level already defined in file", this, symbol)
    symbol.parent = this
    this.locals.set(symbol.name, symbol)
  }
  addStatement(statement: StatementNode): true {
    this.statements.push(statement)
    statement.parent = this
    return true
  }
  get isLeaf(): boolean {
    return false
  }
  *children(): Iterable<ASTNode> {
    yield* this.locals.values()
    yield* this.statements.values()
  }
  build(): void {
    for (const topLevel of this.def.topLevels) {
      if (topLevel instanceof HzObjDecl) {
        this.defineLocal(new ObjNode(topLevel))
      } else if (topLevel instanceof HzFuncDecl) {
        this.defineLocal(new FuncNode(topLevel))
      } else if (topLevel instanceof HzExprStatmt) {
        this.addStatement(new ExprStatementNode(topLevel))
      } else if (topLevel instanceof HzInitStatmt) {
        this.addStatement(new InitStatementNode(topLevel))
      } else if (Array.isArray(topLevel)) {
        for (const varDecl of topLevel) {
          if (varDecl instanceof HzVarDecl) {
            this.defineLocal(new LocalVarNode(varDecl.name))
          }
        }
      }
    }
  }
}

export abstract class RefNode extends ASTNode {
  name: string
  constant: boolean = false
  constructor(name: string) {
    super()
    this.name = name
  }
}

export class LocalVarNode extends RefNode {
  constructor(name: string) {
    super(name)
  }
  get isLeaf(): boolean {
    return true
  }
}

export class ParamNode extends LocalVarNode {
  declare parent: FuncNode
}

export class FieldNode extends RefNode {
  declare parent: ObjNode
  constructor(name: string) {
    super(name)
  }
  get isLeaf(): boolean {
    return true
  }
}

export class ObjNode extends RefNode {
  ctors: Map<string, CtorNode> = new Map()
  fields: Map<string, FieldNode> = new Map()
  objMethods: Map<string, ObjMethodNode> = new Map()
  classMethods: Map<string, ClassMethodNode> = new Map()
  def: HzObjDecl
  constructor(def: HzObjDecl) {
    super(def.name)
    this.constant = true
    this.def = def
  }
  findRef(name: string): RefNode | undefined {
    return this.fields.get(name)
      ?? this.ctors.get(name)
      ?? this.objMethods.get(name)
      ?? this.classMethods.get(name)
      ?? this.parent?.findRef(name)
  }
  defineCtor(ctor: CtorNode): void {
    if (this.ctors.has(ctor.name))
      throw new ASTNodeDefinedError("Constructor already defined in object", this, ctor)
    ctor.parent = this
    this.ctors.set(ctor.name, ctor)
  }
  defineField(field: FieldNode): void {
    if (this.fields.has(field.name))
      throw new ASTNodeDefinedError("Field already defined in object", this, field)
    field.parent = this
    this.fields.set(field.name, field)
  }
  defineObjMethod(objMethod: ObjMethodNode): void {
    if (this.objMethods.has(objMethod.name))
      throw new ASTNodeDefinedError("Object method already defined in object", this, objMethod)
    objMethod.parent = this
    this.objMethods.set(objMethod.name, objMethod)
  }
  defineClassMethod(classMethod: ClassMethodNode): void {
    if (this.classMethods.has(classMethod.name))
      throw new ASTNodeDefinedError("Class method already defined in object", this, classMethod)
    classMethod.parent = this
    this.classMethods.set(classMethod.name, classMethod)
  }
  get isLeaf(): boolean {
    return false
  }
  *children(): Iterable<ASTNode> {
    yield* this.fields.values()
    yield* this.ctors.values()
    yield* this.classMethods.values()
    yield* this.objMethods.values()
  }
  build(): void {
    for (const field of this.def.fields) {
      this.defineField(new FieldNode(field.name))
    }
    for (const ctor of this.def.ctors) {
      this.defineCtor(new CtorNode(ctor))
    }
    for (const method of this.def.objMethods) {
      this.defineObjMethod(new ObjMethodNode(method))
    }
    for (const method of this.def.classMethods) {
      this.defineClassMethod(new ClassMethodNode(method))
    }
  }
}

export class FuncNode extends RefNode {
  params: Map<string, ParamNode> = new Map()
  body: BlockNode
  def: HzFuncDecl
  constructor(def: HzFuncDecl) {
    super(def.signature)
    this.def = def
    this.constant = true
  }
  defParam(param: ParamNode): void {
    if (this.params.has(param.name))
      throw new ASTNodeDefinedError("Member already defined in function", this, param)
    param.parent = this
    this.params.set(param.name, param)
  }
  defBody(body: BlockNode): void {
    if (this.body)
      throw new ASTNodeDefinedError("Body already defined in function", this, body)
    this.body = body
    body.parent = this
  }
  findRef(name: string): RefNode | undefined {
    return this.params.get(name) ?? this.parent?.findRef(name)
  }
  get isLeaf(): boolean {
    return false
  }
  *children(): Iterable<ASTNode> {
    yield* this.params.values()
    yield this.body
  }
  build(): void {
    if (this.def instanceof HzNaryFuncDecl) {
      for (const { selector, param } of this.def.selectors) {
        this.defParam(new ParamNode(param ?? selector))
      }
    }
    this.defBody(new BlockNode(this.def.body))
  }
}

export class CtorNode extends FuncNode {
  declare parent: ObjNode
}

export class ClassMethodNode extends FuncNode {
  declare parent: ObjNode
}

export class ObjMethodNode extends FuncNode {
  declare parent: ObjNode
  findRef(name: string): RefNode | undefined {
    if (name === "self") return SelfRefNode.instance
    return super.findRef(name)
  }
}

export class SelfRefNode extends LocalVarNode {
  static readonly instance = new SelfRefNode()
  constructor() {
    super("self")
    this.constant = true
  }
}

export abstract class ExprNode extends ASTNode {
  abstract get isSingle(): boolean
}

export class RefExprNode extends ExprNode {
  /** unowned */
  ref: RefNode
  def: HzRefExpr
  constructor(def: HzRefExpr) {
    super()
    this.def = def
  }
  get isSingle(): boolean {
    return true
  }
  get isLeaf(): boolean {
    return true
  }
  link(): void {
    const ref = this.parent?.findRef(this.def.name)
    if (ref === undefined)
      throw new SemanticAnalysisError(`${this.def.name} not declared`, this.def)
    this.ref = ref
  }
}

export class BinaryExprNode extends ExprNode {
  left: ExprNode
  op: Op
  right: ExprNode
  def: HzBinaryExpr
  constructor(def: HzBinaryExpr) {
    super()
    this.def = def
  }
  get isSingle(): boolean {
    return false
  }
  defLeft(left: ExprNode): void {
    if (this.left)
      throw new ASTNodeDefinedError("Left operand already defined in binary expr", this, left)
    this.left = left
    left.parent = this
  }
  defRight(right: ExprNode): void {
    if (this.right)
      throw new ASTNodeDefinedError("Right operand already defined in binary expr", this, right)
    this.right = right
    right.parent = this
  }
  get isLeaf(): boolean {
    return false
  }
  *children(): Iterable<ASTNode> {
    yield this.left
    yield this.right
  }
  build(): void {
    this.defLeft(makeExprNode(this.def.left))
    this.op = this.def.op
    this.defRight(makeExprNode(this.def.right))
  }
}

export class FuncCallExprNode extends ExprNode {
  caller?: ExprNode
  /** unowned */
  func: FuncNode | string
  args: ExprNode[] = []
  def: HzFuncCallExpr
  constructor(def: HzFuncCallExpr) {
    super()
    this.def = def
  }
  get isSingle(): boolean {
    return true
  }
  setCaller(caller: ExprNode) {
    if (this.caller)
      throw new ASTNodeDefinedError("call already defined in func call", this, caller)
    this.caller = caller
    caller.parent = this
  }
  setFunc(func: FuncNode | string) {
    if (this.func)
      throw new ASTNodeDefinedError("func already defined in func call", this,
        func instanceof FuncNode ? func : undefined)
    this.func = func
  }
  addArg(arg: ExprNode) {
    this.args.push(arg)
    arg.parent = this
  }
  get isLeaf(): boolean {
    return false
  }
  *children(): Iterable<ASTNode> {
    if (this.caller) yield this.caller
    yield* this.args.values()
  }
  build(): void {
    if (this.def instanceof HzNullaryFuncCallExpr) {
      if (this.def.caller) {
        this.setCaller(makeExprNode(this.def.caller))
      }
    } else if (this.def instanceof HzNaryFuncCallExpr) {
      if (this.def.caller) {
        this.setCaller(makeExprNode(this.def.caller))
      }
      for (const arg of this.def.selectors) {
        this.addArg(makeExprNode(arg.arg))
      }
    }
  }
  link(): void {
    if (this.def instanceof HzNullaryFuncCallExpr) {
      const signature = getFuncSignature(this.def.selector)
      const func = this.parent?.findRef(signature)
      this.setFunc(func instanceof FuncNode ? func : signature)
    } else if (this.def instanceof HzNaryFuncCallExpr) {
      const signature = getFuncSignature(this.def.selectors)
      const func = this.parent?.findRef(signature)
      this.setFunc(func instanceof FuncNode ? func : signature)
    }
  }
}

export class LiteralExprNode extends ExprNode {
  def: HzLiteralExpr
  raw: string
  value: unknown
  type: LiteralType
  constructor(def: HzLiteralExpr) {
    super()
    this.def = def
  }
  get isSingle(): boolean {
    return true
  }
  get isLeaf(): boolean {
    return true
  }
  build(): void {
    const literal = this.def.value
    this.type = this.def.value.type
    this.raw = literal.raw
    if (literal.type === LiteralType.bool) {
      this.value = literal.raw === Keyword.true
    } else if (literal.type === LiteralType.string) {
      this.value = literal.raw
    } else if (literal.type === LiteralType.number) {
      this.value = Number(literal.raw)
    } else if (literal.type === LiteralType.undefined) {
      this.value = undefined
    } else if (literal.type === LiteralType.null) {
      this.value = null
    }
  }
}

function makeExprNode(def: HzExpr): ExprNode {
  if (def instanceof HzLiteralExpr) {
    return new LiteralExprNode(def)
  } else if (def instanceof HzRefExpr) {
    return new RefExprNode(def)
  } else if (def instanceof HzNullaryFuncCallExpr) {
    return new FuncCallExprNode(def)
  } else if (def instanceof HzNaryFuncCallExpr) {
    return new FuncCallExprNode(def)
  } else if (def instanceof HzBinaryExpr) {
    return new BinaryExprNode(def)
  } else {
    throw new SemanticAnalysisError("Unrecognized expr definition", def)
  }
}

export abstract class StatementNode extends ASTNode {

}

export class BreakStatementNode extends StatementNode {
  def: HzBreakStatmt
  constructor(def: HzBreakStatmt) {
    super()
    this.def = def
  }
  get isLeaf(): boolean {
    return true
  }
}
export class ContinueStatementNode extends StatementNode {
  def: HzContinueStatmt
  constructor(def: HzContinueStatmt) {
    super()
    this.def = def
  }
  get isLeaf(): boolean {
    return true
  }
}

export class ExprStatementNode extends StatementNode {
  expr: ExprNode
  def: HzExprStatmt
  constructor(def: HzExprStatmt) {
    super()
    this.def = def
  }
  defineExpr(expr: ExprNode): void {
    if (this.expr)
      throw new ASTNodeDefinedError("Expr already defined in statement", this, expr)
    this.expr = expr
    expr.parent = this
  }
  get isLeaf(): boolean {
    return false
  }
  *children(): Iterable<ASTNode> {
    yield this.expr
  }
  build(): void {
    this.defineExpr(makeExprNode(this.def.expr))
  }
}

export class IfStatementNode extends StatementNode {
  condition: ExprNode
  consequent: BlockNode
  alternate?: BlockNode
  def: HzIfStatmt
  constructor(def: HzIfStatmt) {
    super()
    this.def = def
  }
  defCondition(condition: ExprNode): void {
    if (this.condition)
      throw new ASTNodeDefinedError("Condition already defined in if", this, condition)
    this.condition = condition
    condition.parent = this
  }
  defConsequent(consequent: BlockNode): void {
    if (this.consequent)
      throw new ASTNodeDefinedError("Consequent already defined in if", this, consequent)
    this.consequent = consequent
    consequent.parent = this
  }
  defAlternate(alternate: BlockNode): void {
    if (this.alternate)
      throw new ASTNodeDefinedError("Alternate already defined in if", this, alternate)
    this.alternate = alternate
    alternate.parent = this
  }
  get isLeaf(): boolean {
    return false
  }
  *children(): Iterable<ASTNode> {
    yield this.condition
    yield this.consequent
    if (this.alternate) yield this.alternate
  }
  build(): void {
    this.defCondition(makeExprNode(this.def.condition))
    // consequent
    this.defConsequent(new BlockNode(this.def.consequent))
    // alternate
    if (this.def.alternate) {
      this.defAlternate(new BlockNode(this.def.alternate))
    }
  }
}

export class WhileStatementNode extends StatementNode {
  condition: ExprNode
  body: BlockNode
  def: HzWhileStatmt
  constructor(def: HzWhileStatmt) {
    super()
    this.def = def
  }
  defCondition(condition: ExprNode): void {
    if (this.condition)
      throw new ASTNodeDefinedError("Condition already defined in while", this, condition)
    this.condition = condition
    condition.parent = this
  }
  defBody(body: BlockNode): void {
    if (this.body)
      throw new ASTNodeDefinedError("Body already defined in while", this, body)
    this.body = body
    body.parent = this
  }
  get isLeaf(): boolean {
    return false
  }
  *children(): Iterable<ASTNode> {
    yield this.condition
    yield this.body
  }
  build(): void {
    this.defCondition(makeExprNode(this.def.condition))
    this.defBody(new BlockNode(this.def.body))
  }
}

export class ReturnStatementNode extends StatementNode {
  value: ExprNode
  def: HzReturnStatmt
  constructor(def: HzReturnStatmt) {
    super()
    this.def = def
  }
  defValue(value: ExprNode): void {
    if (this.value)
      throw new ASTNodeDefinedError("Value already defined in return", this, value)
    this.value = value
    value.parent = this
  }
  get isLeaf(): boolean {
    return false
  }
  *children(): Iterable<ASTNode> {
    yield this.value
  }
  build(): void {
    this.defValue(makeExprNode(this.def.value))
  }
}

export class InitStatementNode extends StatementNode {
  /** unowned */
  lvalue: LocalVarNode
  rvalue: ExprNode
  def: HzInitStatmt
  constructor(def: HzInitStatmt) {
    super()
    this.def = def
  }
  defRvalue(rvalue: ExprNode): void {
    if (this.rvalue)
      throw new ASTNodeDefinedError("Rvalue already defined in init", this, rvalue)
    this.rvalue = rvalue
    rvalue.parent = this
  }
  get isLeaf(): boolean {
    return false
  }
  *children(): Iterable<ASTNode> {
    yield this.rvalue
  }
  build(): void {
    const initVar = new LocalVarNode(this.def.name)
    for (let cur = this.parent; cur !== undefined; cur = cur.parent) {
      if (cur instanceof BlockNode || cur instanceof FileNode) {
        cur.defineLocal(initVar)
        break
      }
    }
    this.defRvalue(makeExprNode(this.def.value))
  }
  link(): void {
    const lvalueName = this.def.name
    const lvalue = this.parent?.findRef(lvalueName)
    if (lvalue === undefined)
      throw new SemanticAnalysisError(`${lvalueName} not declared`, this.def)
    this.lvalue = lvalue
  }
}

function makeStatementNode(def: HzStatmt): StatementNode {
  if (def instanceof HzIfStatmt) {
    return new IfStatementNode(def)
  } else if (def instanceof HzWhileStatmt) {
    return new WhileStatementNode(def)
  } else if (def instanceof HzInitStatmt) {
    return new InitStatementNode(def)
  } else if (def instanceof HzExprStatmt) {
    return new ExprStatementNode(def)
  } else if (def instanceof HzReturnStatmt) {
    return new ReturnStatementNode(def)
  } else if (def instanceof HzBreakStatmt) {
    return new BreakStatementNode(def)
  } else if (def instanceof HzContinueStatmt) {
    return new BreakStatementNode(def)
  } else {
    throw new SemanticAnalysisError("Unrecognized statement definition", def)
  }
}

export class ASTNodeDefinedError extends Error {
  parent: ASTNode
  node?: ASTNode
  constructor(message: string, parent: ASTNode, node?: ASTNode) {
    super(message)
    this.name = this.constructor.name
    this.parent = parent
    this.node = node
  }
}

export class SemanticAnalysisError extends Error {
  constructor(message: string, cause: unknown) {
    super(message)
    this.name = this.constructor.name
    this.cause = cause
  }
}
