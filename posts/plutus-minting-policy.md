---
title: 'Plutus Minting Policy'
author: 'RM'
date: 'September 12, 2022'
imagepath: 'https://imgs.search.brave.com/U7OzRcfAyl_j-OHi8nuQYQ5zMfArqMBGl74UCJsO4IA/rs:fit:715:479:1/g:ce/aHR0cHM6Ly9kZXNp/Z25zaGFjay5uZXQv/d3AtY29udGVudC91/cGxvYWRzL3BsYWNl/aG9sZGVyLWltYWdl/LnBuZw'
imagename: 'Placeholder image'
description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam sit ipsum, nemo'
---


# Plutus Minting Policy

![Placeholder image](https://imgs.search.brave.com/U7OzRcfAyl_j-OHi8nuQYQ5zMfArqMBGl74UCJsO4IA/rs:fit:715:479:1/g:ce/aHR0cHM6Ly9kZXNp/Z25zaGFjay5uZXQv/d3AtY29udGVudC91/cGxvYWRzL3BsYWNl/aG9sZGVyLWltYWdl/LnBuZw)
----- 

Compiler extensions: boilerplate (ref. DeadlineMinting.hs)

Own imports: 
`Plutus.Trace.Emulator  as Emulator` -> needed for emulator trace to work
`Wallet.Emulator.Wallet` -> needed for emulator trace to work

- No Datum needed

`Scripts.MintingPolicy`
`Minting` is a special type and is a function in the Cardano blockchain. 

`Scripts.wrapMintingPolicy` special function for policy validators

`scriptCurrencySymbol` just like `scriptAddresses` you have the hash of the script address (e.g. when you create a policy) and you use the hash of the native script that represents the policy becomes the policy id. The `scriptCurrencySymbol` function is how you get that id.

## The basic plutus contract 
The basic plutus contract is a minimal framework to which you can add code and it compiles when running it in the plutus playground/cabal repl. 

```Haskell
-- OFF-CHAIN

mint :: Contract w FreeSchema Text ()
mint = return ()

type FreeSchema = Endpoint "mint" ()

endpoints :: Contract () FreeSchema Text ()
endpoints = mint
-- mint' >> endpoints
--   where
--       mint' = awaitPromise $ endpoints @"mint" mint

mkSchemaDefinitions ''FreeSchema

mkKnownCurrencies []
```

`mkSchemaDefinitions ''FreeSchema` and `mkKnownCurrencies []` are required by Plutus Playground.

The rest of the code is a generalized contract and schema. 

The endpoints output is a **contract monad** (aka `Contract w FreeSchema Text ()`)


`singleton` is used for **native tokens** or **NFTs**.

Normally in the cardano cli you validate through the signature, there is no actual validation, simply authorization. 
In this case, however, we are validating from the transaction execution so, replacing the **authorization** with the **validator**. If the validator 'validates' the tx and if it passes, it is published.  