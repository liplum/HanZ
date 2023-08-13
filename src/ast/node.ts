import { Operator } from "../lex/token"

export class ASTNode {
  parent?: ASTNode
  findRef(name: string): RefNode | undefined {
    return this.parent?.findRef(name)
  }
}

export class BlockNode extends ASTNode {
  protected locals: Map<string, RefNode> = new Map()
  findRef(name: string): RefNode | undefined {
    return this.locals.get(name) ?? this.parent?.findRef(name)
  }
  defineLocal(local: LocalVarNode) {
    if (this.locals.has(local.name)) return false
    local.parent = this
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
  block: BlockNode
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

export class IfStatementNode extends StatementNode {
  condition: ExprNode
  consequent: BlockNode
  alternate?: BlockNode
}

export class WhileStatementNode extends StatementNode {
  condition: ExprNode
  body: BlockNode
}
