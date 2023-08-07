# Statements

## Variable Declaration

1. Variable can be declared before being used.
2. To declare variables, the vertical bar should be used to quote them.
3. The comma can be used to declare multiple variables in the same place.

Example 1: To declare a variable, named `结果`

```
| 结果 |
```

Example 2: To Declare multiple variables.

```
| 结果，误差 |
// the same as the following code
| 结果 |
| 误差 |
```

## Variable Initialization

1. Variables can be initialized where they're declared.
2. The `:=` is used to initialize a variable.

Example 1: To declare a variable, named `次数`, and initialize it by `10`

```
次数:=10
```

## Control Flow

1. The `if` or `如果` is used to run the code block if the condition is true.
2. The `ifNot` or `如果不` is used to run the code block if the condition is false.

Example 1: To use `if`.

```
值:=10
如果 值 > 5
  值 *= 2
```

Example 1: To use `ifNot`.

```
值:=10
如果不 值 < 5
  值 *= 2
```

## Loop

### While

1. The `while` or `当` keyword is ued to declare a while-loop.
2. The condition goes after the keyword.
3. The loop should end once the condition is false.

```
值 := 0
当 值 < 10
  值++
```

### Until

1. The `until` or `直到` keyword is used to declare an until-loop.
2. The condition goes after the keyword.
3. The loop should end once the condition is true.

```
值 := 10
直到 值 <= 0
  值--
```

## Function Declaration

1. The `func` or `函数` keyword is used to declare a function.
2. The last line of code is the return value.
3. Parameters are defied after the name of function and started by a colon `:`.

Example 1: To calculate a square.

```
函数 乘方 :值
  值 * 值
```

Example 2. To calculate BMI.

```
函数 BMI指数 :身高 :体重
  体重 / (身高 * 身高)
```

## Function Call

1.

## Object

### Object Declaration

1. The `object` or `对象` keyword is used to declare an object.
2. Constructors are declared by the name of object, and should be named.
3. Fields are declared in the object-level, and can be initialized in the constructors.

```
对象 账户
  | 余额 |
  
  账户 新建
    余额 = 0
  
  账户 继承自: 另一账户
    余额 = 另一账户的余额
```

### Instantiation

```
账户甲:= 账户 新建
账户乙:= 账户 继承自: 账户甲
```

### Method Declaration

```
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
```

### Method Call

```
账户甲:= 账户 新建

账户甲 存入: 799
账户甲 取出: 199
```
