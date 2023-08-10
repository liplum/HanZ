import { lex } from "./lexer.js"
import { ParseError, parse } from "./parser.js"
const source =
  `
自己 余额 = 另一账户 余额。
账户甲 存入: 799。
`
const tokens = lex(source)
try {
  const topLevels = parse(tokens)
  console.log(topLevels)
} catch (e) {
  if (e instanceof ParseError) {
    console.error(JSON.stringify(e.token), e)
  }
}