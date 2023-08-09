import { lex } from "./lexer.js"

const source = "foo = 10."
const tokens = lex(source)
console.log(tokens)