import { HzObjDecl, HzFuncDecl, HzVarDecl } from "./declaration.js"
import { HzExprStatmt, HzInitStatmt } from "./statement.js"

export type TopLevel = HzObjDecl | HzFuncDecl | HzExprStatmt | HzInitStatmt | HzVarDecl[]

export class HzFileDef {
  topLevels: TopLevel[]
  constructor(topLevels: TopLevel[]) {
    this.topLevels = topLevels
  }
  toJSON() {
    return this.topLevels
  }
}

