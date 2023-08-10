# Object

## Declaration

1. The `object`/`对象` keyword is used to declare an object.
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

## Instantiation

```
账户甲:= 账户 新建
账户乙:= 账户 继承自: 账户甲
```

## Method

```
对象 账户【
  | 余额 |

  账户 新建【
    余额 = 0。
  】

  账户 继承自: 另一账户【
    自己 余额 = 另一账户 余额。
  】

  // to deposit money
  函数 存入: 金额【
    余额 += 金额。
    返回 自己。
  】
   
  // to withdraw money
  函数 取出: 金额【
    余额 -= 金额。
    返回 自己。
  】
】
```

```js
class 账户{
  static 新建(){
    const self = new 账户()
    self.余额 = 0
    return self
  }
  static 继承自(另一账户){
    const self = new 账户()
    self.余额 = 另一账户.余额
    return self
  }
  存入(金额){
    this.余额 += 金额
    return this
  }
  取出(金额){
    this.余额 -= 金额
    return this
  }
}
```

## Method Calling

```
账户甲 := 账户 新建

账户甲 存入: 799
账户甲 取出: 199
# equivalent to method chaining below
账户甲 存入: 799, 取出: 199
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
