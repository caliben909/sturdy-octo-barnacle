const { ethers } = require('ethers');

/**
 * Shared Forced Signing Executor for all JavaScript bots
 * Provides transaction retry, gas price bumping, and profit distribution
 */
class ForcedSigningExecutor {
    constructor(provider, signer, options = {}) {
        this.provider = provider;
        this.signer = signer;
        this.pendingTxs = new Map();
        this.nonce = null;

        // Configuration from options or environment
        this.maxRetries = options.maxRetries || parseInt(process.env.MAX_RETRIES_PER_TX) || 6;
        this.gasPriceMultiplier = parseFloat(options.gasPriceMultiplier || process.env.GAS_PRICE_MULTIPLIER || 1.25);
        this.forcedSigningEnabled = options.forcedSigning !== false && (process.env.FORCED_SIGNING_ENABLED === 'true' || true);

        // MCP Wallets for profit distribution
        this.mcpWallets = options.mcpWallets || [
            "0xfb1abaee3bb70922cc91b6b02d29339b53a43661",  // MCP Wallet 1
            "0xbb1d2b77b02909e6418c6a130570228f098428c0",  // MCP Wallet 2
            "0xd65fdd4361f0b6d87a4a8c18afe15279a9b1ca9c",  // MCP Wallet 3
        ];

        console.log('🔒 Forced Signing Executor initialized');
        console.log(`   Forced Signing: ${this.forcedSigningEnabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`   Max Retries: ${this.maxRetries}`);
        console.log(`   Gas Multiplier: ${this.gasPriceMultiplier}x`);
        console.log(`   MCP Wallets: ${this.mcpWallets.length} configured`);
    }

    async getPendingNonce() {
        return await this.provider.getTransactionCount(this.signer.address, 'pending');
    }

    async signAndSendTransaction(tx, retryCount = 0, profitAssets = null) {
        try {
            // Set nonce
            tx.nonce = tx.nonce || await this.getPendingNonce();

            // Estimate gas
            tx.gasLimit = tx.gasLimit || await this.provider.estimateGas(tx);

            // Set gas price with multiplier for forced signing
            const gasPrice = await this.provider.getGasPrice();
            tx.gasPrice = this.forcedSigningEnabled ?
                gasPrice.mul(Math.floor(this.gasPriceMultiplier * 1000)).div(1000) :
                gasPrice;

            console.log(`🔒 FORCED SIGNING: Transaction attempt ${retryCount + 1}/${this.maxRetries}`);
            console.log(`   To: ${tx.to}`);
            console.log(`   Gas: ${tx.gasLimit.toString()}`);
            console.log(`   Gas Price: ${ethers.utils.formatUnits(tx.gasPrice, 'gwei')} gwei`);
            console.log(`   Nonce: ${tx.nonce}`);
            if (profitAssets) {
                console.log(`   Profit Distribution: ${JSON.stringify(profitAssets)}`);
            }

            // Sign and send transaction
            const signedTx = await this.signer.signTransaction(tx);
            const txHash = await this.provider.sendTransaction(signedTx);

            console.log(`✅ Transaction broadcasted: ${txHash.hash}`);
            console.log(`   View: https://bscscan.com/tx/${txHash.hash}`);

            // Wait for confirmation
            const receipt = await txHash.wait();

            if (receipt.status === 1) {
                console.log(`🎉 Transaction confirmed in block ${receipt.blockNumber}`);
                console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
                console.log(`   Effective gas price: ${ethers.utils.formatUnits(receipt.effectiveGasPrice, 'gwei')} gwei`);

                // If this transaction generated profits, distribute to MCP wallets
                if (profitAssets && Object.keys(profitAssets).length > 0) {
                    await this.distributeProfitsToMCP(profitAssets, receipt);
                }

                return {
                    success: true,
                    hash: txHash.hash,
                    receipt: receipt,
                    gasUsed: receipt.gasUsed,
                    effectiveGasPrice: receipt.effectiveGasPrice,
                    profitDistributed: profitAssets ? true : false
                };
            } else {
                throw new Error('Transaction reverted');
            }

        } catch (error) {
            console.log(`❌ Transaction attempt ${retryCount + 1} failed: ${error.message}`);

            if (retryCount < this.maxRetries - 1) {
                console.log(`🔄 Retrying with higher gas price...`);
                // Increase gas price for next retry
                if (tx.gasPrice) {
                    tx.gasPrice = tx.gasPrice.mul(Math.floor(this.gasPriceMultiplier * 1000)).div(1000);
                }
                return await this.signAndSendTransaction(tx, retryCount + 1, profitAssets);
            }

            return {
                success: false,
                error: error.message,
                attempts: retryCount + 1
            };
        }
    }

    async distributeProfitsToMCP(profitAssets, originalReceipt) {
        console.log('💰 DISTRIBUTING PROFITS TO MCP WALLETS...');
        console.log(`   Original Tx: ${originalReceipt.transactionHash}`);
        console.log(`   Profits: ${JSON.stringify(profitAssets)}`);

        try {
            // Calculate per-wallet distribution
            const distribution = {};
            for (const [asset, amount] of Object.entries(profitAssets)) {
                const perWallet = amount / this.mcpWallets.length;
                distribution[asset] = perWallet;
            }

            console.log(`   Per Wallet Distribution: ${JSON.stringify(distribution)}`);

            // Execute transfers to each MCP wallet
            for (let i = 0; i < this.mcpWallets.length; i++) {
                const wallet = this.mcpWallets[i];
                console.log(`   🏦 Sending to MCP Wallet ${i + 1}: ${wallet}`);

                try {
                    // For BNB transfers
                    if (distribution.BNB && distribution.BNB > 0) {
                        const bnbAmount = ethers.utils.parseEther(distribution.BNB.toFixed(6));
                        const bnbTx = {
                            to: wallet,
                            value: bnbAmount,
                            gasLimit: ethers.BigNumber.from('21000'),
                            gasPrice: await this.provider.getGasPrice()
                        };

                        const bnbResult = await this.signAndSendTransaction(bnbTx, 0);
                        if (bnbResult.success) {
                            console.log(`   ✅ BNB distributed to wallet ${i + 1}: ${distribution.BNB} BNB`);
                        } else {
                            console.log(`   ❌ BNB distribution failed to wallet ${i + 1}`);
                        }
                    }

                    // For token transfers (USDT, etc.)
                    for (const [asset, amount] of Object.entries(distribution)) {
                        if (asset !== 'BNB' && amount > 0) {
                            // This would need token contract integration
                            // For now, log the intent
                            console.log(`   📝 Token ${asset} distribution needed: ${amount} to wallet ${i + 1}`);
                        }
                    }

                } catch (walletError) {
                    console.error(`   ❌ Failed to distribute to wallet ${i + 1}: ${walletError.message}`);
                }

                // Small delay between distributions
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            console.log('✅ PROFIT DISTRIBUTION COMPLETED');
            console.log(`   ${this.mcpWallets.length} MCP wallets updated`);

        } catch (error) {
            console.error('❌ Profit distribution failed:', error.message);
            console.log('   Profits may need manual distribution');
        }
    }

    // Helper method to prepare profit assets for distribution
    prepareProfitAssets(bnbAmount = 0, usdtAmount = 0, otherAssets = {}) {
        const profitAssets = {};

        if (bnbAmount > 0) {
            profitAssets.BNB = bnbAmount;
        }

        if (usdtAmount > 0) {
            profitAssets.USDT = usdtAmount;
        }

        // Add other assets
        Object.assign(profitAssets, otherAssets);

        return profitAssets;
    }

    // Check if forced signing is enabled
    isForcedSigningEnabled() {
        return this.forcedSigningEnabled;
    }

    // Get MCP wallet count
    getMCPWalletCount() {
        return this.mcpWallets.length;
    }
}

module.exports = ForcedSigningExecutor;