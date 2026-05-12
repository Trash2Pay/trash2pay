# T2C Token — BSV Smart Contract

`contracts/bsv/T2CToken.scrypt.ts` implements the **Trash2Cash (T2C)** reward token on BSV using [sCrypt](https://scrypt.io).

## Specs

| Property | Value |
|---|---|
| Symbol | T2C |
| Chain | BSV (UTXO state-machine contract) |
| Mintable | ✅ via oracle-signed reward events |
| Lockable | ✅ T2P-on-Solana lock collateralises T2C mints |
| Burnable | ✅ owner + oracle signed |
| Reward rate | **1 T2C per 100 kg** waste |
| Processor unlock | only when ≥ **1000 kg** processed |
| T2P (Solana) supply | 1,000,000,000 (fixed) |

## Reward triggers (oracle-attested)

1. **User reward** — `mintUserReward(kg, userPubKey, oracleSig)` after a collector verifies the user's pickup QR scan.
2. **Collector reward** — `mintCollectorReward(kg, collectorPubKey, oracleSig)` after a processor scans the collector's QR on dispatch.
3. **Processor reward** — `mintProcessorReward(kg, processorPubKey, oracleSig)` accumulates kg in `processorBuffer`; rewards are emitted in 1000 kg chunks (10 T2C / chunk).

## T2P ↔ T2C backing

- T2P is the platform's fund-raising token on **Solana** (1B fixed supply).
- To mint T2C on BSV, an equivalent amount of T2P must first be **locked** in the platform owner's Solana custodial vault.
- The oracle signs a Solana lock proof; the contract's `lockT2PForMint(amount, ownerSig, oracleSig)` increments `lockedT2P` and mints the matching T2C to the owner's BSV address (platform treasury).
- Invariant enforced on every mint: `totalSupply ≤ lockedT2P`.

## State (carried in contract UTXO)

```
totalSupply      // total T2C minted
lockedT2P        // cumulative T2P locked on Solana
processorBuffer  // unrewarded processed kg (mod 1000)
nonce            // anti-replay counter
ownerPubKey      // platform / T2P owner BSV pubkey  (immutable)
oraclePubKey     // backend oracle pubkey            (immutable)
```

## Compile & deploy

```bash
npm i -D scrypt-cli scrypt-ts
npx scrypt-cli compile contracts/bsv/T2CToken.scrypt.ts
npx scrypt-cli deploy
```

The backend (`supabase/functions/verify-qr-code` etc.) becomes the **oracle**: after a successful QR verification or processor weigh-in, it signs the corresponding `(action || payload || nonce)` payload with the oracle key and submits the BSV tx that calls the matching `mint*` method.
