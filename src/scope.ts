export class Block {
  protected parent?: Block
  protected vars: Map<string, Var> = new Map()
  protected functions: Map<string, Block> = new Map()
  constructor(parent?: Block) {
    this.parent = parent
  }

  defineVar(name: string): boolean {
    if (this.vars.has(name)) return false
    const variable = new Var(this, name)
    this.vars.set(name, variable)
    return true
  }

  /**
   * Finds variable in this block or ancestors.
   * @param name the variable name
   * @returns the variable or undefined
   */
  findVar(name: string): Var | undefined {
    return this.vars.get(name) ?? this.parent?.findVar(name)
  }
}

export class Obj extends Block {
  name: string
  constructor(parent: Block | undefined, name: string) {
    super(parent)
    this.name = name
  }

  defineVar(name: string): boolean {
    if (this.vars.has(name)) return false
    const field = new Field(this, name)
    this.vars.set(name, field)
    return true
  }
}

export class Var {
  parent: Block
  name: string
  constructor(parent: Block, name: string) {
    this.parent = parent
    this.name = name
  }
}

export class Field extends Var {
  declare parent: Obj
  constructor(parent: Obj, name: string) {
    super(parent, name)
  }
}
