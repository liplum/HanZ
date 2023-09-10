# Object

## Definition

### Full Example

```
[class]
@zh_CN [账户]
Account [
  @zh_CN [余额]
  | balance |
  [init]
  @zh_CN [新建]
  new [
    balance = 0.
  ]
  [init]
  @zh_CN [继承自]
  inheritFrom: other [
    balance = other balance.
  ]
  @zh_CN [设置余额]
  setBalance: amount [
    if balance < 0 [
      balance = 0.
    ] else [
      balance = amount.
    ]
  ]
  @zh_CN [存入]
  deposit: amount [
    balance += amount abs.
  ]
  @zh_CN [取出]
  withdraw: amount [
    balance -= amount abs.
  ]
  [static]
  @zh_CN [交换, 和]
  exchange: a with: b [
    temp := a balance.
    a setBalance: b balance.
    b setBalance: temp.
  ]
]
```

### Declaration

1. Use `class` notation.
2. A colon is after the keyword.

```
[class]
Account []
```

### Fields

1. **defField**: Use `defField`/`定义字段` to declare fields.
2. Fields can be initialized in the constructors.

```
定义类: 账户【
  定义字段: | 余额 |
】
```

### Constructors

1. **defInit**: Use `defInit`/`定义构造` to declare a constructor.

```
定义类 账户【
  定义字段: | 余额 |
  
  账户 新建【
    余额 = 0
  】
  
  账户 继承自: 另一账户【
    余额 = 另一账户 余额
  】
】
```

### Methods

1. **Return**: Use `return`/`返回` to return any value for the caller.


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

### Access of fields and methods

1. **This**: Use `this`/`这个` to access fields and methods from the class definition only. This guarantees:
    1. It's closed recursion. Access of inherited fields and methods is prohibited.
2. **Self**: Use `self`/`自己` to access fields and methods from the class definition or parent definitions. This guarantees:
    1. It's open recursion. Access of fields and methods is dynamic dispatched.

## Outside

### Instantiation

```
账户甲:= 账户 新建
账户乙:= 账户 继承自: 账户甲
```

### Calling Method

```
账户甲 := 账户 新建。

账户甲 存入: 799。
账户甲 取出: 199。
// equivalent to method chaining below
账户甲 存入: 799, 取出: 199。
```
