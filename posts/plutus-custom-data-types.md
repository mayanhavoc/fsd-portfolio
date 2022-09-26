---
title: 'Plutus Custom Data Types'
author: 'RM'
date: 'September 12, 2022'
imagepath: 'https://imgs.search.brave.com/U7OzRcfAyl_j-OHi8nuQYQ5zMfArqMBGl74UCJsO4IA/rs:fit:715:479:1/g:ce/aHR0cHM6Ly9kZXNp/Z25zaGFjay5uZXQv/d3AtY29udGVudC91/cGxvYWRzL3BsYWNl/aG9sZGVyLWltYWdl/LnBuZw'
imagename: 'Placeholder image'
description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam sit ipsum, nemo neque id voluptate quos labore, minus voluptatem tempora alias et, eos quae nam fugit odit?'
---

# Plutus Custom Data Types

## On-chain code

### Custom data type

![Placeholder image](https://imgs.search.brave.com/U7OzRcfAyl_j-OHi8nuQYQ5zMfArqMBGl74UCJsO4IA/rs:fit:715:479:1/g:ce/aHR0cHM6Ly9kZXNp/Z25zaGFjay5uZXQv/d3AtY29udGVudC91/cGxvYWRzL3BsYWNl/aG9sZGVyLWltYWdl/LnBuZw)
----- 
One very important difference between high-level typed PlutusTx but basic types on Haskell vs advanced data types on Haskell is the use of
```
PlutusTx.unstableMakeIsData ''MyWonderfullRedeemer
``` 
Which writes an instance of the data type at compile time *(there is a `stableMakeIsData`, we are using this because this was has been used in examples so there are resources available)*.

`''MyWonderfullRedeemer` gets injected 💉 by one of Haskell's compiler extensions ( i.e., `{-# LANGUAGE <Compiler-extension-name> #-}`).

`newtype MyWonderfullRedeemer = MWR Integer`

The difference is that this `Integer` alone (as in the `TypedValidator` contract) is a basic Haskell data type that already exists in the Prelude, it's already INLINABLE, **but** `MyWonderfullRedeemer` is **not**.

### Custom data type Redeemer

- 👇 **Typed Redeemer**
```Haskell
{-# INLINABLE typedRedeemer #-} 
typedRedeemer :: () -> Integer -> ScriptContext -> Bool   
typedRedeemer _ redeemer _ = traceIfFalse "wrong redeemer" (redeemer == 42)
```

- 👇 **Custom** Typed Redeemer
```Haskell
{-# INLINABLE customTypedRedeemer #-} 
customTypedRedeemer :: () -> MyWonderfullRedeemer -> ScriptContext -> Bool   
customTypedRedeemer _ (MWR redeemer) _ = traceIfFalse "wrong redeemer" (redeemer == 42)
```Haskell
- The redeemer type `Integer` is now `MyWonderfullRedeemer`, (i.e, `newtype MyWonderfullRedeemer = MWR Integer`)
- In order to **pattern match** the **data constructor**, - aka - 
----
`redeemer` in 
```Haskell
typedRedeemer _ redeemer _ = traceIfFalse "wrong redeemer" (redeemer == 42)
``` 
is now 
```Haskell
customTypedRedeemer _ (MWR redeemer) _ = traceIfFalse "wrong redeemer" (redeemer == 42)
```
*notice the `(MWR)`*

Basically, we are defining a wrapper `MyWonderfullRedeemer` which: 
- contains an `Integer` value, (`MWR Integer` which can extracted through **pattern matching** *(see couple lines before)*   
----- 

**Custom** `data Typed`

- Typed
```Haskell
data Typed                                            
instance Scripts.ValidatorTypes Typed where      type instance DatumType Typed = ()                
    type instance RedeemerType Typed = Integer 
```

**Custom** Typed
```Haskell 
data Typed                                            
instance Scripts.ValidatorTypes Typed where
    type instance DatumType Typed = ()                
    type instance RedeemerType Typed = MyWonderfullRedeemer 
```

- All that changes is we need to change `Integer` to the new type `MyWonderfullRedeemer`

### What is `PlutusTx.unstableMakeIsData` doing?
- Plutus has a prelude library because in it, all data types (i.e., `head`, `tail`, etc.) are `INLINABLE`. They need to be in order to be inserted into the template Haskell that later gets compiled into Plutus Core, etc., etc.
    - However, here we are using our own **custom** data type with arbitrary logic. 
        - This data type is not included in the Plutus Prelude library **and is not** `INLINABLE`
    - That's where `PlutusTx.unstableMakeIsData` (there's also `PlutusTx.stableMakeIsData`), it allows us to make our own **custom data types** `INLINABLE`  

### Custom Typed Validator

- Typed Validator
```Haskell
typedValidator :: Scripts.TypedValidator Typed
typedValidator = Scripts.mkTypedValidator @Typed      
    $$(PlutusTx.compile [|| typedRedeemer ||]) 
    $$(PlutusTx.compile [|| wrap ||])                
  where
    wrap = Scripts.wrapValidator @() @Integer  
```

- **Custom** Typed Validator
```Haskell
typedValidator :: Scripts.TypedValidator Typed
typedValidator = Scripts.mkTypedValidator @Typed      -- Tell the compiler that you are using Types
    $$(PlutusTx.compile [|| typedRedeemer ||]) 
    $$(PlutusTx.compile [|| wrap ||])                -- Provide the translation into high level typed to low level typed
  where
    wrap = Scripts.wrapValidator @() @MyWonderfullRedeemer 
```
- Again, the only change is the substitution of the `Integer` data type for the `MyWonderfullRedeemer` data type


## Off-chain code

### Custom data type endpoints

```Haskell
type GiftSchema =
            Endpoint "give" Integer  
        .\/ Endpoint "grab" Integer
```
- The `grab` function's `Integer` is taken from the wallet, so there's no need to wrap it. 
    - I'm taking an integer, normally from the playground, in this case it's an enpoint into the wallet, from the off-chain, no wrapper needed.

- However, it does need to be (💉) injected into the code because it is passed here 👉  `Builtins.mkI n ` in 
```Haskell
grab :: forall w s e. AsContractError e => Integer -> Contract w s e ()                                     
grab n = do
    utxos <- utxosAt scrAddress                                                                      
    let orefs   = fst <$> Map.toList utxos                                                           
        lookups = Constraints.unspentOutputs utxos      <>                                           
                  Constraints.otherScript validator                                                  
        tx :: TxConstraints Void Void                                                           
        tx      = mconcat [mustSpendScriptOutput oref $ Redeemer $ Builtins.mkI n | oref <- orefs]  
                                                                                                     
    ledgerTx <- submitTxConstraintsWith @Void lookups tx                                             
    void $ awaitTxConfirmed $ getCardanoTxId ledgerTx                                                
    logInfo @String $ "collected gifts" 
```
- it needs an **auxiliary function** `PlutusTx.toBuiltinData` in 
```Haskell
grab :: forall w s e. AsContractError e => Integer -> Contract w s e ()                                     
grab n = do
    utxos <- utxosAt scrAddress                                                                      
    let orefs   = fst <$> Map.toList utxos                                                           
        lookups = Constraints.unspentOutputs utxos      <>                                           
                  Constraints.otherScript validator                                                  
        tx :: TxConstraints Void Void                                                            
        tx      = mconcat [mustSpendScriptOutput oref $ Redeemer $ PlutusTx.toBuiltinData (MWR n) | oref <- orefs]  
                                                                                                     
    ledgerTx <- submitTxConstraintsWith @Void lookups tx                                             
    void $ awaitTxConfirmed $ getCardanoTxId ledgerTx                                                
    logInfo @String $ "collected gifts"  
```

#### Recap
1. Normal Haskell custom data type definition -> `newtype MyWonderfullRedeemer = MWR Integer`
2. It's injected with `PlutusTx.unstableMakeIsData` (important part `MakeIsData`) which is just `Data` in PlutusTx
3. The auxiliary function `PlutusTx.toBuiltinData` (`toBuiltinData`) which means that we are bringing the 