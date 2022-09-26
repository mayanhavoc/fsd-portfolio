---
title: 'Plutus Endpoints'
author: 'RM'
date: 'August 29, 2022'
imagepath: 'https://imgs.search.brave.com/U7OzRcfAyl_j-OHi8nuQYQ5zMfArqMBGl74UCJsO4IA/rs:fit:715:479:1/g:ce/aHR0cHM6Ly9kZXNp/Z25zaGFjay5uZXQv/d3AtY29udGVudC91/cGxvYWRzL3BsYWNl/aG9sZGVyLWltYWdl/LnBuZw'
imagename: 'Placeholder image'
description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam sit ipsum, nemo neque id'
---

# Plutus endpoints

Off-chain is a parameterized, flexible, programmable transaction construction that goes beyond what you can do in the Cardano CLI. 

## The `give` endpoint

## The `Schema`

- The datatype `Schema` is used for modelling the Schema's structure. 
- The two functions passed to `Schema` are the **endpoints**, e.g. `grab` and `give`.

![Placeholder image](https://imgs.search.brave.com/U7OzRcfAyl_j-OHi8nuQYQ5zMfArqMBGl74UCJsO4IA/rs:fit:715:479:1/g:ce/aHR0cHM6Ly9kZXNp/Z25zaGFjay5uZXQv/d3AtY29udGVudC91/cGxvYWRzL3BsYWNl/aG9sZGVyLWltYWdl/LnBuZw)
----- 

### `give`

```Haskell
give :: asContractError e => Integer -> Contract w s e ()
give amount = do
    let tx = mustPayToOtherScript valHash (Datum $ Builtins.mkI 0) $ Ada.lovelaceValueOf amount
    ledgerTx <- submitTx tx
    void $ awaitTxConfirmed $ getCardanoTxId ledgerTx
    logInfo @String $ printf "made a gift of %d lovelace" amount
```
- The `Integer` is the actual value taken called `amount` and is passed as an input to the contract as `amount`
- This 👆 is the equivalent of `--tx-in + <Quantity>` in Cardano CLI.
- The `Datum` is required, in this case we're just passing an arbitrary value (`Builtins.mkI 0`) because the `validator` doesn't care about the datum (i.e. `alwaysSucceeds _ _ _ = ()`, `alwaysFails _ _ _ = error ()` both ignore the Datum, Redeemer and Script in this case).
- `valHash` is necessary because the `mustPayToOtherScript` function can reference **any** `Script` (there is another function called `mustPayToThisScript` that emulates the behavior of `this` in Javascript (i.e. self-referencing). In this cases, it is **not** necessary to pass `valHash`).

- The construction of the transaction, fee calculations, etc happens in this part -> `let tx = mustPayToOtherScript valHas (Datum $ Builtins.mkI 0) $ Ada.lovelaceValueOf amount`

- Then the transaction is submitted -> `ledgerTx <- submitTx tx`

- The `void` expression (`void $ awaitTxConfirmed $ getCardanoTxId ledgerTx`) represents the validation of the transaction by the blockchain.

## Questions
In `AnotherGift.hs` in the `give` function. Which one exactly is the Monad?


## The `grab` endpoint

```Haskell
grab :: forall w s e. AsContractError e => Contract w s e ()
grab = do
    utxos <- utxosAt scrAddress
    let orefs   = fst <$> Map.toList utxos
        lookups = Constraints.unspentOutputs utxos  <>
                  Constraints.otherScript valudator
        tx :: TxConstraints Void Void
        tx      = mconcat [mustSpendScriptOutput oref $ Redeemer $ Builtins.mkI 17 | oref <- orefs]
    ledgerTx <- submitTxConstraintsWith @Void lookups tx
    void $ awaitTxConfirmed $ getCardanoTxId ledgerTx
    logInfo @String $ "collected gifts"
```

The `grab` endpoint:

- Takes the `utxos` from the `scrAddress`
- Does something with them, which includes the constraints:

```Haskell
    let orefs   = fst <$> Map.toList utxos
        lookups = Constraints.unspentOutputs utxos  <>
                  Constraints.otherScript valudator
```
- The `tx :: TxConstraints Void Void` is the paremeters of the tx. 
-               👆 similar to the `--tx-out` on the Cardano CLI
- The parameters are then concatenated and here you need to add a `Redeemer $ Builtins.mkI 17` because the consumption of a utxo address requires it, in this case it's a random arbitrary redeemer because our validator does not care about it. 


## Question
- What library does the data type `Constraints` come from?
- Clarify this line of code from the `grab` endpoint: `tx = mconcat [mustSpendScriptOutput oref $ Redeemer $ Builtins.mkI 17 | oref <- orefs>]`
    - what exactly does `mconcat` do? Is it a monad?
    - `mustSpendScriptOutput :: forall i o. TxOutRef -> Redeemer -> TxConstraints i o` 
        - If used **off-chain** it adds `utxo` and `constraint` as inputs to the tx. Information about the `utxo` must be provided in the `ScriptLookups` with `unspentOutputs`.
            - The validator must be either provided by `unspentOutputs` or through `otherScript`. 
            - The datum must be either provided by `unspentOutputs` or through `otherData`.
        - If used **on-chain**, it verifies that the transaction spends this utxo.