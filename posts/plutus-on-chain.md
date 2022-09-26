---
title: 'Plutus On Chain'
author: 'RM'
date: 'September 12, 2022'
imagepath: 'https://imgs.search.brave.com/U7OzRcfAyl_j-OHi8nuQYQ5zMfArqMBGl74UCJsO4IA/rs:fit:715:479:1/g:ce/aHR0cHM6Ly9kZXNp/Z25zaGFjay5uZXQv/d3AtY29udGVudC91/cGxvYWRzL3BsYWNl/aG9sZGVyLWltYWdl/LnBuZw'
imagename: 'Placeholder image'
description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam sit ipsum, nemo neque id voluptate quos labore, minus voluptatem tempora alias et, eos quae nam fugit'
---


# Plutus On-chain code

- `BuiltinData` -> low-level data type. Cheaper and better performance (this is the level that plutarch works on).
    - The reason for this low-level data types is that they align well with Plutus Core and on-chain code gets transpiled into Plutus Core (lambda calculus bytecode that goes into the blockchain) at **compile time**.
    - Everything in the on-chain code needs to "fit" into `BuiltinData`, if it's more complex, it will eventually need to be reduced to `BuiltinData` 
        - You can wrap it **on-chain** -> expensive
        - You can wrap it **off-chain** -> arbitrary

This 👇 is the code that **validates** or not the tx i.e, if the utxos can or cannot be consumed:

```Haskell
{-# INLINABLE alwaysSucceeds #-}
alwaysSucceeds :: BuiltinData -> BuiltinData -> BuiltinData -> ()
alwaysSucceeds _ _ _ = ()

{-# INLINABLE alwaysFails #-}
alwaysFails :: BuiltinData -> BuiltinData -> BuiltinData _. ()
alwaysFails _ _ _ = error ()
```

![Placeholder image](https://imgs.search.brave.com/U7OzRcfAyl_j-OHi8nuQYQ5zMfArqMBGl74UCJsO4IA/rs:fit:715:479:1/g:ce/aHR0cHM6Ly9kZXNp/Z25zaGFjay5uZXQv/d3AtY29udGVudC91/cGxvYWRzL3BsYWNl/aG9sZGVyLWltYWdl/LnBuZw)
----- 

- These are the **conditions** the transaction **must meet** in order for the utxos to be **consumed**. 


- `{-# LANGUAGE TemplateHaskell #-}` is a Haskell compiler extension, it allows you to do one thing: 
    - Plutus only uses certain parts of the libraries that it is importing. 
    - In the case of `TemplateHaskell`, Plutus uses it to **generate code at compile time**. 

    ```Haskell
    validator :: Validator
    validator = mkValidatorScript $$(PlutusTx.compile [|| goodRedeemer ||])
    ```
-                                           In order for this 👆 to be INLINABLE, you need to include the INLINABLE pragma `{-# INLINABLE goodRedeemer #-}`

## Defining the `goodRedeemer`
```Haskell
{-# INLINABLE goodRedeemer #-}
goodRedeemer :: BuiltinData -> BuiltinData -> BuiltinData -> ()
goodRedeemer _ redeemer _ 
  | redeemer == Builtins.mkI 42         = ()
  | otherwise              = traceError "Wrong Redeemer!"

```
- This 👆 `goodRedeemer` will **succeed** if the value `42` is provided and **fail** `otherwise`. 
- The `goodRedeemer` function cares **only** about the `redeemer`.

### Why use template Haskell and `INLINABLE` pragmas? 

- To increase modularity and maintanability, i.e.,
```Haskell
  validator :: Validator
  validator = mkValidatorScript $$(PlutusTx.compile [|| goodRedeemer :: BuiltinData -> BuiltinData -> BuiltinData -> ()
                                                        goodRedeemer _ redeemer _ 
                                                          | redeemer == Builtins.mkI 42         = ()
                                                          | otherwise              = traceError "Wrong Redeemer!" ||])
  ```
- 👆 This is going to be a pain to maintain.
    
```Haskell
{-# INLINABLE goodRedeemer #-}
goodRedeemer :: BuiltinData -> BuiltinData -> BuiltinData -> ()
goodRedeemer _ redeemer _ 
  | redeemer == Builtins.mkI 42         = ()
  | otherwise              = traceError "Wrong Redeemer!
validator :: Validator
validator = mkValidatorScript $$(PlutusTx.compile [|| goodRedeemer ||])
```
- Whereas this 👆, will allow us to update `goodRedeemer` without modifying the `validator` (it's also more readable). 

- The `Builtins.mkI` is a necessary wrapper function that turns the `Int` type into a `BuiltinData` type. The `I` is the constructor inside `BuiltinData` for **integer** values, not **floats**.
### What does the template Haskell do exactly?

- It takes the `goodRedeemer` function and generates the Plutus Core script code that goes into the blokchain. 
- In order to do that, all data types and functions **must be** `INLINABLE`, that is why plutus has its own prelude library (`PlutusTx.Prelude`), it includes the `INLINABLE` versions of the **basic functions** (not all, it is a *subset* of prelude) of prelude in Haskell. 

### `valHash`

```Haskell
valHash :: Ledger.ValidatorHash
valHash = Script.validatorHash validator

scrAddress :: Ledger.Address
scrAddress = scriptAddress validator
```

- In this case, the `Script` in the `valHash` function is calling the high-level type of `Script`, however it's name doesn't change. This will happen often as is designed to avoid rewriting too much code when making changes. This way, you can jump from a high to a low level or vice versa without changing all of the code because the functions will be calling the same **if you are using the same qualifier** (What is a qualifier? Which is the qualifier in this case? ) 


## Function evaluations

- `goodRedeemer` -> `Validator { <script> }` -> This is the compiled validator (in Plutus Core) and it is wrapped by the `Validator` data type.
- `valHash` -> `78947563cd8s97c7d0as9d7as8s00s9d8lalk3j3` 
- `scrAddress` -> `Address { addressCredential = ScriptCredential 78947563cd8s97c7d0as9d7as8s00s9d8lalk3j3, addressStakingCredential = Nothing }`

This is generated by template Haskell at compile time, and it allows us to use it, not as Haskell code, but Plutus Core script that you can keep in your code in some way (i.e., the `Validator {<script>`, the `valHash`, and the `scrAddress`}), in this case, to be used in the **off-chain** code.


## The last validator

The contract has no more utxo, but someone must pay the fees. So the wallet that is doing the grabbing gets provided a utxo that is used to pay the fees and give back change because the contract has no value. This implies you need to verify **off-chain** if you can actually do the transaction because you have the utxos necessary. If not, it should fail to avoid the expenditure of fees.

### Fun fact

The reason you 'wait' in the Plutus Playground is to simulate the passage of time. Due to the asynchronicity of the blockchain (is this a word?), there is no guarantee that the giving and the grabbing will happen at a predetermined order, so time for settlements must be provided. 