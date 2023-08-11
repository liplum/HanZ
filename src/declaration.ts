import { HzStatmt } from "./statement"

export const enum DeclType {
  var = "var",
  nullaryFunc = "nullary-func",
  naryFunc = "nary-func",
  obj = "obj",
}
export class HzVarDecl {
  names: string[]
  constructor({ names }: { names: string[] }) {
    this.names = names
  }

  toJSON() {
    return {
      type: DeclType.var,
      names: this.names,
    }
  }
}

export interface NaryFuncSelector {
  selector: string
  /**
   * Undefined means discard.
   */
  param?: string
}

export class HzFuncDecl {
  body: HzStatmt[]
}

export class HzNaryFuncDecl extends HzFuncDecl {
  selectors: NaryFuncSelector[]
  body: HzStatmt[]
  constructor({ selectors, body }: { selectors: NaryFuncSelector[], body: HzStatmt[] }) {
    super()
    this.selectors = selectors
    this.body = body
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
  body: HzStatmt[]
  constructor({ selector, body }: { selector: string, body: HzStatmt[] }) {
    super()
    this.selector = selector
    this.body = body
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
