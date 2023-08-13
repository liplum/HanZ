import { SoftKeyword } from "../lex/token.js"

export enum LiteralType {
  string = "string",
  number = "number",
  bool = "bool",
  null = "null",
  undefined = "undefined",
}

export class HzLiteral<TRaw = string> {
  constructor(
    public raw: TRaw
  ) { }
}

export class HzStringLiteral extends HzLiteral {
  toJSON() {
    return {
      type: LiteralType.string,
      raw: this.raw,
    }
  }
}

export class HzNumberLiteral extends HzLiteral {
  toJSON() {
    return {
      type: LiteralType.number,
      raw: this.raw,
    }
  }
}

export class HzBoolLiteral extends HzLiteral<SoftKeyword.true | SoftKeyword.false> {
  toJSON() {
    return {
      type: LiteralType.bool,
      raw: this.raw,
    }
  }
}

export class HzNullLiteral extends HzLiteral<SoftKeyword.null> {
  constructor() {
    super(SoftKeyword.null)
  }
  toJSON() {
    return {
      type: LiteralType.null,
      raw: this.raw,
    }
  }
}

export class HzUndefinedLiteral extends HzLiteral<SoftKeyword.undefined> {
  constructor() {
    super(SoftKeyword.undefined)
  }
  toJSON() {
    return {
      type: LiteralType.undefined,
      raw: this.raw,
    }
  }
}