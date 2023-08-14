import { Operator } from "../lex/token"

export type ASTNodeClass<T = unknown> = { new(...args: unknown[]): T }
export class ASTNode {
  parent?: ASTNode
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
}

export class FileNode extends BlockNode {
  declare parent: undefined
  declare locals: Map<string, ObjNode | FuncNode | LocalVarNode>
  findRef(name: string): ObjNode | FuncNode | LocalVarNode | undefined {
    return this.locals.get(name)
  }
  defineLocal(symbol: ObjNode | FuncNode | LocalVarNode): void {
    if (this.locals.has(symbol.name))
      throw new ASTNodeDefinedError("Top-level already defined in file", this, symbol)
    symbol.parent = this
    this.locals.set(symbol.name, symbol)
  }
}

export class RefNode extends ASTNode {
  name: string
  constant: boolean = false
  constructor(name: string) {
    super()
    this.name = name
  }
}

export class LocalVarNode extends RefNode {
}

export class ParamNode extends LocalVarNode {
  declare parent: FuncNode
}

export class FieldNode extends RefNode {
  declare parent: ObjNode
  constructor(name: string) {
    super(name)
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
  ref: RefNode
  constructor(ref: RefNode) {
    super()
    this.ref = ref
  }
  get isSingle(): boolean {
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
}

export class FuncCallExprNode extends ExprNode {
  caller?: ExprNode
  func: FuncNode
  args: ExprNode[] = []
  get isSingle(): boolean {
    return false
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
}

export class DynamicFuncCallExprNode extends ExprNode {
  funcName: string
  caller?: ExprNode
  args: ExprNode[] = []
  get isSingle(): boolean {
    return false
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
}

export class LiteralExprNode<T = unknown> extends ExprNode {
  raw: string
  value: T
  get isSingle(): boolean {
    return true
  }
}

export class StatementNode extends ASTNode {

}

export class BreakStatementNode extends StatementNode { }
export class ContinueStatementNode extends StatementNode { }

export class ExprStatementNode extends StatementNode {
  expr: ExprNode
  defineExpr(expr: ExprNode): void {
    if (this.expr)
      throw new ASTNodeDefinedError("Expr already defined in statement", this, expr)
    this.expr = expr
    expr.parent = this
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
}

export class ReturnStatementNode extends StatementNode {
  value: ExprNode
  defValue(value: ExprNode): void {
    if (this.value)
      throw new ASTNodeDefinedError("Value already defined in return", this, value)
    this.value = value
    value.parent = this
  }
}

export class InitStatementNode extends StatementNode {
  lvalue: LocalVarNode
  rvalue: ExprNode
  setLvalue(lvalue: LocalVarNode): void {
    if (this.lvalue)
      throw new ASTNodeDefinedError("Lvalue already defined in init", this, lvalue)
    this.lvalue = lvalue
  }
  defRvalue(rvalue: ExprNode): void {
    if (this.rvalue)
      throw new ASTNodeDefinedError("Rvalue already defined in init", this, rvalue)
    this.rvalue = rvalue
    rvalue.parent = this
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
