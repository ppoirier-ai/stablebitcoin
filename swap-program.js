const SWAP_CONFIG = window.ENV.SWAP_CONFIG;


class OtcSwapProgram {
    constructor() {
        this.program = null;
        this.connection = null;
        this.provider = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            if (!phantomWallet?.connected) {
                throw new Error('Please connect your wallet first');
            }

            // console.log("🔗 Connecting to Solana Devnet...");
            this.connection = new solanaWeb3.Connection(
                solanaWeb3.clusterApiUrl('devnet'),
                'confirmed'
            );

            this.provider = new anchor.AnchorProvider(
                this.connection,
                {
                    publicKey: phantomWallet.publicKey,
                    signTransaction: phantomWallet.signTransaction.bind(phantomWallet),
                    signAllTransactions: phantomWallet.signAllTransactions.bind(phantomWallet),
                },
                { commitment: 'confirmed' }
            );

            anchor.setProvider(this.provider);

            this.config = {
                SWAP_PROGRAM_ID: new anchor.web3.PublicKey(SWAP_CONFIG.PROGRAM_ID),
                ORACLE_PROGRAM_ID: new anchor.web3.PublicKey(SWAP_CONFIG.ORACLE_PROGRAM_ID),

                SQUAD_MULTISIG: new anchor.web3.PublicKey(SWAP_CONFIG.SQUAD_MULTISIG),

                CONFIG_SEED: SWAP_CONFIG.CONFIG_SEED,
                SBTC_MINT_AUTHORITY_SEED: SWAP_CONFIG.SBTC_MINT_AUTHORITY_SEED,
                TREASURY_AUTH_SEED: SWAP_CONFIG.TREASURY_AUTH_SEED,
                FEE_AUTH_SEED: SWAP_CONFIG.FEE_AUTH_SEED,
                ORACLE_STATE_SEED: SWAP_CONFIG.ORACLE_STATE_SEED,

                PYTH_PRICE_FEED_ADDRESS: new anchor.web3.PublicKey(SWAP_CONFIG.PYTH_PRICE_FEED_ADDRESS),

                SBTC_MINT: new anchor.web3.PublicKey(SWAP_CONFIG.SBTC_MINT),
                ZBTC_MINT: new anchor.web3.PublicKey(SWAP_CONFIG.ZBTC_MINT),

                TREASURY_ZBTC_VAULT: new anchor.web3.PublicKey(SWAP_CONFIG.TREASURY_ZBTC_VAULT),
                FEE_VAULT: new anchor.web3.PublicKey(SWAP_CONFIG.FEE_VAULT),
            };

            if (!window.otcSwapIdl) {
                throw new Error("❌ Static IDL 'window.otcSwapIdl' was not loaded");
            }

            // console.log("✅ Raw IDL loaded: ", window.otcSwapIdl);

            const programId = new anchor.web3.PublicKey(this.config.SWAP_PROGRAM_ID);
            // console.log("✅ Using Program ID:", programId.toString());

            // console.log("⏳ Initializing Anchor Program...");
            this.program = new anchor.Program(window.otcSwapIdl, this.provider);
            // console.log("✅ Anchor Program created!");

            // console.log("🔧 Deriving PDAs...");
            await this.derivePdas();

            this.isInitialized = true;
            // console.log("🎉 OTC Swap Program initialized successfully");
            return true;

        } catch (error) {
            console.error("🔥 Failed to initialize OTC Swap Program:", error);
            console.error("Debug hint: Check config SWAP_PROGRAM_ID and IDL format.");
            throw error;
        }
    }

    async derivePdas() {
        [this.configPda] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode(this.config.CONFIG_SEED),
                this.config.SQUAD_MULTISIG.toBuffer(),
            ],
            this.program.programId
        );

        [this.sbtcMintAuthorityPda] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode(this.config.SBTC_MINT_AUTHORITY_SEED),
                this.config.SQUAD_MULTISIG.toBuffer(),
            ],
            this.program.programId
        );

        [this.treasuryAuthorityPda] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode(this.config.TREASURY_AUTH_SEED),
                this.config.SQUAD_MULTISIG.toBuffer(),
            ],
            this.program.programId
        );

        [this.feeAuthorityPda] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode(this.config.FEE_AUTH_SEED),
                this.config.SQUAD_MULTISIG.toBuffer(),
            ],
            this.program.programId
        );

        [this.oracleStatePda] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode(this.config.ORACLE_STATE_SEED),
            ],
            this.config.ORACLE_PROGRAM_ID,
        )

        // console.log('PDAs derived:', {
        //     config: this.configPda.toString(),
        //     sbtcMintAuthority: this.sbtcMintAuthorityPda.toString(),
        //     treasuryAuthority: this.treasuryAuthorityPda.toString(),
        //     feeAuthority: this.feeAuthorityPda.toString(),
        //     oracleState: this.oracleStatePda.toString(),
        // });
    }

    /**
     * Get or create user token accounts (sBTC + zBTC)
     */
    async getUserTokenAccounts() {
    if (!this.isInitialized) throw new Error("Program not initialized");

    try {
        const user = phantomWallet.publicKey;

        const sbtcAta = await window.splToken.getAssociatedTokenAddress(
        this.config.SBTC_MINT, user
        );
        const zbtcAta = await window.splToken.getAssociatedTokenAddress(
        this.config.ZBTC_MINT, user
        );

        const sbtcInfo = await this.connection.getAccountInfo(sbtcAta);
        const zbtcInfo = await this.connection.getAccountInfo(zbtcAta);

        const instructions = [];

        if (!sbtcInfo) {
        instructions.push(
            window.splToken.createAssociatedTokenAccountInstruction(
            phantomWallet.publicKey, sbtcAta, user, this.config.SBTC_MINT
            )
        );
        }

        if (!zbtcInfo) {
        instructions.push(
            window.splToken.createAssociatedTokenAccountInstruction(
            phantomWallet.publicKey, zbtcAta, user, this.config.ZBTC_MINT
            )
        );
        }

        if (instructions.length > 0) {
        window.showToast("Creating your token accounts... Please approve in Phantom", "info");

        const tx = new solanaWeb3.Transaction().add(...instructions);
        tx.feePayer = phantomWallet.publicKey;
        const { blockhash } = await this.connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;

        const signedTx = await phantomWallet.signTransaction(tx);
        const sig = await this.connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: true,
        preflightCommitment: "confirmed",
        });

        await this.connection.confirmTransaction({
        signature: sig,
        blockhash,
        lastValidBlockHeight: (await this.connection.getLatestBlockhash()).lastValidBlockHeight,
        }, "confirmed");

        window.showToast("Token accounts created successfully!", "success");

        // window.ENV.DEPLOY_ENV==="mainnet-beta"? console.log(`✅ Mint submitted: https://explorer.solana.com/tx/${tx}`)
        // : console.log(`✅ ATA creation: https://explorer.solana.com/tx/${sig}?cluster=${window.ENV.DEPLOY_ENV}`);
        }

        return { sbtc: sbtcAta, zbtc: zbtcAta };

    } catch (error) {
        if (error.message?.includes("User rejected")) {
        window.showToast("Transaction rejected in Phantom", "warning");
        } else {
        window.showToast("Failed to create token accounts", "error");
        }
        console.error("❌ Error ensuring user token accounts:", error);
        throw error;
    }
    }

    /**
     * Mint SBTC by depositing zBTC
     */
    async mintSbtc(zbtcAmount) {
        if (!this.isInitialized) throw new Error("Program not initialized");

        try {
            const user = phantomWallet.publicKey;

            const userTokenAccounts = await this.getUserTokenAccounts();
            // console.log(`userSbtcAccount:${userTokenAccounts.sbtc} userzbtcAccount:${userTokenAccounts.zbtc}`);
            const treasuryVault = await this.getTreasuryVault();
            const feeVault = await this.getFeeVault();
            // console.log(`treasuryVault:${treasuryVault} feeVault:${feeVault}`);

            const tx = await this.program.methods
                .mintSbtc(new anchor.BN(zbtcAmount))
                .accounts({
                    user,
                    squadMultisig: this.config.SQUAD_MULTISIG,
                    config: this.configPda,
                    zbtcMint: this.config.ZBTC_MINT,
                    sbtcMint: this.config.SBTC_MINT,
                    userSbtcAccount: new anchor.web3.PublicKey(userTokenAccounts.sbtc),
                    userZbtcAccount: new anchor.web3.PublicKey(userTokenAccounts.zbtc),
                    treasuryZbtcVault: this.config.TREASURY_ZBTC_VAULT,
                    feeVault: this.config.FEE_VAULT,
                    sbtcMintAuthorityPda: this.sbtcMintAuthorityPda,
                    treasuryAuthorityPda: this.treasuryAuthorityPda,
                    feeAuthorityPda: this.feeAuthorityPda,
                    pythPriceAccount: new anchor.web3.PublicKey(this.config.PYTH_PRICE_FEED_ADDRESS),
                    oracleState: this.oracleStatePda,
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                })
                .rpc({
                    skipPreflight: true,            // Don't simulate before send
                    commitment: "confirmed",        // Faster confirmation
                    preflightCommitment: "confirmed"
                });

                // window.ENV.DEPLOY_ENV==="mainnet-beta"? console.log(`✅ Mint submitted: https://explorer.solana.com/tx/${tx}`)
                // : console.log(`✅ Mint submitted: https://explorer.solana.com/tx/${tx}?cluster=${window.ENV.DEPLOY_ENV}`);
                return { success: true, tx };
        } catch (error) {
            console.error("❌ Mint SBTC failed:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Burn SBTC to redeem zBTC
     */
    async burnSbtc(sbtcAmount) {
        if (!this.isInitialized) throw new Error("Program not initialized");

        try {
            const user = phantomWallet.publicKey;

            const userTokenAccounts = await this.getUserTokenAccounts();
            // console.log(`userSbtcAccount:${userTokenAccounts.sbtc} userzbtcAccount:${userTokenAccounts.zbtc}`);
            const treasuryVault = await this.getTreasuryVault();
            const feeVault = await this.getFeeVault();
            // console.log(`treasuryVault:${treasuryVault} feeVault:${feeVault}`);

            const tx = await this.program.methods
                .burnSbtc(new anchor.BN(sbtcAmount))
                .accounts({
                    user,
                    squadMultisig: this.config.SQUAD_MULTISIG,
                    config: this.configPda,
                    zbtcMint: this.config.ZBTC_MINT,
                    sbtcMint: this.config.SBTC_MINT,
                    userSbtcAccount: new anchor.web3.PublicKey(userTokenAccounts.sbtc),
                    userZbtcAccount: new anchor.web3.PublicKey(userTokenAccounts.zbtc),
                    treasuryZbtcVault: this.config.TREASURY_ZBTC_VAULT,
                    feeVault: this.config.FEE_VAULT,
                    treasuryAuthorityPda: this.treasuryAuthorityPda,
                    feeAuthorityPda: this.feeAuthorityPda,
                    pythPriceAccount: new anchor.web3.PublicKey(this.config.PYTH_PRICE_FEED_ADDRESS),
                    oracleState: this.oracleStatePda,
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                })
                .rpc({
                    skipPreflight: true,            // Don't simulate before send
                    commitment: "confirmed",        // Faster confirmation
                    preflightCommitment: "confirmed"
                });

                // window.ENV.DEPLOY_ENV==="mainnet-beta"? console.log(`✅ Mint submitted: https://explorer.solana.com/tx/${tx}`)
                // : console.log(`✅ Mint submitted: https://explorer.solana.com/tx/${tx}?cluster=${window.ENV.DEPLOY_ENV}`);
                return { success: true, tx };
        } catch (error) {
            console.error("❌ Burn SBTC failed:", error);
            return { success: false, error: error.message };
        }
    }

    async getSquadMultisig() {
        const config = await this.getConfig();
        return config.squadMultisig;
    }

    /**
     * Get treasury vault address
     */
    async getTreasuryVault() {
        const [treasuryVault] = await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode('treasury_v1'), this.config.SQUAD_MULTISIG.toBuffer()],
            this.program.programId
        );
        return treasuryVault;
    }

    /**
     * Get fee vault address
     */
    async getFeeVault() {
        const [feeVault] = await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode('fees_v1'), this.config.SQUAD_MULTISIG.toBuffer()],
            this.program.programId
        );
        return feeVault;
    }

    /**
     * Get program configuration
     */
    async getConfig() {
        if (!this.isInitialized) throw new Error('Program not initialized');

        try {
            const configAccount = await this.program.account.config.fetch(this.configPda);
            return configAccount;
        } catch (error) {
            console.error('Error fetching config:', error);
            throw error;
        }
    }

    /**
     * Get user token balances
     */
    async getUserBalances() {
        if (!this.isInitialized) throw new Error('Program not initialized');

        try {
            const userTokenAccounts = await this.getUserTokenAccounts();
            const connection = this.provider.connection;

            const [sbtcBalance, zbtcBalance] = await Promise.all([
                connection.getTokenAccountBalance(userTokenAccounts.sbtc),
                connection.getTokenAccountBalance(userTokenAccounts.zbtc)
            ]);

            // console.log(`sbtcBalance:${JSON.stringify(sbtcBalance, null, 1)}`);
            // console.log(`zbtcBalance:${JSON.stringify(zbtcBalance, null, 1)}`);

            return {
                sbtc: sbtcBalance.value.uiAmount || 0,
                zbtc: zbtcBalance.value.uiAmount || 0
            };
        } catch (error) {
            console.error('Error getting user balances:', error);
            return { sbtc: 0, zbtc: 0 };
        }
    }
}

const otcSwapProgram = new OtcSwapProgram();
window.otcSwapProgram = otcSwapProgram;
