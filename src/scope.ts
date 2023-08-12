export interface HzScoped<TScope = HzBlock> {
  scope: TScope
}

export interface HzScope {
  findSymbol(name: string): HzSymbol | undefined
}

export class HzBlock implements HzScope {
  protected parent?: HzBlock
  owner: HzScoped<HzBlock>
  protected symbols: Map<string, HzSymbol> = new Map()
  protected functions: Map<string, HzBlock> = new Map()
  constructor(parent?: HzBlock) {
    this.parent = parent
  }

  defineVar(name: string): boolean {
    if (this.symbols.has(name)) return false
    const variable = new HzVar(this, name)
    this.symbols.set(name, variable)
    return true
  }

  defineConst(name: string): boolean {
    if (this.symbols.has(name)) return false
    const variable = new HzConst(this, name)
    this.symbols.set(name, variable)
    return true
  }

  /**
   * Finds variable in this block or ancestors.
   * @param name the variable name
   * @returns the variable or undefined
   */
  findSymbol(name: string): HzSymbol | undefined {
    return this.symbols.get(name) ?? this.parent?.findSymbol(name)
  }
}

export class HzObj extends HzBlock {
  name: string
  declare owner: HzScoped<HzObj>
  constructor(parent: HzBlock | undefined, name: string) {
    super(parent)
    this.name = name
  }

  defineVar(name: string): boolean {
    if (this.symbols.has(name)) return false
    const field = new HzField(this, name)
    this.symbols.set(name, field)
    return true
  }
}

export class HzSymbol {
  parent: HzScope
  name: string
  constructor(parent: HzScope, name: string) {
    this.parent = parent
    this.name = name
  }
}

export class HzVar extends HzSymbol {
  constructor(parent: HzBlock, name: string) {
    super(parent, name)
  }
}

export class HzField extends HzSymbol {
  declare parent: HzObj
  constructor(parent: HzObj, name: string) {
    super(parent, name)
  }
}

export class HzConst extends HzSymbol {
  constructor(parent: HzBlock, name: string) {
    super(parent, name)
  }
}