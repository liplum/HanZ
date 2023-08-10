import { lex } from "./lexer.js"
import { parse } from "./parser.js"
const source = "5.14 + 16 * 3。"
const tokens = lex(source)
const topLevels = parse(tokens)
console.log(topLevels)