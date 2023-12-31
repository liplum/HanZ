import { HzCodeBlock } from "./statement"

export const enum DeclType {
  var = "var",
  nullaryFunc = "nullary-func",
  naryFunc = "nary-func",
  obj = "obj",
}

export class HzVarDecl {
  name: string
  constructor(name: string) {
    this.name = name
  }

  toJSON() {
    return {
      type: DeclType.var,
      name: this.name,
    }
  }
}

export interface NaryFuncSelector {
  selector: string
}

export interface NaryFuncSelectorDecl extends NaryFuncSelector {
  selector: string
  /**
   * Undefined means discard.
   */
  param?: string
}

export class HzFuncDecl {
  body: HzCodeBlock
  signature: string
}

export function getFuncSignature(selectors: string | NaryFuncSelector[]): string {
  return typeof selectors === "string"
    ? selectors
    : selectors.map(t => t.selector).join("$")
}

export function getNaryFuncRepr(selectors: NaryFuncSelector[]): string {
  return selectors.map(s => `${s.selector}`).join(": ")
}

export class HzNaryFuncDecl extends HzFuncDecl {
  selectors: NaryFuncSelectorDecl[]
  constructor({ selectors, body }: { selectors: NaryFuncSelectorDecl[], body: HzCodeBlock }) {
    super()
    this.selectors = selectors
    this.body = body
    this.signature = getFuncSignature(selectors)
  }

  toJSON() {
    return {
      type: DeclType.naryFunc,
      selectors: this.selectors,
      body: this.body,
    }
  }
}

export class HzNullaryFuncDecl extends HzFuncDecl {
  selector: string
  constructor({ selector, body }: { selector: string, body: HzCodeBlock }) {
    super()
    this.selector = selector
    this.body = body
    this.signature = getFuncSignature(selector)
  }

  toJSON() {
    return {
      type: DeclType.nullaryFunc,
      selector: this.selector,
      body: this.body,
    }
  }
}

export class HzObjDecl {
  name: string
  ctors: HzFuncDecl[]
  fields: HzVarDecl[]
  classMethods: HzFuncDecl[]
  objMethods: HzFuncDecl[]
  constructor({ name, ctors, fields, objMethods, classMethods }: { name: string, ctors: HzFuncDecl[], fields: HzVarDecl[], objMethods: HzFuncDecl[], classMethods: HzFuncDecl[] }) {
    this.name = name
    this.ctors = ctors
    this.fields = fields
    this.objMethods = objMethods
    this.classMethods = classMethods
  }
  toJSON() {
    return {
      type: DeclType.obj,
      name: this.name,
      ctors: this.ctors,
      fields: this.fields,
      classMethods: this.classMethods,
      objMethods: this.objMethods,
    }
  }
}
