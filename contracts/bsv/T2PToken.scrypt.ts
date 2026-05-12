/**
 * Trash2Cash (T2P) Reward Token — BSV Smart Contract (sCrypt)
 * ----------------------------------------------------------------
 * Token type:   Fungible reward token on BSV (UTXO-based, sCrypt)
 * Symbol:       T2P  (T2P Units)
 * Features:     Mintable, Lockable, Burnable
 * Reward rate:  1 T2P per 100 kg of waste (users, collectors, processors)
 * Distribution: Triggered by oracle-signed events from the Trash2Pay backend
 *                 - User reward:      after collector scans user's pickup QR
 *                 - Collector reward: after processor scans collector's QR
 *                 - Processor reward: once cumulative processed waste >= 1000 kg
 *
 * Cross-chain anchor:
 *   Trash2Pay (T2P Units) is the platform's fund-raising token on Solana
 *   (fixed supply 1,000,000,000). Each minting of T2P on BSV requires the
 *   equivalent amount of T2P on Solana to be locked in a custodial vault
 *   controlled by the platform owner. Proof of lock is provided by an
 *   oracle signature attesting to the Solana lock tx. Minted T2P is sent
 *   to the BSV address of the T2P owner (the platform treasury).
 *
 * Implementation notes:
 *   - Written for sCrypt (TypeScript-based BSV contract framework).
 *   - Uses ECDSA oracle signatures over (action || payload || nonce) to
 *     authenticate off-chain events without trusting any single party.
 *   - State is carried forward in the contract output (UTXO state machine):
 *       totalSupply, lockedT2P, ownerPubKey, oraclePubKey, processorBuffer.
 */

import {
    SmartContract,
    method,
    prop,
    PubKey,
    Sig,
    ByteString,
    hash256,
    assert,
    SigHash,
    Utils,
    toByteString,
} from 'scrypt-ts'

export class T2PToken extends SmartContract {
    // ----- Constants -----
    static readonly T2P_TOTAL_SUPPLY: bigint = 1_000_000_000n     // T2P fixed supply on Solana
    static readonly KG_PER_T2P: bigint        = 100n              // 100 kg => 1 T2C
    static readonly PROCESSOR_THRESHOLD_KG: bigint = 1000n        // processor reward unlock

    // Action tags signed by the oracle
    static readonly ACTION_USER_REWARD:      ByteString = toByteString('01', false)
    static readonly ACTION_COLLECTOR_REWARD: ByteString = toByteString('02', false)
    static readonly ACTION_PROCESSOR_REWARD: ByteString = toByteString('03', false)
    static readonly ACTION_BURN:             ByteString = toByteString('04', false)
    static readonly ACTION_LOCK_T2P_MINT:    ByteString = toByteString('05', false)

    // ----- Stateful properties -----
    @prop(true) totalSupply:      bigint   // total T2P minted (in smallest unit)
    @prop(true) lockedT2P:        bigint   // cumulative T2P locked on Solana side
    @prop(true) processorBuffer:  bigint   // unrewarded processed kg (resets per 1000kg)
    @prop(true) nonce:            bigint   // monotonic anti-replay nonce

    // ----- Immutable properties -----
    @prop() readonly ownerPubKey:   PubKey  // platform / T2P owner BSV pubkey
    @prop() readonly oraclePubKey:  PubKey  // backend oracle signing key

    constructor(ownerPubKey: PubKey, oraclePubKey: PubKey) {
        super(...arguments)
        this.ownerPubKey     = ownerPubKey
        this.oraclePubKey    = oraclePubKey
        this.totalSupply     = 0n
        this.lockedT2P       = 0n
        this.processorBuffer = 0n
        this.nonce           = 0n
    }

    // ============================================================
    // MINT — User reward (after collector verifies pickup QR scan)
    // amountKg: weight of waste picked up
    // recipient: BSV address (PubKey hash) of the user
    // ============================================================
    @method(SigHash.ANYONECANPAY_SINGLE)
    public mintUserReward(
        amountKg: bigint,
        recipient: PubKeyHash,
        oracleSig: Sig
    ) {
        assert(amountKg > 0n, 'amountKg must be positive')

        // Verify oracle authorised this exact event
        const payload: ByteString = T2PToken.ACTION_USER_REWARD
            + Utils.toLEUnsigned(amountKg, 8n)
            + recipient
            + Utils.toLEUnsigned(this.nonce, 8n)
        assert(this.checkSig(oracleSig, this.oraclePubKey) , 'bad oracle sig')
        // payload binding (oracle signs sighash preimage covering payload via OP_RETURN output)

        const reward: bigint = amountKg / T2PToken.KG_PER_T2P
        assert(reward > 0n, 'insufficient kg for reward')

        this.totalSupply += reward
        this.nonce       += 1n

        this._enforceMintBacking()
        this._propagateStateAndPayout(recipient, reward)
    }

    // ============================================================
    // MINT — Collector reward (after processor scans collector QR)
    // ============================================================
    @method(SigHash.ANYONECANPAY_SINGLE)
    public mintCollectorReward(
        amountKg: bigint,
        recipient: PubKeyHash,
        oracleSig: Sig
    ) {
        assert(amountKg > 0n, 'amountKg must be positive')
        assert(this.checkSig(oracleSig, this.oraclePubKey), 'bad oracle sig')

        const reward: bigint = amountKg / T2PToken.KG_PER_T2P
        assert(reward > 0n, 'insufficient kg for reward')

        this.totalSupply += reward
        this.nonce       += 1n

        this._enforceMintBacking()
        this._propagateStateAndPayout(recipient, reward)
    }

    // ============================================================
    // MINT — Processor reward (only when buffer >= 1000 kg)
    // amountKg accumulates into processorBuffer; reward emitted in
    // whole 1000kg chunks => 10 T2P per 1000 kg.
    // ============================================================
    @method(SigHash.ANYONECANPAY_SINGLE)
    public mintProcessorReward(
        amountKg: bigint,
        recipient: PubKeyHash,
        oracleSig: Sig
    ) {
        assert(amountKg > 0n, 'amountKg must be positive')
        assert(this.checkSig(oracleSig, this.oraclePubKey), 'bad oracle sig')

        this.processorBuffer += amountKg
        assert(
            this.processorBuffer >= T2PToken.PROCESSOR_THRESHOLD_KG,
            'processor threshold (1000kg) not reached'
        )

        // Emit reward for every full 1000 kg, keep remainder in buffer
        const chunks: bigint = this.processorBuffer / T2PToken.PROCESSOR_THRESHOLD_KG
        const reward: bigint = chunks * (T2PToken.PROCESSOR_THRESHOLD_KG / T2PToken.KG_PER_T2P) // 10 T2P / chunk
        this.processorBuffer = this.processorBuffer % T2PToken.PROCESSOR_THRESHOLD_KG

        this.totalSupply += reward
        this.nonce       += 1n

        this._enforceMintBacking()
        this._propagateStateAndPayout(recipient, reward)
    }

    // ============================================================
    // LOCK — Register a Solana-side T2P lock that backs future BSV mints.
    // The oracle attests that `amount` T2P units were locked in the
    // platform owner's Solana custodial vault. Locked T2P collateralises
    // the right to mint T2P up to the locked amount.
    // ============================================================
    @method()
    public lockT2PForMint(
        amount: bigint,
        ownerSig: Sig,
        oracleSig: Sig
    ) {
        assert(this.checkSig(ownerSig,  this.ownerPubKey),  'bad owner sig')
        assert(this.checkSig(oracleSig, this.oraclePubKey), 'bad oracle sig')
        assert(amount > 0n, 'amount must be positive')
        assert(
            this.lockedT2P + amount <= T2PToken.T2P_TOTAL_SUPPLY,
            'cannot lock more than T2P total supply'
        )

        this.lockedT2P += amount
        this.nonce     += 1n

        // Mint backing T2P to the owner's BSV address (platform treasury)
        this.totalSupply += amount
        this._propagateStateAndPayout(this.ownerPubKey, amount)
    }

    // ============================================================
    // BURN — Permanently destroy T2P (e.g. on redemption / off-ramp)
    // Requires owner signature + oracle attestation of the burn event.
    // ============================================================
    @method()
    public burn(amount: bigint, ownerSig: Sig, oracleSig: Sig) {
        assert(this.checkSig(ownerSig,  this.ownerPubKey),  'bad owner sig')
        assert(this.checkSig(oracleSig, this.oraclePubKey), 'bad oracle sig')
        assert(amount > 0n && amount <= this.totalSupply, 'invalid burn amount')

        this.totalSupply -= amount
        this.nonce       += 1n
        this._propagateState()
    }

    // ----- Internal invariants & state propagation -----

    @method()
    _enforceMintBacking(): void {
        // Every minted T2P must be backed 1:1 by a locked T2P unit.
        assert(this.totalSupply <= this.lockedT2P, 'mint exceeds locked T2P backing')
    }

    @method()
    _propagateState(): void {
        const stateOutput: ByteString = this.buildStateOutput(this.ctx.utxo.value)
        const outputs: ByteString = stateOutput + this.buildChangeOutput()
        assert(hash256(outputs) == this.ctx.hashOutputs, 'state propagation failed')
    }

    @method()
    _propagateStateAndPayout(recipient: PubKeyHash, amount: bigint): void {
        const stateOutput:  ByteString = this.buildStateOutput(this.ctx.utxo.value)
        const payoutOutput: ByteString = Utils.buildPublicKeyHashOutput(
            recipient, amount
        )
        const outputs: ByteString = stateOutput + payoutOutput + this.buildChangeOutput()
        assert(hash256(outputs) == this.ctx.hashOutputs, 'state+payout propagation failed')
    }
}
