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
        
        // Program Configuration
        this.config = {
            PROGRAM_ID: 'DBHmndyfN4j7BtQsLaCR1SPd7iAXaf1ezUicDs3pUXS8',

            // PDA addresses (these should match your program)
            CONFIG_SEED: 'config_v1',
            SBTC_MINT_AUTHORITY_SEED: 'sbtc_mint_authority',
            TREASURY_AUTH_SEED: 'treasury_auth_v1',
            FEE_AUTH_SEED: 'fee_auth_v1',

            // Oracle addresses
            PYTH_BTC_USD_FEED: 'HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J',

            // Token mints (you'll need to set these)
            SBTC_MINT: '7dMm9RgrkknPkrp7n1sgkbJFPkG5pAZzEs32NcyjeDkW', // Set after deployment
            ZBTC_MINT: '91AgzqSfXnCq6AJm5CPPHL3paB25difEJ1TfSnrFKrf', // Set after deployment

            ORACLE_STATE_ACCOUNT: 'n6vZ3Uczer7nG5MLMed9CdYZajeFhzKHRCQyuAcuhuK',
        };
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

            if (!window.otcSwapIdl) {
                throw new Error("❌ Static IDL 'window.otcSwapIdl' was not loaded");
            }

            console.log("✅ Raw IDL loaded: ", window.otcSwapIdl);

            // ✅ Program ID
            const programId = new anchor.web3.PublicKey(this.config.PROGRAM_ID);
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
            console.error("Debug hint: Check config PROGRAM_ID and IDL format.");
            throw error;
        }
    }

    /**
     * Derive all necessary PDAs
     */
    async derivePdas() {
        const adminPublicKey = phantomWallet.publicKey; // Using connected wallet as admin for now

        // Config PDA
        [this.configPda] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode(this.config.CONFIG_SEED),
                adminPublicKey.toBuffer()
            ],
            this.program.programId
        );

        // SBTC Mint Authority PDA
        [this.sbtcMintAuthorityPda] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode(this.config.SBTC_MINT_AUTHORITY_SEED),
                adminPublicKey.toBuffer()
            ],
            this.program.programId
        );

        // Treasury Authority PDA
        [this.treasuryAuthorityPda] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode(this.config.TREASURY_AUTH_SEED),
                adminPublicKey.toBuffer()
            ],
            this.program.programId
        );

        // Fee Authority PDA
        [this.feeAuthorityPda] = await anchor.web3.PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode(this.config.FEE_AUTH_SEED),
                adminPublicKey.toBuffer()
            ],
            this.program.programId
        );

        console.log('PDAs derived:', {
            config: this.configPda.toString(),
            sbtcMintAuthority: this.sbtcMintAuthorityPda.toString(),
            treasuryAuthority: this.treasuryAuthorityPda.toString(),
            feeAuthority: this.feeAuthorityPda.toString()
        });
    }

    /**
     * Get token accounts for a user
     */
    async getUserTokenAccounts() {
        if (!this.isInitialized) throw new Error('Program not initialized');

        try {
            const user = phantomWallet.publicKey;

            const sbtcMint = new anchor.web3.PublicKey(this.config.SBTC_MINT);
            const zbtcMint = new anchor.web3.PublicKey(this.config.ZBTC_MINT);

            // ✅ Associated Token Account addresses derived correctly
            const sbtcTokenAccount = await anchor.utils.token.associatedAddress({
                mint: sbtcMint,
                owner: user
            });

            const zbtcTokenAccount = await anchor.utils.token.associatedAddress({
                mint: zbtcMint,
                owner: user
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

        const sbtcMint = new anchor.web3.PublicKey(this.config.SBTC_MINT);
        const zbtcMint = new anchor.web3.PublicKey(this.config.ZBTC_MINT);

        // ✅ Fetch correct squadMultisig from on-chain config
        // let squadMultisig = await this.getSquadMultisig();
        // if (typeof squadMultisig==="string") {
        //     squadMultisig = new anchor.web3.PublicKey(squadMultisig);
        // }
        let squadMultisig = new anchor.web3.PublicKey("5eWBQxV7BZSVA4FqDfxQEZRFr67LZkCy9JNkoX2Q4Q5b");

        const userTokenAccounts = await this.getUserTokenAccounts();
        console.log(`userSbtcAccount:${userTokenAccounts.sbtc} userzbtcAccount:${userTokenAccounts.zbtc}`);
        const treasuryVault = await this.getTreasuryVault();
        const feeVault = await this.getFeeVault();
        console.log(`treasuryVault:${treasuryVault} feeVault:${feeVault}`);
        const oracleStatePda = new anchor.web3.PublicKey(this.config.ORACLE_STATE_ACCOUNT);

        const tx = await this.program.methods
            .mintSbtc(new anchor.BN(zbtcAmount))
            .accounts({
                user,
                squadMultisig,
                config: new anchor.web3.PublicKey("M8uCStPutLUYbpP1hbC4SQBLza29jZQECX4DbYwSPUj"), //this.configPda,
                zbtcMint: new anchor.web3.PublicKey("91AgzqSfXnCq6AJm5CPPHL3paB25difEJ1TfSnrFKrf"),
                sbtcMint: new anchor.web3.PublicKey("7dMm9RgrkknPkrp7n1sgkbJFPkG5pAZzEs32NcyjeDkW"),
                userSbtcAccount: new anchor.web3.PublicKey(userTokenAccounts.sbtc),
                userZbtcAccount: new anchor.web3.PublicKey(userTokenAccounts.zbtc),
                treasuryZbtcVault: new anchor.web3.PublicKey("FkECS4C9g9xHDCSacUf1cpZ3MEvquxuD9yb9Ao4asES8"),
                feeVault: new anchor.web3.PublicKey("DauXPgtQevwJxavMpzH5Zkx3sH7BDuwrZBP5BsYskqgV"),
                sbtcMintAuthorityPda: new anchor.web3.PublicKey("5RJzxKweQkKxJd5hVYt1jKgddH69nQLhwJZbE2iRibLQ"),
                treasuryAuthorityPda: new anchor.web3.PublicKey("AZBRUWrYkVeyRXwQFMyDhDt92nPuiCQFy45pTNb8xzbj"),
                feeAuthorityPda: new anchor.web3.PublicKey("GgHQN7jKvB2AVK3tm3RqSf1Ch7B1sr6WfjDue9KGzisx"),
                pythPriceAccount: new anchor.web3.PublicKey(this.config.PYTH_BTC_USD_FEED),
                oracleState: new anchor.web3.PublicKey("n6vZ3Uczer7nG5MLMed9CdYZajeFhzKHRCQyuAcuhuK"),
                tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
            })
            .rpc();

        console.log("✅ Mint transaction:", tx);
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
            const sbtcMint = new anchor.web3.PublicKey(this.config.SBTC_MINT);
            const zbtcMint = new anchor.web3.PublicKey(this.config.ZBTC_MINT);
            let squadMultisig = new anchor.web3.PublicKey("5eWBQxV7BZSVA4FqDfxQEZRFr67LZkCy9JNkoX2Q4Q5b");

            // await this.ensureAtaExists(zbtcMint, user);
            // await this.ensureAtaExists(sbtcMint, user);

            const userTokenAccounts = await this.getUserTokenAccounts();
            const treasuryVault = await this.getTreasuryVault();
            const feeVault = await this.getFeeVault();
            const oracleStatePda = new anchor.web3.PublicKey(this.config.ORACLE_STATE_ACCOUNT);

            const tx = await this.program.methods
                .burnSbtc(new anchor.BN(sbtcAmount))
                .accounts({
                    user,
                    squadMultisig,
                    config: new anchor.web3.PublicKey("M8uCStPutLUYbpP1hbC4SQBLza29jZQECX4DbYwSPUj"),
                    zbtcMint: new anchor.web3.PublicKey("91AgzqSfXnCq6AJm5CPPHL3paB25difEJ1TfSnrFKrf"),
                    sbtcMint: new anchor.web3.PublicKey("7dMm9RgrkknPkrp7n1sgkbJFPkG5pAZzEs32NcyjeDkW"),
                    userSbtcAccount: new anchor.web3.PublicKey(userTokenAccounts.sbtc),
                    userZbtcAccount: new anchor.web3.PublicKey(userTokenAccounts.zbtc),
                    treasuryZbtcVault: new anchor.web3.PublicKey("FkECS4C9g9xHDCSacUf1cpZ3MEvquxuD9yb9Ao4asES8"),
                    feeVault: new anchor.web3.PublicKey("DauXPgtQevwJxavMpzH5Zkx3sH7BDuwrZBP5BsYskqgV"),
                    treasuryAuthorityPda: new anchor.web3.PublicKey("AZBRUWrYkVeyRXwQFMyDhDt92nPuiCQFy45pTNb8xzbj"),
                    feeAuthorityPda: new anchor.web3.PublicKey("GgHQN7jKvB2AVK3tm3RqSf1Ch7B1sr6WfjDue9KGzisx"),
                    pythPriceAccount: new anchor.web3.PublicKey(this.config.PYTH_BTC_USD_FEED),
                    oracleState: new anchor.web3.PublicKey("n6vZ3Uczer7nG5MLMed9CdYZajeFhzKHRCQyuAcuhuK"),
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                })
                .rpc();

            console.log("✅ Burn transaction:", tx);
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
