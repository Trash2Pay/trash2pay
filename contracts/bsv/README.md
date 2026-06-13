# T2P Token — BSV Settlement Smart Contract

`contracts/bsv/T2PToken.scrypt.ts` implements the **BSV-side T2P settlement
token** for Trash2Pay using [sCrypt](https://scrypt.io).

> **Note**: The previous reward-token contract (`T2PToken.scrypt.ts`,
> mint/burn per pickup) has been **superseded**. Rewards are now accrued
> off-chain as Supabase credits and settled on-chain in periodic
> redemption batches. Burning is removed — BSV T2P is a settlement asset.

## Dual-chain T2P architecture

| Layer | Role |
|---|---|
| **Solana T2P** | Ecosystem reserve asset · fundraising · liquidity · treasury collateral |
| **BSV T2P** (this contract) | Settlement token · micropayment utility · environmental proof layer · redemption asset |
| **Supabase credits** | Scalable reward engine · temporary accounting layer |
| **Smart contract** | Treasury controls · minting · bridge collateralisation · redemptions (no burn) |

Fixed Solana T2P supply: **1,000,000,000**. BSV T2P circulating supply is
always **≤ Solana T2P locked as collateral** (1:1 bridge invariant).

## Lifecycle

```
Pickup event
   │
   ▼
Backend oracle accrues T2P credits in Supabase (off-chain ledger)
   │   user / collector / processor balances increment per pickup
   │
   ▼
Periodic redemption batch
   │   backend builds merkle batch over (recipient, amount) leaves
   │   oracle signs:    (batchRoot, totalAmount, nonce)
   │   treasury signs:  authorises on-chain settlement
   │
   ▼
On-chain settlement (BSV)
   │   contract verifies collateral cover  (circulating + total ≤ locked)
   │   contract pays each recipient via committed payout outputs
   │   Supabase credits debited to match
```

## Contract methods

| Method | Signers | Purpose |
|---|---|---|
| `lockCollateral(amount, ownerSig, oracleSig)` | owner + oracle | Register a Solana-side T2P lock that backs future BSV mints. No tokens minted. |
| `processRedemptionBatch(batchRoot, totalAmount, payoutOuts, oracleSig, treasurySig)` | oracle + treasury | Mint & pay out a batch of redemptions from accrued Supabase credits. Enforces `circulating + total ≤ locked`. |
| `rotateTreasury(newTreasuryPubKey, ownerSig, oldTreasurySig)` | owner + old treasury | Rotate the treasury signing key. |

There is **no burn method** — BSV T2P is non-destructible on-chain.

## State (carried in contract UTXO)

```
circulatingSupply   // BSV T2P minted & in circulation
lockedCollateral    // Solana T2P locked as 1:1 backing
totalRedeemed       // cumulative redemption payouts
batchNonce          // monotonic anti-replay nonce
treasuryPubKey      // mutable via rotateTreasury
ownerPubKey         // immutable
oraclePubKey        // immutable
```

## Backend (oracle) responsibilities

The Supabase edge functions act as the oracle:

1. **Accrue credits** — `pickups-api`, `verify-qr-code` etc. credit
   `token_balances` per pickup using the project's reward formula.
2. **Build batch** — periodically aggregate pending credits per recipient,
   build a merkle tree of `(recipientPubKeyHash, amount)` leaves,
   compute `batchRoot` and `totalAmount`.
3. **Sign & broadcast** — sign `(ACTION_REDEMPTION_BATCH || batchRoot || totalAmount || nonce)`
   with the oracle key, request treasury co-sign, broadcast the BSV tx
   calling `processRedemptionBatch`.
4. **Settle Supabase** — on tx confirmation, debit the corresponding
   credits in Supabase.

## Backend implementation

| Piece | File |
|---|---|
| BSV smart contract | `contracts/bsv/T2PToken.scrypt.ts` |
| Redemption batch builder (oracle) | `supabase/functions/redemption-batch/index.ts` |
| Batch ledger table | `redemption_batches` (Supabase) |
| Oracle signing key | `ORACLE_PRIVATE_KEY` secret (base64 PKCS8 P-256) |

The `redemption-batch` function aggregates pending `token_redemptions`, builds
the merkle root, signs the commitment with the oracle key, and stores the batch
in `redemption_batches` with status `awaiting_treasury`. Treasury co-sign and
BSV broadcast happen out-of-band; on confirmation, mark the batch `confirmed`
and the corresponding `token_redemptions` as `completed`.

## Compile & deploy

```bash
npm i -D scrypt-cli scrypt-ts
npx scrypt-cli compile contracts/bsv/T2PToken.scrypt.ts
npx scrypt-cli deploy
```
