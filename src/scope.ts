export class HzBlock {
  protected parent?: HzBlock
  protected vars: Map<string, HzVar> = new Map()
  protected functions: Map<string, HzBlock> = new Map()
  constructor(parent?: HzBlock) {
    this.parent = parent
  }

  defineVar(name: string): boolean {
    if (this.vars.has(name)) return false
    const variable = new HzVar(this, name)
    this.vars.set(name, variable)
    return true
  }

  /**
   * Finds variable in this block or ancestors.
   * @param name the variable name
   * @returns the variable or undefined
   */
  findVar(name: string): HzVar | undefined {
    return this.vars.get(name) ?? this.parent?.findVar(name)
  }
}

export class HzObj extends HzBlock {
  name: string
  constructor(parent: HzBlock | undefined, name: string) {
    super(parent)
    this.name = name
  }

  defineVar(name: string): boolean {
    if (this.vars.has(name)) return false
    const field = new HzField(this, name)
    this.vars.set(name, field)
    return true
  }
}

export class HzVar {
  parent: HzBlock
  name: string
  constructor(parent: HzBlock, name: string) {
    this.parent = parent
    this.name = name
  }
}

export class HzField extends HzVar {
  declare parent: HzObj
  constructor(parent: HzObj, name: string) {
    super(parent, name)
  }
}
