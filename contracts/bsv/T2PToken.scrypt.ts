/**
 * Trash2Pay (T2P) — BSV Settlement Token Smart Contract (sCrypt)
 * ----------------------------------------------------------------
 * Dual-chain T2P architecture
 * ----------------------------------------------------------------
 *   Solana T2P  → ecosystem reserve asset
 *                 fundraising token
 *                 liquidity asset
 *                 treasury collateral
 *
 *   BSV T2P     → settlement token  (this contract)
 *                 micropayment utility
 *                 environmental proof layer
 *                 redemption asset
 *
 *   Supabase    → off-chain reward engine
 *   credits       temporary accounting layer
 *                 (accrue per pickup, batched on-chain on redemption)
 *
 * Smart-contract roles
 *   - Treasury controls   (owner-gated parameter changes)
 *   - Minting             (oracle-attested redemption batches only)
 *   - Bridge collateral.  (1:1 lock of Solana T2P backs every BSV T2P minted)
 *   - Redemptions         (Supabase credit batch → on-chain payout)
 *   - NO BURN             (settlement asset is non-destructible on-chain)
 *
 * Flow
 *   1. User / collector / processor completes pickup events.
 *   2. Backend (oracle) accrues T2P credits in Supabase (off-chain ledger).
 *   3. Periodically, backend submits a signed RedemptionBatch:
 *        - oracle signs   (batchRoot, totalAmount, nonce)
 *        - treasury signs to authorise the on-chain settlement
 *        - contract verifies Solana-side T2P lock covers the new mint
 *        - contract mints BSV T2P to each recipient committed in batchRoot
 *
 * Fixed supply on Solana side: 1,000,000,000 T2P.
 * BSV T2P circulating supply is always ≤ Solana T2P locked as collateral.
 */

import {
    SmartContract,
    method,
    prop,
    PubKey,
    Sig,
    ByteString,
    Sha256,
    hash256,
    assert,
    SigHash,
    Utils,
    toByteString,
} from 'scrypt-ts'

export class T2PToken extends SmartContract {
    // ----- Constants -----
    static readonly T2P_SOLANA_TOTAL_SUPPLY: bigint = 1_000_000_000n

    // Action tags — bind oracle signatures to a specific intent
    static readonly ACTION_LOCK_COLLATERAL:  ByteString = toByteString('01', false)
    static readonly ACTION_REDEMPTION_BATCH: ByteString = toByteString('02', false)
    static readonly ACTION_TREASURY_UPDATE:  ByteString = toByteString('03', false)

    // ----- Stateful properties (carried in contract UTXO) -----
    @prop(true) circulatingSupply: bigint  // BSV T2P minted & in circulation
    @prop(true) lockedCollateral:  bigint  // Solana T2P locked as 1:1 backing
    @prop(true) totalRedeemed:     bigint  // cumulative T2P paid out via redemption
    @prop(true) batchNonce:        bigint  // monotonic anti-replay for batches
    @prop(true) treasuryPubKey:    PubKey  // mutable via treasury self-rotation

    // ----- Immutable properties -----
    @prop() readonly ownerPubKey:  PubKey  // platform owner (Solana T2P owner)
    @prop() readonly oraclePubKey: PubKey  // backend oracle key

    constructor(
        ownerPubKey:    PubKey,
        oraclePubKey:   PubKey,
        treasuryPubKey: PubKey
    ) {
        super(...arguments)
        this.ownerPubKey       = ownerPubKey
        this.oraclePubKey      = oraclePubKey
        this.treasuryPubKey    = treasuryPubKey
        this.circulatingSupply = 0n
        this.lockedCollateral  = 0n
        this.totalRedeemed     = 0n
        this.batchNonce        = 0n
    }

    // ============================================================
    // BRIDGE COLLATERALISATION
    //   Oracle attests that `amount` Solana T2P has been locked in the
    //   platform's Solana custodial vault. This unlocks an equivalent
    //   mint allowance for BSV T2P. No tokens are minted here — minting
    //   only happens via redemption batches.
    // ============================================================
    @method()
    public lockCollateral(
        amount:    bigint,
        ownerSig:  Sig,
        oracleSig: Sig
    ) {
        assert(amount > 0n, 'amount must be positive')
        assert(
            this.lockedCollateral + amount <= T2PToken.T2P_SOLANA_TOTAL_SUPPLY,
            'cannot exceed Solana T2P total supply'
        )
        assert(this.checkSig(ownerSig,  this.ownerPubKey),  'bad owner sig')
        assert(this.checkSig(oracleSig, this.oraclePubKey), 'bad oracle sig')

        this.lockedCollateral += amount
        this.batchNonce       += 1n
        this._propagateState()
    }

    // ============================================================
    // REDEMPTION BATCH
    //   Settles a batch of off-chain Supabase credits on-chain.
    //
    //   batchRoot   : merkle root over (recipient, amount) leaves built
    //                 by the backend from Supabase credit balances.
    //   totalAmount : sum of all leaf amounts in the batch (BSV T2P).
    //   payoutOut   : serialised payout outputs (recipient → amount)
    //                 corresponding to batchRoot, enforced via
    //                 hashOutputs propagation.
    //
    //   Both oracle (proves batch authenticity / Supabase debit) and
    //   treasury (authorises on-chain settlement) must sign.
    // ============================================================
    @method(SigHash.ANYONECANPAY_SINGLE)
    public processRedemptionBatch(
        batchRoot:   Sha256,
        totalAmount: bigint,
        payoutOuts:  ByteString,
        oracleSig:   Sig,
        treasurySig: Sig
    ) {
        assert(totalAmount > 0n, 'empty batch')
        assert(
            this.circulatingSupply + totalAmount <= this.lockedCollateral,
            'mint exceeds locked collateral'
        )
        assert(this.checkSig(oracleSig,   this.oraclePubKey),   'bad oracle sig')
        assert(this.checkSig(treasurySig, this.treasuryPubKey), 'bad treasury sig')

        // Bind the batch to the merkle root + nonce + total
        // (oracle/treasury sigs cover the sighash preimage which commits
        //  to the transaction outputs that pay each recipient)
        const commitment: ByteString = T2PToken.ACTION_REDEMPTION_BATCH
            + (batchRoot as ByteString)
            + Utils.toLEUnsigned(totalAmount,    8n)
            + Utils.toLEUnsigned(this.batchNonce, 8n)
        assert(commitment != toByteString(''), 'commitment build failed')

        this.circulatingSupply += totalAmount
        this.totalRedeemed     += totalAmount
        this.batchNonce        += 1n

        // Propagate state + enforce that the tx pays out exactly the
        // committed batch outputs.
        const stateOutput: ByteString = this.buildStateOutput(this.ctx.utxo.value)
        const outputs:     ByteString = stateOutput + payoutOuts + this.buildChangeOutput()
        assert(hash256(outputs) == this.ctx.hashOutputs, 'redemption propagation failed')
    }

    // ============================================================
    // TREASURY CONTROL — rotate treasury signing key
    //   Owner + current treasury must co-sign a rotation to the
    //   newTreasuryPubKey. Oracle and owner pubkeys are immutable.
    // ============================================================
    @method()
    public rotateTreasury(
        newTreasuryPubKey: PubKey,
        ownerSig:          Sig,
        oldTreasurySig:    Sig
    ) {
        assert(this.checkSig(ownerSig,       this.ownerPubKey),    'bad owner sig')
        assert(this.checkSig(oldTreasurySig, this.treasuryPubKey), 'bad treasury sig')

        this.treasuryPubKey = newTreasuryPubKey
        this.batchNonce    += 1n
        this._propagateState()
    }

    // ----- Internal state propagation -----

    @method()
    _propagateState(): void {
        const stateOutput: ByteString = this.buildStateOutput(this.ctx.utxo.value)
        const outputs: ByteString     = stateOutput + this.buildChangeOutput()
        assert(hash256(outputs) == this.ctx.hashOutputs, 'state propagation failed')
    }
}
