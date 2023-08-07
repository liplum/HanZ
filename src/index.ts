import { lex } from "./lexer.js"
// Usage example
const input = `
对象 账户
  | 余额 |

  账户 新建
    余额 = 0
  
  账户 继承自: 另一账户
    余额 = 另一账户的余额

  // to deposit money
  函数 存入: 金额
    余额 += 金额
   
  // to withdraw money
  函数 取出: 金额
    余额 -= 金额

账户甲:= 账户 新建

账户甲 存入: 799
账户甲 取出: 199

值:=10
如果 值 < 5
  值 *= 2
又如果 值 / 2 == 1 
  值 -= 1
否则
  值++
`
const tokens = lex(input)
console.log(tokens)
