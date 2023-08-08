import { lex } from "./lexer.js"

const source = "5.14+16*3"
const tokens = lex(source)
console.log(tokens)