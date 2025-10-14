/**
 * OTC Swap Program Integration
 * Handles interactions with the Anchor program
 */

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

            console.log("🔗 Connecting to Solana Devnet...");
            this.connection = new solanaWeb3.Connection(
                solanaWeb3.clusterApiUrl('devnet'),
                'confirmed'
            );

            // ✅ Correct provider wallet object for Anchor
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

            // Program Configuration
            this.config = {
                SWAP_PROGRAM_ID: new anchor.web3.PublicKey("DBHmndyfN4j7BtQsLaCR1SPd7iAXaf1ezUicDs3pUXS8"),
                ORACLE_PROGRAM_ID: new anchor.web3.PublicKey("8UDq3zAd8RqqkVVpCS8bRbRuWUQyDD6ioVVmtYtUCy6y"),

                SQUAD_MULTISIG: new anchor.web3.PublicKey("5eWBQxV7BZSVA4FqDfxQEZRFr67LZkCy9JNkoX2Q4Q5b"),

                CONFIG_SEED: "config_v1",
                SBTC_MINT_AUTHORITY_SEED: "sbtc_mint_authority",
                TREASURY_AUTH_SEED: "treasury_auth_v1",
                FEE_AUTH_SEED: "fee_auth_v1",
                ORACLE_STATE_SEED: "oracle",

                PYTH_BTC_USD_FEED: new anchor.web3.PublicKey("HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J"),

                SBTC_MINT: new anchor.web3.PublicKey("7dMm9RgrkknPkrp7n1sgkbJFPkG5pAZzEs32NcyjeDkW"),
                ZBTC_MINT: new anchor.web3.PublicKey("91AgzqSfXnCq6AJm5CPPHL3paB25difEJ1TfSnrFKrf"),

                TREASURY_ZBTC_VAULT: new anchor.web3.PublicKey("FkECS4C9g9xHDCSacUf1cpZ3MEvquxuD9yb9Ao4asES8"),
                FEE_VAULT: new anchor.web3.PublicKey("DauXPgtQevwJxavMpzH5Zkx3sH7BDuwrZBP5BsYskqgV"),
            };

            if (!window.otcSwapIdl) {
                throw new Error("❌ Static IDL 'window.otcSwapIdl' was not loaded");
            }

            console.log("✅ Raw IDL loaded: ", window.otcSwapIdl);

            // ✅ Program ID
            const programId = new anchor.web3.PublicKey(this.config.SWAP_PROGRAM_ID);
            console.log("✅ Using Program ID:", programId.toString());

            // ---- 🚀 Create Program safely ----
            console.log("⏳ Initializing Anchor Program...");
            this.program = new anchor.Program(window.otcSwapIdl, this.provider);
            console.log("✅ Anchor Program created!");

            // Derive PDAs
            console.log("🔧 Deriving PDAs...");
            await this.derivePdas();

            this.isInitialized = true;
            console.log("🎉 OTC Swap Program initialized successfully");
            return true;

        } catch (error) {
            console.error("🔥 Failed to initialize OTC Swap Program:", error);
            console.error("Debug hint: Check config SWAP_PROGRAM_ID and IDL format.");
            throw error;
        }
    }

    /**
     * Derive all necessary PDAs
     */
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

        console.log('PDAs derived:', {
            config: this.configPda.toString(),
            sbtcMintAuthority: this.sbtcMintAuthorityPda.toString(),
            treasuryAuthority: this.treasuryAuthorityPda.toString(),
            feeAuthority: this.feeAuthorityPda.toString(),
            oracleState: this.oracleStatePda.toString(),
        });
    }

    /**
     * Get token accounts for a user
     */
    async getUserTokenAccounts() {
        if (!this.isInitialized) throw new Error('Program not initialized');

        try {
            const user = phantomWallet.publicKey;

            const sbtcTokenAccount = await anchor.utils.token.associatedAddress({
                mint: this.config.SBTC_MINT,
                owner: user,
            });

            const zbtcTokenAccount = await anchor.utils.token.associatedAddress({
                mint: this.config.ZBTC_MINT,
                owner: user,
            });

            return {
                sbtc: sbtcTokenAccount,
                zbtc: zbtcTokenAccount
            };
        } catch (error) {
            console.error('Error getting user token accounts:', error);
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
            console.log(`userSbtcAccount:${userTokenAccounts.sbtc} userzbtcAccount:${userTokenAccounts.zbtc}`);
            const treasuryVault = await this.getTreasuryVault();
            const feeVault = await this.getFeeVault();
            console.log(`treasuryVault:${treasuryVault} feeVault:${feeVault}`);

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
                    pythPriceAccount: new anchor.web3.PublicKey(this.config.PYTH_BTC_USD_FEED),
                    oracleState: this.oracleStatePda,
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                })
                .rpc({
                    skipPreflight: true,            // Don't simulate before send
                    commitment: "confirmed",        // Faster confirmation
                    preflightCommitment: "confirmed"
                });

                console.log(`✅ Mint submitted: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
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
            console.log(`userSbtcAccount:${userTokenAccounts.sbtc} userzbtcAccount:${userTokenAccounts.zbtc}`);
            const treasuryVault = await this.getTreasuryVault();
            const feeVault = await this.getFeeVault();
            console.log(`treasuryVault:${treasuryVault} feeVault:${feeVault}`);

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
                    pythPriceAccount: new anchor.web3.PublicKey(this.config.PYTH_BTC_USD_FEED),
                    oracleState: this.oracleStatePda,
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                })
                .rpc({
                    skipPreflight: true,            // Don't simulate before send
                    commitment: "confirmed",        // Faster confirmation
                    preflightCommitment: "confirmed"
                });

                console.log(`✅ Mint submitted: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
                return { success: true, tx };
        } catch (error) {
            console.error("❌ Burn SBTC failed:", error);
            return { success: false, error: error.message };
        }
    }

    async getSquadMultisig() {
        const config = await this.getConfig();
        return config.squadMultisig; // PublicKey from account
    }

    /**
     * Get treasury vault address
     */
    async getTreasuryVault() {
        // This should match how you create the treasury vault in initialize
        const [treasuryVault] = await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode('treasury_v1'), new anchor.web3.PublicKey("5eWBQxV7BZSVA4FqDfxQEZRFr67LZkCy9JNkoX2Q4Q5b").toBuffer()],
            this.program.programId
        );
        return treasuryVault;
    }

    /**
     * Get fee vault address
     */
    async getFeeVault() {
        const [feeVault] = await anchor.web3.PublicKey.findProgramAddress(
            [anchor.utils.bytes.utf8.encode('fees_v1'), new anchor.web3.PublicKey("5eWBQxV7BZSVA4FqDfxQEZRFr67LZkCy9JNkoX2Q4Q5b").toBuffer()],
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

            console.log(`sbtcBalance:${JSON.stringify(sbtcBalance, null, 1)}`);
            console.log(`zbtcBalance:${JSON.stringify(zbtcBalance, null, 1)}`);

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

// Create singleton instance
const otcSwapProgram = new OtcSwapProgram();

// Make available globally
window.otcSwapProgram = otcSwapProgram;
