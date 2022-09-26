---
title: 'Plutus Vesting Contract'
author: 'RM'
date: 'September 12, 2022'
imagepath: 'https://imgs.search.brave.com/U7OzRcfAyl_j-OHi8nuQYQ5zMfArqMBGl74UCJsO4IA/rs:fit:715:479:1/g:ce/aHR0cHM6Ly9kZXNp/Z25zaGFjay5uZXQv/d3AtY29udGVudC91/cGxvYWRzL3BsYWNl/aG9sZGVyLWltYWdl/LnBuZw'
imagename: 'Placeholder image'
description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquam sit ipsum, nemo neque id voluptate quos labore, minus voluptatem tempora alias et, eos quae nam fugit'
---

# Plutus Vesting Contract

In the eUTxO model, when you are making a tx, the eUTxO contains a datum and when eutxos are handled on a script, the datum becomes like a password. 
The eutxo saves the datum hash and you need to provide the real datum data for the eutxo 
FOr consumption of a utxo under a script address, you need to pass two things: 
    - The validation, a validator or validators that succeeds
    - The appropriate datum. 
So, the eUTxO stores the **hash** of the datum and the real data from the datum needs to be passed in to perform the authentication.

![Placeholder image](https://imgs.search.brave.com/U7OzRcfAyl_j-OHi8nuQYQ5zMfArqMBGl74UCJsO4IA/rs:fit:715:479:1/g:ce/aHR0cHM6Ly9kZXNp/Z25zaGFjay5uZXQv/d3AtY29udGVudC91/cGxvYWRzL3BsYWNl/aG9sZGVyLWltYWdl/LnBuZw)
----- 

## On-chain code

- The contract is going to ignore the redeemer and use the datum. 
- The contract will work like this:
    - take eutxos (value)
    - lock it to a smart contract
        - two conditions to consider:
            - the right account requesting the funds
            - the deadline must be met

## Datum

- `data VestingDatum` uses bracket notation to pass the two values: `beneficiary :: PaymentPubKeyHash` and `deadline :: POSIXTime`
- `beneficiary :: PaymentPubKeyHash` - we need to get the hash of the public key of "somebody". this means that this "somebody" must have signed the transaction, which is where we get the pubkeyhash with their payment signing key.
- `deadline :: POSIXTime` - POSIXTime is a Unix standard that counts time in miliseconds. 
- we inject the `VestingDatum` type into the context with `PlutusTx.unstableMakeIsData`

## Validator

### Type signature
- Pass the datum data type `VestingDatum`
- Ignore the redeemer
- Pass the script context 
- Answer bool

### Runction expression**
- vesting validator takes the datum `dat`, unit `()` and script context `ctx`
- using `traceIfFalse` we define the message for `false` and call it with `signedByBeneficiary` and `traceIfFalse` `"Deadline not reached"` and call it with `deadlineReached` 
    - you can do a lot of traceIfFalse with different validations depending on the use case
    - in this case, we are implying two
        - the beneficiary must have signed the tx
        - the deadline has to have been reached **and passed**
### Before we move on, a slight problem with the deadline
- The tx doesn't have a specific time, but a **range**
- This **range** of the tx needs to be **after** the deadline, middle positions don't work, all ranges must be after the deadline

### Script context
- The script context is a wrapper for two types
    
    - A `TxInfo` -> which has information about
        - tx inputs 
        - tx outputs 
        - fees paid by the tx
        - value minted by the tx
        - digests of certs included in the tx
        - withdrawals
        - valid range for the tx 
            - a POSIX time range is an `Interval` of `POSIXTime`s
                - an `Interval of POSIXTime`s is a wrapper of a `LowerBound` and `UpperBound` of type `a`, in this case type `POSIX` time.
            - POSIX time represents an integer 
                - `newtype POSIXTime`
                    - Constructors
                        - `POSIXTime`
                            - `getPOSIXTime :: Integer`
        - signatures provided with the tx attested that they all signed the tx 
            - `txInfoSignatories :: [PubKeyHash]` -> it has the key hashes of any of the signers of the transaction
        - the datum and the hash of the datum `txInfoData :: [(DatumHash, Datum)]`
        - hash of the pending transaction (excluding witnesses)
        - tx id -> `txInfoId :: TxId`
    
    - A `ScriptPurpose` -> payment
        - Minting
        - Spending
        - Rewarding
        - Certifying

### `where` ...

- `TxInfo` is comparable to the POSIXTime in the `deadline` value of `VestingDatum`. 
- This means we can extract the `POSIX` time range from it.
    - We create a function `info` that has type `TxInfo`
    - `info` is going to use the notation auxiliary function `scriptContextTxInfo` to take the `ctx` and extract `TxInfo` into `info`
- Next we create the `signedByBeneficiary` function which has type `Bool`
    - A simple function which can be curried to a single type and evaluate
        - The auxiliary function `txSignedBy :: TxInfo -> PubKeyHash -> Bool` takes a `TxInfo` and a `PubKeyHash` and returns a `Bool`
            - In other words, is this pubkeyhash in this txinfo? yes or no
- **However**, the actual signature is not in `PubKeyHash` on the vesting datum
    - It is wrapped with the `PaymentPubKeyHash`
        - We need to unwrap it: 
            - `info $ unPaymentPubKeyHash $ beneficiary dat` and pass the payment pub key hash that can be taken from the datum 
            - `unPaymentPubKeyHash` from the [Ledger.Address](https://playground.plutus.iohkdev.io/doc/haddock/plutus-ledger/html/Ledger-Address.html)
                - it's one of the **Constructors** of `PaymentPubKeyHash`
                - has type signature `unPaymentPubKeyHash :: PubKeyHash` 
- All of this is happening on-chain and only using the datum -> `dat` and the script context `info`, not taking anything from the outside world for the redeemer
- `deadlineReached` has type `Bool`
    - There are auxiliary functions for the `POSIX time` 
        - `contains` extracts the deadline from the datum -> `contains (from $ deadline dat)`  
        - `info` is passed to `txInfoValidRange` from `txInfo` 
    - The expression `deadlineReached = contains (from $ deadline dat) $ txInfoValidRange info`
        - checks that the range of the `deadline` in the `datum` is **contained** within the 'valid range' (`txInfoValidRange`) taken from the script context `info`
            - the range of the deadline is from `Lower bound` to infinite
            
## Off-chain code

Notice how we don't need to inject any code. In the off-chain section, we are free to use plain Haskell. 

### `give` endpoint custom data type `GiveParams`

- The off-chain code needs to provide the **datum**
- The `GiveParams` custom data type is from the `give` endpoint
- The data `GiveParams` need to be defined
    - we use bracket notation to pass the parameters: 
        - `gpBeneficiary` that has type `!PaymentPubKeyHash`
        - `gpDeadline` which has type `!POSIXTime`
        - `gpAmount` which has type `!Integer` -> The amount of the give is not in the validator

### Vesting Schema
- The `grab` endpoint doesn't need a redeemer so we just pass unit
- The `give` endpoint takes the `GiveParams`


### The flow of information in a eUTxO transaction
- When using the `give` endpoint, we are sending a eUTxO to the contract
    - Those eUTxO's need to have datums
        - In this example, this datum should include
            - Who is the beneficiary
            - What is the deadline

### The `give` endpoint
- The data type will include the `GiveParams` 
- The function takes `gp` and uses `do` notation to
    - let `dat` be a `VestingDatum` (defined above) data type
        - use bracket notation to 
            - pull the `beneficiary` from `gp` (aka `GiveParams`) -> `gpBeneficiary gp`
            - pull the `deadline` from `gpDeadline gp`
    - Next we create the `tx`
        - In this case, we are passing the amount from `gp` the amount inside the `Integer` inside `gpAmount`
        - `gpAmount gp` pass the value to `Ada.lovelaceValueOf` 
        - `tx = Constraints.mustPayToTheScript dat $ Ada.lovelaceValueOf $ gpAmount gp`
                                        datum  👆  | ----------- 👆 amount ----------- |

### The `grab` endpoint
- The  `grab` endpoint verifies if the right eUTxO with the right dates is passing
- `grab` uses `do` notation to
    - grab `now` from `currentTime`
    - `pkh` (pub key hash) is taken from `ownPaymentPubKeyHash`
        - This verifies that the wallet calling the contract is the one given the pkh. 
        -  This calls the contract and ask it to give the value
            - The contract then validates if 
                - it is the pubkey of the beneficiary of the eutxo
                - is the deadline of that eutxo compliant
    - Then `Map.filter(isSuitable pkh now) $` and run that function on the `utxosAt scrAddress`
    - Use `if` `else` `then`
        - `if` there are no suitable utxos, `then` logs no gifts available
        - `else` confirm the transaction and log a message saying the gift has been collected 
    - Now we define the `isSuitable` function (an off-chain validator)
        - Takes the pkh, a posixtime and the chain index tx out (basically the index of the utxo) 
            - 

The off-chain validation can be corrupted, it is the on-chain validation that guarantees. Sort of like front end and back end validation in web development. 