import { semanticAnalyze } from "./analysis.js"
import { lex } from "./lexer.js"
import { ParseError, parse } from "./parser.js"
const source =
    `
对象 账户【
  | 余额 |
  账户 新建【
    余额 = 0。
  】
  账户 继承自: 另一账户【
    余额 = 另一账户 余额。
  】
  // to deposit money
  方法 存入: 金额【
    余额 += 金额。
    返回 自己。
  】
  // to withdraw money
  方法 取出: 金额【
    余额 -= 金额。
    返回 自己。
  】
】

// test instantiation
账户甲 := 账户 新建。

// test messaging
账户甲 存入: 799。
账户甲 取出: 199。

// test method chaining
账户甲 存入: 799, 取出: 199。
  `
const tokens = lex(source)
try {
  const topLevels = parse(tokens)
  semanticAnalyze(topLevels)
  console.log(JSON.stringify(topLevels,null,1))
} catch (e) {
  if (e instanceof ParseError) {
    const token = e.token
    console.error(JSON.stringify(token), e)
    console.log(nearby(source, token.pos))
  }
}

function nearby(source: string, pos: number): string {
  const start = Math.max(0, pos - 5)
  const end = Math.min(pos + 5, source.length)
  return source.substring(start, end)
}