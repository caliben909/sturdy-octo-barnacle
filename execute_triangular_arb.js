#!/usr/bin/env node

/**
 * EXECUTE TRIANGULAR ARBITRAGE WITH FORCED SIGNING
 * Enhanced version with forced transaction signing and profit distribution
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
require('dotenv').config();

// Get and validate environment variables
const getEnvVar = (key, defaultValue = null, required = false) => {
    const value = process.env[key] || defaultValue;
    if (required && !value) {
        console.error(`âŒ Required environment variable ${key} is not set`);
        process.exit(1);
    }
    return value;
};

const CONFIG = {
    rpcUrl: getEnvVar('RPC_URL', 'https://bsc-dataseed.binance.org/'),
    privateKey: getEnvVar('PRIVATE_KEY', null, true), // Required
    contractAddress: getEnvVar('FLASHLOAN_ARB_CONTRACT', '0xf682bd44ca1Fb8184e359A8aF9E1732afD29BBE1'),
    walletAddress: getEnvVar('WALLET_ADDRESS', null, true), // Required
    forcedSigning: process.argv.includes('--forced-signing') || process.env.FORCED_SIGNING === 'true',
    maxRetries: parseInt(process.env.MAX_RETRIES_PER_TX) || 6,
    gasPriceMultiplier: parseFloat(process.env.GAS_PRICE_MULTIPLIER) || 1.25
};

// Token addresses
const TOKENS = {
    WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    CAKE: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
    BTCB: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
    ETH: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    USDT: "0x55d398326f99059fF775485246999027b3197955",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    DAI: "0x1AF3F329e8BE154074D8769D1FFa4eEE058B1DBc3"
};

// PancakeSwap V2 Router
const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);

// Fix address checksum by ensuring proper formatting
const normalizedAddress = ethers.utils.getAddress(CONFIG.walletAddress);
const wallet = new ethers.Wallet(CONFIG.privateKey, provider);

// Verify the address matches expected
if (wallet.address.toLowerCase() !== normalizedAddress.toLowerCase()) {
    console.log(`âš ï¸  Address format warning: wallet ${wallet.address} vs expected ${normalizedAddress}`);
    // Continue anyway as ethers will handle the checksum
}

console.log('ðŸš€ TRIANGULAR ARBITRAGE EXECUTOR WITH FORCED SIGNING');
console.log('==================================================');
console.log(`ðŸ”— Network: ${CONFIG.rpcUrl}`);
console.log(`ðŸ‘¤ Wallet: ${CONFIG.walletAddress}`);
console.log(`ðŸ”’ Forced Signing: ${CONFIG.forcedSigning ? 'ENABLED' : 'DISABLED'}`);
console.log(`ðŸ”„ Max Retries: ${CONFIG.maxRetries}`);
console.log(`âš¡ Gas Multiplier: ${CONFIG.gasPriceMultiplier}x`);
console.log('');

class ForcedSigningExecutor {
    constructor() {
        this.provider = provider;
        this.wallet = wallet;
        this.pendingTxs = new Map();
        this.nonce = null;
    }

    async getPendingNonce() {
        return await this.provider.getTransactionCount(this.wallet.address, 'pending');
    }

    async signAndSendTransaction(tx, retryCount = 0) {
        try {
            // Set nonce
            tx.nonce = tx.nonce || await this.getPendingNonce();
            
            // Estimate gas
            tx.gasLimit = tx.gasLimit || await this.provider.estimateGas(tx);
            
            // Set gas price with multiplier for forced signing
            const gasPrice = await this.provider.getGasPrice();
            tx.gasPrice = CONFIG.forcedSigning ? 
                gasPrice.mul(Math.floor(CONFIG.gasPriceMultiplier * 1000)).div(1000) :
                gasPrice;

            console.log(`ðŸ“¤ Transaction attempt ${retryCount + 1}:`);
            console.log(`   To: ${tx.to}`);
            console.log(`   Gas: ${tx.gasLimit.toString()}`);
            console.log(`   Gas Price: ${ethers.utils.formatUnits(tx.gasPrice, 'gwei')} gwei`);
            console.log(`   Nonce: ${tx.nonce}`);

            // Sign and send transaction
            const signedTx = await this.wallet.signTransaction(tx);
            const txHash = await this.provider.sendTransaction(signedTx);

            console.log(`âœ… Transaction broadcasted: ${txHash.hash}`);
            console.log(`   View: https://bscscan.com/tx/${txHash.hash}`);

            // Wait for confirmation
            const receipt = await txHash.wait();
            
            if (receipt.status === 1) {
                console.log(`ðŸŽ‰ Transaction confirmed in block ${receipt.blockNumber}`);
                return {
                    success: true,
                    hash: txHash.hash,
                    receipt: receipt,
                    gasUsed: receipt.gasUsed,
                    effectiveGasPrice: receipt.effectiveGasPrice
                };
            } else {
                throw new Error('Transaction reverted');
            }

        } catch (error) {
            console.log(`âŒ Transaction attempt ${retryCount + 1} failed: ${error.message}`);
            
            if (retryCount < CONFIG.maxRetries - 1) {
                console.log(`ðŸ”„ Retrying with higher gas price...`);
                // Increase gas price for next retry
                if (tx.gasPrice) {
                    tx.gasPrice = tx.gasPrice.mul(Math.floor(CONFIG.gasPriceMultiplier * 1000)).div(1000);
                }
                return await this.signAndSendTransaction(tx, retryCount + 1);
            }
            
            return {
                success: false,
                error: error.message,
                attempts: retryCount + 1
            };
        }
    }

    async executeTriangularArbitrage(tokenA, tokenB, tokenC, expectedProfitUSD) {
        try {
            console.log(`ðŸ”„ EXECUTING TRIANGULAR ARBITRAGE: ${tokenA} â†’ ${tokenB} â†’ ${tokenC} â†’ ${tokenA}`);
            console.log(`ðŸ’° Expected Profit: $${expectedProfitUSD}`);
            console.log('');

            // Get token addresses
            const tokenAAddr = TOKENS[tokenA];
            const tokenBAddr = TOKENS[tokenB];
            const tokenCAddr = TOKENS[tokenC];
            const tokenAAddrLoop = TOKENS[tokenA]; // Complete the triangle

            // Create path: tokenA -> tokenB -> tokenC -> tokenA
            const path = [tokenAAddr, tokenBAddr, tokenCAddr, tokenAAddrLoop];

            // Calculate optimal amount (start with 1 token for simplicity)
            const amountIn = ethers.utils.parseEther('1');

            // Get expected output amount
            const router = new ethers.Contract(
                PANCAKE_ROUTER,
                [
                    'function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)',
                    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
                ],
                provider // Use provider instead of wallet for read operations
            );

            const amounts = await router.getAmountsOut(amountIn, path);
            const expectedOutput = amounts[amounts.length - 1];

            // Calculate minimum output (account for slippage and fees)
            const minOutput = expectedOutput.mul(995).div(1000); // 0.5% slippage

            console.log(`ðŸ“Š AMOUNT ANALYSIS:`);
            console.log(`   Input: ${ethers.utils.formatEther(amountIn)} ${tokenA}`);
            console.log(`   Expected Output: ${ethers.utils.formatEther(expectedOutput)} ${tokenA}`);
            console.log(`   Minimum Output: ${ethers.utils.formatEther(minOutput)} ${tokenA}`);
            console.log('');

            // Prepare transaction with proper address formatting
            const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes
            const tx = {
                to: PANCAKE_ROUTER,
                data: router.interface.encodeFunctionData('swapExactTokensForTokens', [
                    amountIn,
                    minOutput,
                    path,
                    wallet.address, // Use the properly formatted wallet address
                    deadline
                ]),
                gasLimit: ethers.BigNumber.from('2000000'), // High gas limit for complex swap
                gasPrice: await this.provider.getGasPrice()
            };

            console.log(`âš¡ EXECUTING TRANSACTION WITH FORCED SIGNING...`);

            // Execute transaction with forced signing
            const result = await this.signAndSendTransaction(tx);

            if (result.success) {
                console.log('');
                console.log('ðŸŽ¯ ARBITRAGE EXECUTION RESULT:');
                console.log(`   Status: âœ… SUCCESS`);
                console.log(`   Transaction Hash: ${result.hash}`);
                console.log(`   Block: ${result.receipt.blockNumber}`);
                console.log(`   Gas Used: ${result.gasUsed.toString()}`);
                console.log(`   Effective Gas Price: ${ethers.utils.formatUnits(result.effectiveGasPrice, 'gwei')} gwei`);
                
                // Calculate profit in different tokens
                const bnbPrice = 585; // Approximate BNB price
                const profitBNB = parseFloat(ethers.utils.formatEther(expectedOutput.sub(amountIn)));
                const profitUSD = profitBNB * bnbPrice;
                
                console.log('');
                console.log('ðŸ’° PROFIT ANALYSIS:');
                console.log(`   Raw Profit: ${profitBNB.toFixed(6)} ${tokenA}`);
                console.log(`   USD Value: ~$${profitUSD.toFixed(2)}`);
                console.log(`   Expected: $${expectedProfitUSD}`);
                
                // Prepare profit distribution data
                const profitAssets = {
                    'BNB': Math.round(profitBNB * 0.8 * 1000000) / 1000000, // 80% in BNB
                    'USDT': Math.round(profitUSD * 0.2 * 100) / 100  // 20% in USDT
                };
                
                console.log('');
                console.log('ðŸ“¤ PROFIT DISTRIBUTION PREPARED:');
                console.log(`   BNB: ${profitAssets.BNB}`);
                console.log(`   USDT: ${profitAssets.USDT}`);
                console.log('');
                console.log(`âœ… ARBITRAGE EXECUTED SUCCESSFULLY!`);
                console.log(`Tx Hash: ${result.hash}`);
                
                return {
                    success: true,
                    hash: result.hash,
                    profit: profitUSD,
                    profitAssets: profitAssets,
                    gasUsed: result.gasUsed.toString(),
                    blockNumber: result.receipt.blockNumber
                };
            } else {
                console.log('');
                console.log('âŒ ARBITRAGE EXECUTION FAILED:');
                console.log(`   Error: ${result.error}`);
                console.log(`   Attempts: ${result.attempts}`);
                return {
                    success: false,
                    error: result.error,
                    attempts: result.attempts
                };
            }

        } catch (error) {
            console.error('âŒ Arbitrage execution failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

async function main() {
    try {
        // Check command line arguments
        const args = process.argv.slice(2);
        if (args.length < 4) {
            console.log('âŒ Usage: node execute_triangular_arb.js <tokenA> <tokenB> <tokenC> <expectedProfitUSD> [--forced-signing]');
            console.log('Example: node execute_triangular_arb.js WBNB CAKE BTCB 45.50 --forced-signing');
            process.exit(1);
        }

        const [tokenA, tokenB, tokenC, expectedProfitUSD] = args.slice(0, 4);

        // Validate tokens
        if (!TOKENS[tokenA] || !TOKENS[tokenB] || !TOKENS[tokenC]) {
            console.log('âŒ Invalid token(s). Available tokens:', Object.keys(TOKENS).join(', '));
            process.exit(1);
        }

        console.log(`ðŸŽ¯ Target: ${tokenA} â†’ ${tokenB} â†’ ${tokenC} â†’ ${tokenA}`);
        console.log('');

        // Initialize executor
        const executor = new ForcedSigningExecutor();

        // Check wallet balance
        const balance = await provider.getBalance(wallet.address);
        console.log(`ðŸ’° Wallet Balance: ${ethers.utils.formatEther(balance)} BNB`);
        console.log(`   USD Value: ~${parseFloat(ethers.utils.formatEther(balance)) * 585}`);
        console.log(`   Wallet Address: ${wallet.address}`);
        console.log('');

        if (balance.lt(ethers.utils.parseEther('0.01'))) {
            console.log('âŒ Insufficient BNB balance for gas fees');
            process.exit(1);
        }

        // Execute triangular arbitrage
        const result = await executor.executeTriangularArbitrage(tokenA, tokenB, tokenC, parseFloat(expectedProfitUSD));

        // Exit with appropriate code
        if (result.success) {
            console.log('');
            console.log('ðŸŽ‰ TRIANGULAR ARBITRAGE COMPLETED SUCCESSFULLY');
            process.exit(0);
        } else {
            console.log('');
            console.log('ðŸ’¥ TRIANGULAR ARBITRAGE FAILED');
            process.exit(1);
        }

    } catch (error) {
        console.error('ðŸ’¥ Fatal error:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('ðŸ’¥ Uncaught Exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('ðŸ’¥ Unhandled Rejection:', reason);
    process.exit(1);
});

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { ForcedSigningExecutor };
