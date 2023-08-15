# Statements

## Variable Declaration

1. Variable can be declared before being used.
2. To declare variables, enclose them in vertical bars.
3. To declare multiple variables, separate them by space.

Example 1: To declare a variable, named `结果`

```
| 结果 |
```

Example 2: To Declare multiple variables.

```
| 结果 误差 |
// the same as the following code
| 结果 |
| 误差 |
```

## Variable Initialization

1. Variables can be initialized where they're declared.
2. The `:=` is used to initialize a variable.

Example 1: To declare a variable, named `次数`, and initialize it by `10`

```
次数:=10。
```

## Control Flow

1. **If-Else**: Use `if`/`如果` to execute a code block when a condition is true, and `else`/`否则` to execute another code block when the condition is false.
2. **Else-If**: Use `elif`/`又如果` for multiple conditions. It allows you to check additional conditions after the initial `if`/`如果` condition.

Example 1: To use `IF-Else`.

```
值 := 10。
如果 值 > 5 【
  值 *= 2。
】否则【
  值 -= 5。
】
```

Example 2: To use `Else-IF`.

```
值 := 10。
如果 值 < 5【
  值 *= 2。
】又如果 值 / 2 == 1 【
  值 -= 1。
】否则【
  值 += 1。
】
```

## Loop

### While

1. The `while`/`每当` keyword is ued to declare a while-loop.
2. The condition goes after the keyword.
3. The loop should end once the condition is false.

```
值 := 0。
每当 值 < 10【
  值 += 1。
】
```
