---
title: 'Plutus High Level Types'
author: 'RM'
date: 'September 12, 2022'
imagepath: 'https://imgs.search.brave.com/U7OzRcfAyl_j-OHi8nuQYQ5zMfArqMBGl74UCJsO4IA/rs:fit:715:479:1/g:ce/aHR0cHM6Ly9kZXNp/Z25zaGFjay5uZXQv/d3AtY29udGVudC91/cGxvYWRzL3BsYWNl/aG9sZGVyLWltYWdl/LnBuZw'
imagename: 'Placeholder image'
description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam sit ipsum, nemo neque id voluptate'
---

# Plutus High Level Types

## On-chain Code

### Library changes**
- `imported qualified Ledger.Scripts as Scripts` 🤖 👉  `imported qualified Ledger.Typed.Scripts as Scripts`


### INLINABLE function changes**
```Haskell
{-# INLINABLE goodRedeemer #-}
goodRedeemer :: BuiltinData -> BuiltinData -> BuitinData -> ()
goodRedeemer _ redeemer _
  | redeemer == Builtins.mkI 42       = ()
  | otherwise                         = traceError "Wrong Redeemer!"
```
🤖 👇 
```Haskell
{-# INLINABLE goodRedeemer #-}
goodRedeemer :: () -> Integer -> ScriptContext -> Bool
goodRedeemer _ redeemer _ = traceIfFalse "Wrong Redeemer" (redeemer == 42)
```
- No longer uses `BuiltinData` (we are using **high-level** types), so **proper types** need to be defined
    - the **redeemer**, i.e., `Integer` and 
    - the `ScriptContext`
    - returns `()` for the datum (we don't want to consider the type of unit) -> *unit is the representation of something that is itself ("the empty tuple, is just an empty tuple").*
- The **output** in this case is not `()`, it's `Bool`, **yes** or **no**.
- Takes a **redeemer** and 
    - The boolean function `traceIfFalse` will pass the **error** message (i.e, `"Wrong Redeemer"`) against the **validation** `(redeemer == 42)`
    - Because the types *align* (How exactly?), **it no longer needs the `BuiltinData` auxiliary wrapper function**

### The thing with the Typed version...

The high level types (`Integer`, `ScriptContext`, `Bool`) need to be wrapped into low level types, and that requires more boilerplate:

```Haskell
{-# INLINABLE goodRedeemer #-}
goodRedeemer :: () -> Integer -> ScriptContext -> Bool
goodRedeemer _ redeemer _ = traceIfFalse "Wrong Redeemer" (redeemer == 42)
```

### data Typed

![Placeholder image](https://imgs.search.brave.com/U7OzRcfAyl_j-OHi8nuQYQ5zMfArqMBGl74UCJsO4IA/rs:fit:715:479:1/g:ce/aHR0cHM6Ly9kZXNp/Z25zaGFjay5uZXQv/d3AtY29udGVudC91/cGxvYWRzL3BsYWNl/aG9sZGVyLWltYWdl/LnBuZw)
----- 

```
data Typed
instance. Scripts.ValidatorTypes Typed where
    type instance DatumType Typed    = ()
    type instance RedeemerType Type  = Integer
```
- `data Typed` -> create instances of validator types
    - Typed **unit** instance -> `type instance DatumType Typed    = ()`
    - Typed **integer** instance -> `type instance RedeemerType Type  = Integer`

- 👆 This is required in order to 
    - use `()` as a **datum** type -> `type instance DatumType Typed    = ()` 
    - `Integer` as a **redeemer** type -> `type instance RedeemerType Type  = Integer`

- The `ScriptContext` represents information about the whole transaction
    - You can take **time** information from the tx moment of execution (Plutus has tools to work in POSIX time, which is why it's not necessary to use slot no.s)

- The redeemer now considers the output of the transaction (it is using **high level** types), which is a `Bool` -> valid/not valid

### Typed Validator
```Haskell
typedValidator :: Scripts.TypedValidator Typed
```
- The validator is of type `Scripts.TypedValidator` and as a parameter, the `Typed` data type we just defined:
```Haskell
data Typed
instance. Scripts.ValidatorTypes Typed where
    type instance DatumType Typed    = ()
    type instance RedeemerType Type  = Integer
```
- `Typed` data type **implies** 
    - the `DatumType` and 
    - the `RedeemerType`

- We are 💉 (injecting) 
    - the Datum's and Redeemer's types
    - `Scripts.mkTypedValidator` which exposes the compiler extension `@Typed` which allows the (💉)injection of types
```Haskell
typedValidator :: Scripts.TypedValidator Typed
typedValidator = Scripts.mkTypedValidator @Typed
```

- splice two things in 
    - the compile of the on-chain redeemer `$$(PlutusTx.compile [|| goodRedeemer ||])`
    - the wrapper for the compiler (because it is a high level type, it needs to be wrapped/mapped to low level types)
        - using the `wrap` auxiliary function
        - `$$(PlutusTx.compile [|| wrap ||])`
     - this happens with the help of an auxiliary function
        - `wrap = Scripts.wrapValidator @() @Integer`

```Haskell
{-# INLINABLE goodRedeemer #-}
goodRedeemer :: () -> Integer -> ScriptContext -> Bool
goodRedeemer _ redeemer _ = traceIfFalse "Wrong Redeemer" (redeemer == 42)

data Typed
instance. Scripts.ValidatorTypes Typed where
    type instance DatumType Typed    = ()
    type instance RedeemerType Typed  = Integer

typedValidator :: Scripts.TypedValidator Typed
typedValidator = Scripts.mkTypedValidator @Typed
  $$(PlutusTx.compile [|| goodRedeemer ||])
  $$(PlutusTx.compile [|| wrap ||])
where
  wrap = Scripts.wrapValidator @() @Integer
```
- aux function 👆              👆 inject datum `@()` and redeemer `@Integer` data types 

### Typed Validator Script

```Haskell
validator :: Validator
validator = mkValidatorScript typedValidator
```
- The `mkValidatorScript` changes to `Scripts.validatorScript` which takes a `Typed` validator (`typedValidator`) as **input**

### Typed Hash Validator
```Haskell
valHash :: Ledger.ValidatorHash
valHash = Scripts.validatorHash typedValidator
```
- The `valHash` also takes a `Typed` validator (`typedValidator`) as **input**

and now the `scrAddress` function can take the `validator` we have defined:
- This validator (`validator = mkValidatorScript typedValidator`) evaluates to `validator {<script>}` **but**
    - it includes extra data: `$$(PlutusTx.compile [|| wrap ||])` (which is very expensive) 🚨 <- ??


## Off-chain Code

### Changes to the `give` function
- 👇 The `give` function from our previous contract

```Haskell
give :: AsContractError e => Integer -> Contract w s e ()
give amount = do
    let tx = mustPayToOtherScript valHash (Datum $ Builtins.mkI 0) $ Ada.lovelaceValueOf amount      
    ledgerTx <- submitTx tx                                                                          
    void $ awaitTxConfirmed $ getCardanoTxId ledgerTx                                                
    logInfo @String $ printf "made a gift of %d lovelace" amount                                     
```

- 👇 The **typed** version of the same `give` contract

```Haskell
give :: AsContractError e => Integer -> Contract w s e ()
give amount = do
    let tx = mustPayToTheScript () $ Ada.lovelaceValueOf amount               
    ledgerTx <- submitTxConstraints typedValidator tx                         
    void $ awaitTxConfirmed $ getCardanoTxId ledgerTx                         
    logInfo @String $ printf "made a gift of %d lovelace" amount              
```

- `mustPayToOtherSCript` changes to `mustPayToTheScript` 
    - `mustPayToTheScript` **doesn't** need the `valHash`, it is **inferring** it from itself. <- 🚨 ??
- since the **Datum** is `()`, we don't need  `(Datum $ Builtins.mkI 0)`, we can itself provide `()`
- This `give` function is using **high level** types 
    - This means the **validator** is a **typedValidator**
        - Just like we needed to specify the types for the `goodRedeemer` function, we specify our `typedValidator` and then pass `tx`
            - `submitTx` changes to `submitTxConstraints typedValidator`
                - The constraints are in relation to the **injected data types**