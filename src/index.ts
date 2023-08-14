import { Writable } from "stream"
import { SemanticAnalyzeError, semanticAnalyze } from "./ast/analysis.js"
import { ASTNodeDefinedError } from "./ast/node.js"
import { lex } from "./lex/lexer.js"
import { ParseError, parse } from "./parse/parser.js"
import { transpile2Js } from "./visitor/2js.js"
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
  `
const tokens = lex(source)
try {
  const fileDef = parse(tokens)
  const fileNode = semanticAnalyze(fileDef)
  const compiled = await writeIntoString((writable) => transpile2Js(fileNode, writable))
  console.log(compiled)
} catch (e) {
  if (e instanceof ParseError) {
    const token = e.token
    console.error(JSON.stringify(token), e)
    console.log(nearby(source, token.pos))
  } else if (e instanceof ASTNodeDefinedError) {
    console.error(e)
  } else if (e instanceof SemanticAnalyzeError) {
    console.error(e)
  } else {
    console.error(e)
  }
}

function nearby(source: string, pos: number): string {
  const start = Math.max(0, pos - 5)
  const end = Math.min(pos + 5, source.length)
  return source.substring(start, end)
}

async function writeIntoString(writing: (writable: Writable) => void): Promise<string> {
  let res = ""
  const output = new Writable({
    write(chunk: Buffer, encoding, next) {
      const data = chunk.toString()
      res += data
      next()
    },
  })
  writing(output)
  return new Promise((resolve, reject) => {
    output.on("close", () => {
      resolve(res)
    })
    output.on("error", (err) => {
      reject(err)
    })
  })
}
