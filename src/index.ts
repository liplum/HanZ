import { lex } from "./lexer.js"

const source = 
`a = 10
b = 5`
const tokens = lex(source)
console.log(tokens)