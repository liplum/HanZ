import { NaryFuncSelectorDecl } from "./declaration"
import { HzNaryCallSelector } from "./expr"

export interface HzScoped<TScope = HzBlock> {
  get scope(): TScope
  set scope(scope: TScope)
}

export interface HzScope {
  findSymbol(name: string): HzSymbol | undefined
  findFunc(signature: string): HzFunc | undefined
}

export class HzBlock implements HzScope {
  protected parent?: HzScope
  owner: HzScoped<HzBlock>
  protected symbols: Map<string, HzVar> = new Map()
  protected functions: Map<string, HzFunc> = new Map()
  constructor(parent?: HzScope) {
    this.parent = parent
  }

  defineVar(name: string, options?: { const: boolean }): boolean {
    if (this.symbols.has(name)) return false
    const variable = new HzVar(this, name)
    variable.isConst = options?.const ?? false
    this.symbols.set(name, variable)
    return true
  }

  defineFunc(selectors: NaryFuncSelectorDecl[] | string): boolean {
    let name: string
    let func: HzFunc
    if (typeof selectors === "string") {
      func = new HzNullaryFunc(this, selectors)
      name = func.name
    } else {
      func = new HzNaryFunc(this, selectors)
      name = selectors.map(t => t.selector).join("$")
    }
    if (this.functions.has(name)) return false
    this.functions.set(name, func)
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

  findFunc(signature: string): HzFunc | undefined {
    return this.functions.get(signature) ?? this.parent?.findFunc(signature)
  }
}

export class HzObj implements HzScope {
  protected parent: HzBlock
  owner: HzScoped<HzObj>
  protected fields: Map<string, HzField> = new Map()
  protected methods: Map<string, HzFunc> = new Map()
  name: string
  constructor(parent: HzBlock, name: string) {
    this.parent = parent
    this.name = name
  }

  defineField(name: string, options?: { const: boolean }): boolean {
    if (this.fields.has(name)) return false
    const variable = new HzField(this, name)
    variable.isConst = options?.const ?? false
    this.fields.set(name, variable)
    return true
  }

  defineFunc(selectors: HzNaryCallSelector[] | string): boolean {
    let name: string
    let func: HzFunc
    if (typeof selectors === "string") {
      func = new HzNullaryFunc(this, selectors)
      name = func.name
    } else {
      func = new HzNaryFunc(this, selectors)
      name = selectors.map(t => t.selector).join("$")
    }
    if (this.methods.has(name)) return false
    this.methods.set(name, func)
    return true
  }

  /**
   * Finds variable in this block or ancestors.
   * @param name the variable name
   * @returns the variable or undefined
   */
  findSymbol(name: string): HzSymbol | undefined {
    return this.fields.get(name) ?? this.parent?.findSymbol(name)
  }

  findFunc(signature: string): HzFunc | undefined {
    return this.methods.get(signature) ?? this.parent?.findFunc(signature)
  }
}

export class HzSymbol {
  parent: HzScope
  name: string
  constructor(parent: HzScope) {
    this.parent = parent
  }
}

export class HzVar extends HzSymbol {
  isConst: boolean = false
  name: string
  constructor(parent: HzBlock, name: string) {
    super(parent)
    this.name = name
  }
}

export class HzField extends HzSymbol {
  name: string
  declare parent: HzObj
  isConst: boolean = false
  constructor(parent: HzObj, name: string) {
    super(parent)
    this.name = name
  }
}

export type HzFunc = HzNaryFunc | HzNullaryFunc

export class HzNaryFunc extends HzSymbol {
  selectors: NaryFuncSelectorDecl[]
  constructor(parent: HzScope, selectors: NaryFuncSelectorDecl[]) {
    super(parent)
    this.selectors = selectors
  }
}

export class HzNullaryFunc extends HzSymbol {
  selector: string
  constructor(parent: HzScope, selector: string) {
    super(parent)
    this.selector = selector
  }
}
