---
title: 'Plutus Imports'
author: 'RM'
date: 'September 12, 2022'
imagepath: 'https://imgs.search.brave.com/U7OzRcfAyl_j-OHi8nuQYQ5zMfArqMBGl74UCJsO4IA/rs:fit:715:479:1/g:ce/aHR0cHM6Ly9kZXNp/Z25zaGFjay5uZXQv/d3AtY29udGVudC91/cGxvYWRzL3BsYWNl/aG9sZGVyLWltYWdl/LnBuZw'
imagename: 'Placeholder image'
description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam sit ipsum, nemo neque id voluptate quos labore, minus voluptatem tempora alias et, eos quae nam fugit'
---


# import `Plutus`

## Table of Contents
1. [Plutus Ledger Api](#plutus-ledger-api-0.1.0.0)
2. [PlutusTx Base](#plutus-tx-0.1.0.0)
3. [Playground Types](#playground-common-0100)
4. [Plutus Ledger Constraints](#plutus-ledger-constraints-0100)

## plutus-ledger-api-0.1.0.0
### Plutus.V1.Ledger.Api
[Plutus V1 interface to the Plutus ledger for the Cardano ledger](https://playground.plutus.iohkdev.io/doc/haddock/plutus-ledger-api/html/Plutus-V1-Ledger-Api.html)

1. Scripts

- type `SerializedScript = ShortByteString`
  Scripts to the ledger are serialised bytestrings.

- data `Script`. A script on the chain

- `fromCompiledCode :: CompiledCode a -> Script`
  Turn a `CompiledCode` (usually produced by `compile`) into a `Script` for use with this package.

2. Validating scripts

- `validateScript :: SerializedScript -> Bool`. 
  Check if a `Script` is "valid". At the moment this just means "deserialises correctly", which implies that it is (almost certainly) an encoded script and cannot be interpreted as some other kind of encoded data.

3. Running scripts

- `evaluateScriptRestricting`
    - `:: VerboseMode` , whether to produce log output
    - `-> CostModelParams`, the cost model to use
    - `-> ExBudget`, the resource budget which must not be exceeded during evaluation
    - `-> SerializedScript`, the script to evaluate
    - `-> [Data]`, the arguments to the script
    - `-> (LogOutput, Either EvaluationError ExBudget)`

Evaluates a script, with a cost model and a budget that restricts how many resources it can use according to the cost model. Also returns the budget that was actually used.

Can be used to calculate budgets for scripts, but even in this case you must give a limit to guard against scripts that run for a long time or loop.

- `evaluateScriptCounting`
    - `:: VerboseMode`
    - `-> CostModelParams`
    - `-> SerializedScript`
    - `-> [Data]`
    - `(LogOutput, Either EvaluationError ExBudget)`

Evaluates a script, returning the minimum budget that the script would need to evaluate successfully. 
This will take as long as the script takes, if you need to limit the execution time of the script also, you can use `evaluateScriptRestricting`, which also returns the used budget.

4. Costing-related types

- data `ExBudget`
- newtype `ExCPU`, Counts CPU units in picoseconds: maximum value for SatInt is 2^63 ps, or appproximately 106 days.
- newtype `ExMemory`, Counts size in machine words.
- data `SatInt`

- **Cost model**
    - `validateCostModelParams :: CostModelParams -> Bool`
    - `defaultCostModelParams :: Maybe CostModelParams`, the default cost model data. This is exposed to the ledger, so let's not confuse anybody by mentioning the CEK machine
    - type `CostModelParams = Map Text Integer`

5. Context types

- data `ScriptContext`
- data `ScriptPurpose`, purpose of the script that is currently running

**Supporting types used in the context types**
**ByteStrings**

-  data `BuiltinByteString`, an opaque type representing Plutus Core ByteStrings
- `toBuiltin :: ToBuiltin a arep => a -> arep`
- `fromBuiltin :: FromBuiltin arep a => arep -> a`

**Bytes**

- newtype `LedgerBytes`
- `fromBytes :: ByteString -> LedgerBytes`

**Certificates**

- data `DCert`, a representation of the ledger DCert. Some information is digested, and not included

**Credentials**

- data `StakingCredential`, staking credential used to assign rewards
- data `Credential`

**Value**

- newtype `Value`
  Operations on currencies are usually implemented pointwise. That is, we apply the operation to the quantities for each currency in turn. So when we add two `Values` the resulting `Value` has, for each currency, the sum of the quantities of that **particular** currency in the argument `Value`. The effect of this is that the currencies in the `Value` are "independent", and are operated on separately.

  Whenever we need to get the quantity of a currency in a `Value` where there is no explicit quantity of that currency in the `Value`, then the quantity is taken to be zero.

- newtype `TokenName`, ByteString of a name of a token, shown as UTF-8 string when possible
- `singleton :: CurrencySymbol -> TokenName -> Integer -> Value`, make a `Value` containing only the given quantity of the given currency.
- `unionWith :: (Integer -> Integer -> Integer) -> Value -> Value -> Value`
- `adaSymbol :: CurrencySymbol`, the `CurrencySymbol` of the Ada currency.
- `adaToken :: TokenName`, the `TokenName` of the Ada currency.

**Time**

- newtype `POSIXTime`, POSIX time is measured as the number of milliseconds since 1970-01-01T00:00:00Z
- type `POSIXTimeRange = Interval POSIXTime`, an `Interval` of `POSIXTimes`

**Types for representing transactions**

- data `Address`, address with two kinds of credentials, normal and staking.
- data `TxInfo`, a pending transaction. This is the view as seen by validator scripts, so some details are stripped out.
- data `TxOut`, A transaction output, consisting of a target address, a value, and optionally a datum hash
- data `TxOutRef`, a reference to a transaction output. This is a pair of a transaction reference, and an index indicating which of the outputs of that transaction we are referring to.
- data `TxInInfo`, an input of a pending transaction.

**Intervals**

- data `Interval a`
    - An interval of `a`s
    - The interval may be either closed or open at either end, meaning that the endpoints may or may not be included in the interval
    - The interval can also be unbounded on either side
    - data `Extended a`, a set extended with a positive and negative infinity
    - type `Closure = Bool`, whether a bound is inclusive or not
    - data `UpperBound a`, the upper bound of an interval
    - data `LowerBound a`, the lower bound of an interval
    - `always :: Interval a`, an `Interval` that covers every slot
    - `from :: a -> Interval a`, from `a` is an `Interval` that includes all values that are greater than or equal to `a`.
    - `to :: a -> Interval a`, `to` `a` is an `Interval` that includes all values that are smaller than or equal to `a`
    - `lowerBound :: a -> LowerBound a`
    - `upperBound :: a -> UpperBound a`
    - `strictLowerBound :: a -> LowerBound a`
    - `strictUpperBound :: a -> UpperBound a`

**Newtypes for script/datum types and hash types**

- newtype `Validator`, `Validator` is a wrapper around `Scripts` which are used as validators in transaction outputs.
- `mkValidatorScript :: CompiledCode (BuiltinData -> BuiltinData -> BuiltinData -> ()) -> Validator`
- `unValidatorScript :: Validator -> Script`
- newtype `ValidatorHash`, `Script` runtime representation of a Digest SHA256.
- newtype `MintingPolicy`, `MintingPolicy` is a wrapper around `Scripts` which are used as validators for minting constraints.
- `mkMintingPolicyScript :: CompiledCode (BuiltinData -> BuiltinData -> ()) -> MintingPolicy`
- `unMintingPolicyScript :: MintingPolicy -> Script`
- newtype `MintingPolicyHash`, `Script` runtime representation of a Digest SHA256.
- newtype `StakeValidator`, `StakeValidator` is a wrapper around `Scripts` which are used as validators for withdrawals and stake address certificates.
- `mkStakeValidatorScript :: CompiledCode (BuiltinData -> BuiltinData -> ()) -> StakeValidator`
- `unStakeValidatorScript :: StakeValidator -> Script`
- `newtype StakeValidatorHash`, `Script` runtime representation of a Digest SHA256.
- newtype `Redeemer`, `Redeemer` is a wrapper around Data values that are used as redeemers in transaction inputs.
- newtype `RedeemerHash`
- newtype `Datum`, `Datum` is a wrapper around Data values which are used as data in transaction outputs.
- newtype `DatumHash`

6. Data

- data `Data`, a generic "data" type. The main constructor `Constr` represents a datatype value in sum-of-products form: `Constr i args` represents a use of the `i`th constructor along with its arguments. The other constructors are various primitives.

- newtype `BuiltinData`, a type corresponding to the Plutus Core builtin equivalent of `Data`. The point of this type is to be an opaque equivalent of `Data`, so as to ensure that it is only used in ways that the compiler can handle. 
As such, you should use this type in your **on-chain code**, and in any data structures that you want to be representable on-chain.
For **off-chain** usage, there are conversion functions `builtinDataToData` and `dataToBuiltinData`, but note that these will not work on-chain.

- class `ToData a` where, a typeclass for types that can be converted to and from `BuiltinData`.

![Placeholder image](https://imgs.search.brave.com/U7OzRcfAyl_j-OHi8nuQYQ5zMfArqMBGl74UCJsO4IA/rs:fit:715:479:1/g:ce/aHR0cHM6Ly9kZXNp/Z25zaGFjay5uZXQv/d3AtY29udGVudC91/cGxvYWRzL3BsYWNl/aG9sZGVyLWltYWdl/LnBuZw)
----- 

**Methods**
    - `toBuiltinData :: a -> BuiltinData`, convert a value to `BuiltinData`.

- class `FromData a` where

**Methods**
    - `fromBuiltinData :: BuiltinData -> Maybe a`, convert a value from `BuiltinData`, returning `Nothing` if this fails.

- class `UnsafeFromData` a where

**Methods**
    - `unsafeFromBuiltinData :: BuiltinData -> a`, convert a value from `BuiltinData`, calling `error` if this fails. This is typically much faster than `fromBuiltinData`
    When implementing this function, make sure to call `unsafeFromBuiltinData` rather than `fromBuiltinData` when converting substructures.

- `toData :: ToData a => a -> Data`, convert a value to `Data`
- `fromData :: FromData a => Data -> M aybe a`, convert a value from `Data`, returning `Nothing` if this fails
- `dataToBuiltinData :: Data -> BuiltinData`, convert a `Data` into a `BuiltinData`. **Only works off-chain**
- `builtinDataToData :: BuiltinData -> Data`, convert a `BuiltinData` into a `Data`. **Only works off-chain**

1. Errors

- data `EvaluationError`, errors that can be thrown when evaluating a Plutus script



### Plutus.V2.Ledger.Api
[Plutus V2 interface to the Plutus ledger for the Cardano ledger](https://playground.plutus.iohkdev.io/doc/haddock/plutus-ledger-api/html/Plutus-V2-Ledger-Api.html)
1. Scripts
2. Validating scripts
3. Running scripts
4. Costing-related types
5. Context types
    - Plutus V2 adds `Association maps` to the `Supporting types used in the context types category` of `Context types`
6. Data
7. Errors


## plutus-tx-0.1.0.0
### PlutusTx.Base

[Plutus Tx basic functions](https://playground.plutus.iohkdev.io/doc/haddock/plutus-tx/html/PlutusTx-Base.html)

| Type signature | Description | 
| -------------- | ----------- | 
| `fst :: (a,b) -> a` | Plutus Tx version of `fst` extracts the first component of a pair | 
| `snd :: (a,b) -> b` | Plutus Tx version of `snd` extracts the second component of a pair | 
| `curry :: ((a,b) -> c) -> a -> b -> c` | |
| `uncurry :: (a -> b -> c) -> (a, b) -> c` | | 
| `($) :: (a -> b) -> a -> b` | Plutus Tx version of `Data.Function.($)` which is an application operator. It has a low, right-associative binding precedence, so it sometimes allows avoiding parentheses, i.e. `f $ g $ h x = f(g(h x))` |
| `flip :: (a -> b -> c) -> b -> a -> c` | Plutus Tx version of `flip` | 
| `until :: (a -> Bool) -> (a -> a) -> a -> a` | Plutus Tx version of `until` | 
| `(.) :: (b -> c) -> (a -> b) -> a -> c` | Plutus Tx version of `Prelude.(.)` | 
| `const :: a -> b -> a` | -> Plutus Tx version of `const` | 
| `id :: a -> a` | Plutus Tx version of `id` | 
 

## playground-common-0.1.0.0
### Playground.Types
[Playground.Types](https://playground.plutus.iohkdev.io/doc/haddock/playground-common/html/Playground-Types.html)

1. data `KnownCurrency`
2. `adaCurrency :: KnownCurrency`
3. data `PayToWalletParams`
4. data `SimulatorWallet`
5. data `ContractCall a`
6. type `SimulatorAction = ContractCall (Fix FormArgumentF)`
7. type `Expression = ContractCall Value`
8. data `Simulation`
9. data `Evaluation`
10. `pubKeys :: Evaluation -> [PaymentPubKeyHash]`
11. data `EvaluationResult`
12. data `CompilationResult`
13. data `ContractDemo`
14. data `FunctionSChema a`
15. data `PlaygroundError`


## plutus-ledger-constraints-0.1.0.0
### Ledger.Constraints
[Ledger Constraints](https://playground.plutus.iohkdev.io/doc/haddock/plutus-ledger-constraints/html/Ledger-Constraints.html)
This module defines `TxConstraints`, a list of constraints on transactions. 
A `TxConstraints` value can be used both to 
    - generate a transactions that satisfies the constraints (off-chain using `mkTx`) and 
    - check whether a given pending transaction meets the constraints (on-chain using `checkScriptContext`)

1. data `TxConstraints i o`
2. data `TxConstraint`
3. data `ScriptInputConstraint a`
4. data `ScriptOutputConstraint a`

#### Defining constraints

1. `mustPayToTheScript :: forall i o. ToData o => o -> Value -> TxConstraints i o`

- `mustPayToTheScript d v` locks the value `v` with a script alongside a datum `d`.
- If used **off-chain**, creates a script output with `d` and `v` and adds `d` in the transaction's datum witness set. 
    - The script address is derived from the typed validator that is provided in the `ScriptLookups` with `typedValidatorLookups` 
- If used **on-chain**, the constraint verifies that `d` is part of the datum witness set and that the new script transaction output with `d` and `v` is part of the transaction's outputs.

2. `mustPayToPubKey :: forall i o. PaymentPubKeyHash -> Value -> TxConstraints i o`

- `mustPayToPubKey pkh v` is the same as `mustPayWithDatumToPubKeyAddress`, but without any staking key hash and datum.

3. `mustPayToPubKeyAddress :: forall i o. PaymentPubKeyHash -> StakePubKeyHash -> Value -> TxConstraints i o`

- `mustPayToPubKeyAddress pkh skh v` is the same as `mustPayWithDatumToPubKeyAddress`, but without any datum.

4. `mustPayWithDatumToPubKey :: forall i o. PaymentPubKeyHash -> Datum -> Value -> TxConstraints i o`

- mustPayWithDatumToPubKey pkh d v is the same as mustPayWithDatumToPubKeyAddress, but without the staking key hash.

5. `mustPayWithDatumToPubKeyAddress :: forall i o. PaymentPubKeyHash -> StakePubKeyHash -> Datum -> Value -> TxConstraints i o`

- `mustPayWithDatumToPubKeyAddress pkh skh d v` locks a transaction output with a public key address.
- If used **off-chain**, it creates a public key output with `pkh`, `skh`, `d` and `v` and maybe adds `d` in the transaction's datum witness set. 
- If used **on-chain**, it verifies that `d` is part of the datum witness set and that the public key transaction output with `pkh`, `skh`, `d` and `v` is part of the transaction's outputs.

6. `mustMintCurrency :: forall i o. MintingPolicyHash -> TokenName -> Integer -> TxConstraints i o`

- Same as `mustMintCurrentWithRedeemer`, but sets the redeemer to the unit redeemer.

7. `mustMintCurrencyWithRedeemer :: forall i o. MintingPolicyHash -> Redeemer -> TokenName -> Integer -> TxConstraints i o`

- `mustMintCurrencyWithRedeemer mph r tn a` creates the given amount `a` of the currency specified with `mph`, `r` and `tn`.

- If used **off-chain**, it mints a currency using `mph`, `r`, `tn` and `a`, adds `mph` in the transaction's minting policy witness set and adds `r` in the transaction's redeemer witness set. The minting policy must be provided in the `ScriptLookups` with `typedValidatorLookups` or `mintingPolicy`.

- If used in **on-chain**, it verifies that the minted currency's `mph`, `tn` and `a` is part of the transaction's minting information.

8. `mustMintValue :: forall i o. Value -> TxConstraints i o`

- Same as `mustMintValueWithRedeemer`, but sets the redeemer to the unit redeemer.

9. `mustMintValueWithRedeemer :: forall i o. Redeemer -> Value -> TxConstraints i o`

- Same as `mustMintCurrentWithRedeemer`, but uses the minting policy hash, token name and amount provided by `Value`.

- Note that we can derive the `MintingPolicyHash` from the `Value`'s currency symbol.

10. `mustSpendAtLeast :: forall i o. Value -> TxConstraints i o`

- `mustSpendAtLeast v` requires the sum of the transaction's inputs value to be at least `v`.
- If used **off-chain**, it adds the missing input value with an additional public key output using the public key hash provided in the `ScriptLookups` with `ownPaymentPubKeyHash` and optionnaly `ownStakePubKeyHash`.
- If used **on-chain**, it verifies that the sum of the transaction's inputs value to be at least `v`.

11. `mustSpendPubKeyOutput :: forall i o. TxOutRef -> TxConstraints i o`

- `mustSpendPubKeyOutput utxo` must spend the given unspent transaction public key output.
- If used **off-chain**, it adds `utxo` as an input to the transaction. Information about this `utxo` must be provided in the `ScriptLookups` with `unspentOutputs`.
- If used **on-chain**, this constraint verifies that the transaction spends this utxo.

12. `mustSpendScriptOutput :: forall i o. TxOutRef -> Redeemer -> TxConstraints i o`

- `mustSpendScriptOutput utxo red` must spend the given unspent transaction script output.
- If used **off-chain**, it adds `utxo` and `red` as an input to the transaction. 
    - Information about this `utxo` must be provided in the `ScriptLookups` with `unspentOutputs`. 
    - The validator must be either provided by `unspentOutputs` or through `otherScript`. 
    - The datum must be either provided by `unspentOutputs` or through `otherData`.
- If used **on-chain**, it verifies that the transaction spends this `utxo`.

13. `mustValidateIn :: forall i o. POSIXTimeRange -> TxConstraints i o`

- `mustValidateIn r` requires the transaction's validity time range to be contained in `r`.
- If used **off-chain**, it sets the transaction's validity time range to `r`.
- If used **on-chain**, it verifies that the time range `r` is entirely contained in the transaction's validity time range.

14. `mustBeSignedBy :: forall i o. PaymentPubKeyHash -> TxConstraints i o`

- `mustBeSignedBy pk` requires the transaction to be signed by the public key `pk`.
- If used in **off-chain**, this constraint adds `pk` in the transaction's public key witness set.
- If used in **on-chain**, this constraint verifies that `pk` is part of the transaction's public key witness set.

15. `mustProduceAtLeast :: forall i o. Value -> TxConstraints i o`

- `mustProduceAtLeast v` requires the sum of the transaction's outputs value to be at least `v`.
- If used **off-chain**, this constraint adds the missing output value with an additionnal public key output using the public key hash provided in the `ScriptLookups` with `ownPaymentPubKeyHash` and optionnaly `ownStakePubKeyHash`.
- If used in **on-chain**, this constraint verifies that the sum of the transaction's outputs value to be at least `v`.

16. `mustIncludeDatum :: forall i o. Datum -> TxConstraints i o`

- `mustIncludeDatum d` requires the transaction to include the datum `d`.
- If used in **off-chain**, this constraint adds `d` in the transaction's datum witness set alongside it's hash (which is computed automatically).
- If used in **on-chain**, this constraint verifies that `d` is part of the transaction's datum witness set.

17. `mustPayToOtherScript :: forall i o. ValidatorHash -> Datum -> Value -> TxConstraints i o`

- `mustPayToOtherScript vh d v` locks the value `v` with the given script hash `vh` alonside a datum `d`.
- If used **off-chain**, it creates a script output with `vh`, `d` and `v` and adds `d` in the transaction's datum witness set.
- If used **on-chain**, this constraint verifies that `d` is part of the datum witness set and that the script transaction output with `vh`, `d` and `v` is part of the transaction's outputs.

18.  `mustHashDatum :: DatumHash -> Datum -> TxConstraints i o`

- `mustHashDatum dh d` requires the transaction to include the datum hash `dh` and actual datum `d`.
- If used in **off-chain**, this constraint adds `dh` and `d` in the transaction's datum witness set.
- If used in **on-chain**, this constraint verifies that `dh` and `d` are part of the transaction's datum witness set.

19. `mustSatisfyAnyOf :: forall i o. [TxConstraints i o] -> TxConstraints i o`

#### Queries on constraints

1. `modifiesUtxoSet :: forall i o. TxConstraints i o -> Bool`

- Check whether every transaction that satisfies the constraints has to modify the UTXO set.

2. `isSatisfiable :: forall i o. TxConstraints i o -> Bool`

- Are the constraints satisfiable?

#### On-chain validation

`checkScriptContext :: forall i o. ToData o => TxConstraints i o -> ScriptContext -> Bool`

- Does the `ScriptContext` satisfy the constraints?

#### Off-chain transaction generation

1. `data UnbalancedTx`

- An unbalanced transaction. It needs to be balanced and signed before it can be submitted to the ledger.

1. data `MkTxError`

2. `mkTx :: (FromData (DatumType a), ToData (DatumType a), ToData (RedeemerType a)) => ScriptLookups a -> TxConstraints (RedeemerType a) (DatumType a) -> Either MkTxError UnbalancedTx`

- Turn a `TxConstraints` value into an unbalanced transaction that satisfies the constraints. To use this in a contract, see `submitTxConstraints` and related functions.

3. `adjustUnbalancedTx :: UnbalancedTx -> UnbalancedTx`

- Each transaction output should contain a minimum amount of Ada (this is a restriction on the real Cardano network).

#### Combining multiple typed scripts into one transaction

1. data `SomeLookupsAndConstraints` where 

- Some typed `TxConstraints` and the `ScriptLookups` needed to turn them into an `UnbalancedTx`.
- `SomeLookupsAndConstraints :: forall a. (FromData (DatumType a), ToData (DatumType a), ToData (RedeemerType a)) => ScriptLookups a -> TxConstraints (RedeemerType a) (DatumType a) ->   SomeLookupsAndConstraints`	

2. `mkSomeTx :: [SomeLookupsAndConstraints] -> Either MkTxError UnbalancedTx`

- Given a list of SomeLookupsAndConstraints describing the constraints for several scripts, build a single transaction that runs all the scripts.

#### Lookups

1. data `ScriptLookups a`

2. `typedValidatorLookups :: TypedValidator a -> ScriptLookups a`

- A script lookups value with a script instance. For convenience this also includes the minting policy script that forwards all checks to the instance's validator.
- If called multiple times, only the first typed validator is kept:
    - ```typedValidatorLookups tv1 <> typedValidatorLookups tv2 <> ...
    == typedValidatorLookups tv1```

3. `unspentOutputs :: Map TxOutRef ChainIndexTxOut -> ScriptLookups a`

- A script lookups value that uses the map of unspent outputs to resolve input constraints.

4. `mintingPolicy :: MintingPolicy -> ScriptLookups a`

- A script lookups value with a minting policy script.

5. `otherScript :: Validator -> ScriptLookups a`

- A script lookups value with a validator script.

6. `otherData :: Datum -> ScriptLookups a`

- A script lookups value with a datum.

7. `paymentPubKey :: PaymentPubKey -> ScriptLookups a`

- A script lookup value with a payment public key

8. `ownPaymentPubKeyHash :: PaymentPubKeyHash -> ScriptLookups a`

- A script lookups value with a payment public key hash.
- If called multiple times, only the payment public key hash is kept:
    -  ```
        ownPaymentPubKeyHash pkh1 <> ownPaymentPubKeyHash pkh2 <> ...
        == ownPaymentPubKeyHash pkh1
        ```
9. `ownStakePubKeyHash :: StakePubKeyHash -> ScriptLookups a`

- A script lookups value with a stake public key hash.
- If called multiple times, only the stake public key hash is kept:
    -  ```
        ownStakePubKeyHash skh1 <> ownPaymentPubKeyHash pkh2 <> ...
        == ownStakePubKeyHash skh1
        ```
    



