import { FuncSign, NaryFuncSign } from "./declaration"

export type FuncSignPattern = NullaryFuncSignPattern | NaryFuncSignPattern

export type NullaryFuncSignPattern = string

export type NaryFuncSignPattern = string[]


export class Scope {
  parent?: Scope

  variables: Set<string> = new Set()

  functions: FuncSign[] = []

  constructor(parent?: Scope) {
    this.parent = parent
  }

  findVar(name: string): boolean {
    return this.variables.has(name)
      || (this.parent ? this.parent.findVar(name) : false)
  }

  findFunc(pattern: FuncSignPattern): boolean {
    let found = false
    for (const func of this.functions) {
      const isDeclaredNary = Array.isArray(func)
      const isPatternNary = Array.isArray(pattern)
      if (isDeclaredNary && isPatternNary) {
        // both nary 
        if (matchNarySign(pattern, func)) {
          found = true
          break
        }
      } else if (!isDeclaredNary && !isPatternNary) {
        // both nullary
        if (pattern === func.selector) {
          found = true
          break
        }
      }
    }
    return found
      || (this.parent ? this.parent.findFunc(pattern) : false)
  }
}

function matchNarySign(pattern: NaryFuncSignPattern, declaredFunctions: NaryFuncSign): boolean {
  for (const declared of declaredFunctions) {
    for (const patternPart of pattern) {
      if (patternPart !== declared.selector) return false
    }
  }
  return true
}
