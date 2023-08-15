import { Operator } from "../lex/token"
import { HzObjDecl, HzFuncDecl, HzVarDecl } from "../parse/declaration"
import { HzFileDef } from "../parse/file"
import { HzExprStatmt, HzInitStatmt } from "../parse/statement"

export type ASTNodeClass<T = unknown> = { new(...args: unknown[]): T }
export abstract class ASTNode {
  parent?: ASTNode
  abstract get isLeaf(): boolean
  *children(): Iterable<ASTNode> { }
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
}

export class FileNode extends BlockNode {
  declare parent: undefined
  declare locals: Map<string, ObjNode | FuncNode | LocalVarNode>
  def: HzFileDef
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
  get isLeaf(): boolean {
    return false
  }
  build() {
    for (const topLevel of this.def.topLevels) {
      if (topLevel instanceof HzObjDecl) {
        const objNode = new ObjNode(topLevel.name)
        this.defineLocal(objNode)
        buildObjDecl(objNode, topLevel)
      } else if (topLevel instanceof HzFuncDecl) {
        const funNode = new FuncNode(topLevel.signature)
        this.defineLocal(funNode)
        buildFuncDecl(funNode, topLevel)
      } else if (topLevel instanceof HzExprStatmt) {
        const exprStatmt = new ExprStatementNode()
        this.addStatement(exprStatmt)
        buildExprStatmt(exprStatmt, topLevel)
      } else if (topLevel instanceof HzInitStatmt) {
        const initNode = new InitStatementNode()
        this.addStatement(initNode)
        buildInitStatmt(initNode, topLevel)
      } else if (Array.isArray(topLevel)) {
        for (const varDecl of topLevel) {
          if (varDecl instanceof HzVarDecl) {
            const local = new LocalVarNode(varDecl.name)
            this.defineLocal(local)
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
  constructor(name: string) {
    super(name)
    this.constant = true
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
}

export class FuncNode extends RefNode {
  params: Map<string, ParamNode> = new Map()
  body: BlockNode
  constructor(name: string) {
    super(name)
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
}

export class ClassMethodNode extends FuncNode {
  declare parent: ObjNode
  constructor(name: string) {
    super(name)
    this.constant = true
  }
}

export class CtorNode extends FuncNode {
  declare parent: ObjNode
  constructor(name: string) {
    super(name)
    this.constant = true
  }
}

export class ObjMethodNode extends FuncNode {
  declare parent: ObjNode
  constructor(name: string) {
    super(name)
    this.constant = true
  }
}

export class SelfRefNode extends LocalVarNode {
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
  constructor(ref: RefNode) {
    super()
    this.ref = ref
  }
  get isSingle(): boolean {
    return true
  }
  get isLeaf(): boolean {
    return true
  }
}

export class BinaryExprNode extends ExprNode {
  left: ExprNode
  op: Operator
  right: ExprNode
  constructor(op: Operator) {
    super()
    this.op = op
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
}

export class FuncCallExprNode extends ExprNode {
  caller?: ExprNode
  /** unowned */
  func: FuncNode
  args: ExprNode[] = []
  get isSingle(): boolean {
    return true
  }
  setCaller(caller: ExprNode) {
    if (this.caller)
      throw new ASTNodeDefinedError("call already defined in func call", this, caller)
    this.caller = caller
    caller.parent = this
  }
  setFunc(func: FuncNode) {
    if (this.func)
      throw new ASTNodeDefinedError("func already defined in func call", this, func)
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
}

export class DynamicFuncCallExprNode extends ExprNode {
  funcName: string
  caller?: ExprNode
  args: ExprNode[] = []
  get isSingle(): boolean {
    return true
  }
  setCaller(caller: ExprNode) {
    if (this.caller)
      throw new ASTNodeDefinedError("call already defined in func call", this, caller)
    this.caller = caller
    caller.parent = this
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
}

export class LiteralExprNode<T = unknown> extends ExprNode {
  raw: string
  value: T
  get isSingle(): boolean {
    return true
  }
  get isLeaf(): boolean {
    return true
  }
}

export abstract class StatementNode extends ASTNode {

}

export class BreakStatementNode extends StatementNode {
  get isLeaf(): boolean {
    return true
  }
}
export class ContinueStatementNode extends StatementNode {
  get isLeaf(): boolean {
    return true
  }
}

export class ExprStatementNode extends StatementNode {
  expr: ExprNode
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
}

export class IfStatementNode extends StatementNode {
  condition: ExprNode
  consequent: BlockNode
  alternate?: BlockNode
  defineCondition(condition: ExprNode): void {
    if (this.condition)
      throw new ASTNodeDefinedError("Condition already defined in if", this, condition)
    this.condition = condition
    condition.parent = this
  }
  defineConsequent(consequent: BlockNode): void {
    if (this.consequent)
      throw new ASTNodeDefinedError("Consequent already defined in if", this, consequent)
    this.consequent = consequent
    consequent.parent = this
  }
  defineAlternate(alternate: BlockNode): void {
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
}

export class WhileStatementNode extends StatementNode {
  condition: ExprNode
  body: BlockNode
  defineCondition(condition: ExprNode): void {
    if (this.condition)
      throw new ASTNodeDefinedError("Condition already defined in while", this, condition)
    this.condition = condition
    condition.parent = this
  }
  defineBody(body: BlockNode): void {
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
}

export class ReturnStatementNode extends StatementNode {
  value: ExprNode
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
}

export class InitStatementNode extends StatementNode {
  /** unowned */
  lvalue: LocalVarNode
  rvalue: ExprNode
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
}

export class ASTNodeDefinedError extends Error {
  parent: ASTNode
  node: ASTNode
  constructor(message: string, parent: ASTNode, node: ASTNode) {
    super(message)
    this.name = this.constructor.name
    this.parent = parent
    this.node = node
  }
}
