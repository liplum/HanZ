import { Operator } from "../lex/token"
import { HzObjDecl } from "../parse/declaration"

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
  defineLocal(local: LocalVarNode): boolean {
    if (this.locals.has(local.name)) return false
    local.parent = this
    return true
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
  defineMember(member: FieldNode | FuncNode) {
    if (this.members.has(member.name)) return false
    member.parent = this
    return true
  }
}

export class FuncNode extends RefNode {
  protected body: BlockNode
  protected params: Map<string, LocalVarNode> = new Map()
  constructor(name: string) {
    super(name)
    this.constant = true
  }
  defParam(param: LocalVarNode): boolean {
    if (this.params.has(param.name)) return false
    param.parent = this
    return true
  }
  defBody(body: BlockNode): boolean {
    if (this.body) return false
    this.body = body
    body.parent = this
    return true
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
    this.defParam(new SelfRefNode())
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
  defineExpr(expr: ExprNode): boolean {
    if (this.expr) return false
    this.expr = expr
    expr.parent = this
    return true
  }
}

export class IfStatementNode extends StatementNode {
  protected condition: ExprNode
  protected consequent: BlockNode
  protected alternate?: BlockNode
  defineCondition(condition: ExprNode): boolean {
    if (this.condition) return false
    this.condition = condition
    condition.parent = this
    return true
  }
  defineConsequent(consequent: BlockNode): boolean {
    if (this.consequent) return false
    this.consequent = consequent
    consequent.parent = this
    return true
  }
  defineAlternate(alternate: BlockNode): boolean {
    if (this.alternate) return false
    this.alternate = alternate
    alternate.parent = this
    return true
  }
}

export class WhileStatementNode extends StatementNode {
  protected condition: ExprNode
  protected body: BlockNode
  defineCondition(condition: ExprNode): boolean {
    if (this.condition) return false
    this.condition = condition
    condition.parent = this
    return true
  }
  defineBody(body: BlockNode): boolean {
    if (this.body) return false
    this.body = body
    body.parent = this
    return true
  }
}

export class ReturnStatementNode extends StatementNode {
  protected value: ExprNode
  defValue(value: ExprNode): boolean {
    if (this.value) return false
    this.value = value
    value.parent = this
    return true
  }
}

export class InitStatementNode extends StatementNode {
  protected lvalue: LocalVarNode
  protected value: ExprNode
  defVar(lvalue: LocalVarNode): boolean {
    if (this.lvalue) return false
    for (let cur = this.parent; cur !== undefined; cur = cur.parent) {
      if (cur instanceof BlockNode) {
        if (!cur.defineLocal(lvalue)) return false
        break
      }
    }
    this.lvalue = lvalue
    return true
  }
  defValue(value: ExprNode): boolean {
    if (this.value) return false
    this.value = value
    value.parent = this
    return true
  }
}
