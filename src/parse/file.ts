import { HzObjDecl, HzFuncDecl } from "./declaration.js"
import { HzExprStatmt, HzInitStatmt } from "./statement.js"

export type TopLevel = HzObjDecl | HzFuncDecl | HzExprStatmt | HzInitStatmt

export class HzFileDef {
  topLevels: TopLevel[]
  constructor(topLevels: TopLevel[]) {
    this.topLevels = topLevels
  }
  toJSON() {
    return this.topLevels
  }
}

