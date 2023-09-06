# Object

## Full Example

```
定义类 账户【
  定义字段 | 余额 |
  定义构造【
    新建【
      余额 = 0。
    】
    继承自: 另一账户【
      余额 = 另一账户 余额。
    】
  】
  定义类方法【
    交换: 账户甲 与: 账户乙【
      临时 := 账户甲 余额。
      账户甲 设置余额: 账户乙 余额。
      账户乙 设置余额: 临时。
    】
  】
  定义方法【
    设置余额: 金额【
      如果 金额 < 0【
        余额 = 0。
      】否则【
        余额 = 金额。
      】 
    】
    存入: 金额【
      余额 += 金额。
      返回 自己。
    】
    取出: 金额【
      余额 -= 金额。
      返回 自己。
    】
  】
】
```

## Declaration

1. The `defObject`/`定义对象` keyword is used to declare an object.
2. A colon is after the keyword.

```
定义对象 账户【
// ...
】
```

## Fields

1. The `defField`/`定义字段` keyword is used to declare fields.
1. Fields can be initialized in the constructors.

```
定义对象 账户【
  | 余额 |
// ...
】
```

## Constructors

1. Constructors are declared by the name of object, and should be named.

```
定义对象 账户【
  | 余额 |
  
  账户 新建【
    余额 = 0
  】
  
  账户 继承自: 另一账户【
    余额 = 另一账户 余额
  】
】
```

## Instantiation

```
账户甲:= 账户 新建
账户乙:= 账户 继承自: 账户甲
```

## Method

2. **Return**: Use `return`/`返回` to return any value for the caller.

```
定义对象 账户【
  定义方法 设置余额: 金额【
    如果 金额 < 0【
      余额 = 0。
    】否则【
      余额 = 金额。
    】 
  】

  // to deposit money
  定义方法 存入: 金额【
    余额 += 金额。
    返回 自己。
  】
   
  // to withdraw money
  定义方法 取出: 金额【
    余额 -= 金额。
    返回 自己。
  】
】
```

## Method Calling

```
账户甲 := 账户 新建。

账户甲 存入: 799。
账户甲 取出: 199。
// equivalent to method chaining below
账户甲 存入: 799, 取出: 199。
```

## Functor

Example 1. To calculate BMI.

```
对象 计算BMI指数【
  函数 身高: _ 体重: _【
    返回 体重 / (身高 * 身高)。
  】
】

| BMI |
BMI = 计算BMI指数 身高:180 体重:75。
```
