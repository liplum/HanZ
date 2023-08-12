import { HzObjDecl, HzFuncDecl } from "./declaration.js"
import { HzExprStatmt, HzInitStatmt } from "./statement.js"

export type TopLevel = HzObjDecl | HzFuncDecl | HzExprStatmt | HzInitStatmt