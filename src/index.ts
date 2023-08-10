import { lex } from "./lexer.js"
import { ParseError, parse } from "./parser.js"
const source =
  `
  账户甲 存入: 799, 取出: 199。
`
const tokens = lex(source)
try {
  const topLevels = parse(tokens)
  console.log(JSON.stringify(topLevels, null, 1))
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