import { Operator } from "../lex/token"

export class ASTNode {
  parent?: ASTNode
  findRef(name: string): RefNode | undefined {
    return this.parent?.findRef(name)
  }
}

export interface ASTNode2 {
  parent?: ASTNode2
  register(): void
  build(): ASTNode2
}

export class BlockNode extends ASTNode {
  protected locals: Map<string, RefNode> = new Map()
  protected statements: StatementNode[] = []
  findRef(name: string): RefNode | undefined {
    return this.locals.get(name) ?? this.parent?.findRef(name)
  }
  defineLocal(local: LocalVarNode): void {
    if (this.locals.has(local.name))
      throw new ASTNodeDefinedError("Local variable already defined in block", this, local)
    local.parent = this
  }
  addStatement(statement: StatementNode): true {
    this.statements.push(statement)
    statement.parent = this
    return true
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
  protected members: Map<string, RefNode> = new Map()
  constructor(name: string) {
    super(name)
    this.constant = true
  }
  findRef(name: string): RefNode | undefined {
    return this.members.get(name) ?? this.parent?.findRef(name)
  }
  defineMember(member: FieldNode | FuncNode): void {
    if (this.members.has(member.name))
      throw new ASTNodeDefinedError("Member already defined in object", this, member)
    member.parent = this
  }
}

export class FuncNode extends RefNode {
  protected body: BlockNode
  protected params: Map<string, ParamNode> = new Map()
  constructor(name: string) {
    super(name)
    this.constant = true
  }
  defParam(param: ParamNode): void {
    if (this.params.has(param.name))
      throw new ASTNodeDefinedError("Member already defined in function", this, param)
    param.parent = this
  }
  defBody(body: BlockNode): void {
    if (this.body)
      throw new ASTNodeDefinedError("Body already defined in function", this, body)
    this.body = body
    body.parent = this
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

export class ExprNode extends ASTNode {

}

export class RefExprNode extends ExprNode {
  ref: RefNode
  constructor(ref: RefNode) {
    super()
    this.ref = ref
  }
}

export class BinaryExprNode extends ExprNode {
  left: ExprNode
  op: Operator
  right: ExprNode
}

export class LiteralNode<T = unknown> extends ExprNode {
  raw: string
  value: T
}

export class StatementNode extends ASTNode {

}

export class ExprStatementNode extends StatementNode {
  protected expr: ExprNode
  defineExpr(expr: ExprNode): void {
    if (this.expr)
      throw new ASTNodeDefinedError("Expr already defined in statement", this, expr)
    this.expr = expr
    expr.parent = this
  }
}

export class IfStatementNode extends StatementNode {
  protected condition: ExprNode
  protected consequent: BlockNode
  protected alternate?: BlockNode
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
  protected condition: ExprNode
  protected body: BlockNode
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
  protected value: ExprNode
  defValue(value: ExprNode): void {
    if (this.value)
      throw new ASTNodeDefinedError("Value already defined in return", this, value)
    this.value = value
    value.parent = this
  }
}

export class InitStatementNode extends StatementNode {
  protected lvalue: LocalVarNode
  protected rvalue: ExprNode
  defLvalue(lvalue: LocalVarNode): void {
    if (this.lvalue)
      throw new ASTNodeDefinedError("Lvalue already defined in init", this, lvalue)
    for (let cur = this.parent; cur !== undefined; cur = cur.parent) {
      if (cur instanceof BlockNode) {
        cur.defineLocal(lvalue)
        break
      }
    }
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
