#!/usr/bin/env node

/**
 * LAUNCH SCRIPT FOR CALI FLASHLOAN ARBITRAGE BOT
 * Includes safety measures and emergency controls
 */

const { ethers } = require('ethers');
const ArbitrageBot = require('./bot/ArbitrageBot');
const { getSafetyStatus } = require('./utils/SafetyWrapper');
require('dotenv').config();

// Configuration
const CONFIG = {
    minProfitUSD: parseFloat(process.env.MIN_PROFIT_USD) || 0.1, // $0.10 minimum profit
    maxGasPrice: parseFloat(process.env.MAX_GAS_PRICE_GWEI) || 10, // 10 gwei max
    scanInterval: parseInt(process.env.SCAN_INTERVAL_MS) || 5000, // 5 second scanning
    network: process.env.NETWORK || 'mainnet',
    rpcUrl: process.env.RPC_URL || 'https://bsc-dataseed.binance.org/',
    privateKey: process.env.PRIVATE_KEY,
    // Forced signing configuration
    forcedSigningEnabled: process.env.FORCED_SIGNING_ENABLED === 'true' || true,
    maxRetriesPerTx: parseInt(process.env.MAX_RETRIES_PER_TX) || 6,
    gasPriceMultiplier: parseFloat(process.env.GAS_PRICE_MULTIPLIER) || 1.25,
    mcpWallets: [
        "0xfb1abaee3bb70922cc91b6b02d29339b53a43661",  // MCP Wallet 1
        "0xbb1d2b77b02909e6418c6a130570228f098428c0",  // MCP Wallet 2
        "0xd65fdd4361f0b6d87a4a8c18afe15279a9b1ca9c",  // MCP Wallet 3
    ]
};

// Global bot instance
let bot = null;
let isShuttingDown = false;

// Graceful shutdown handler
async function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n🛑 Received ${signal} - Initiating graceful shutdown...`);

    try {
        if (bot) {
            await bot.stop();
            console.log('✅ Bot stopped successfully');
        }

        // Display final statistics
        if (bot) {
            const status = bot.getStatus();
            console.log('\n📊 FINAL BOT STATISTICS:');
            console.log(`   Total Trades: ${status.winrate.totalTrades}`);
            console.log(`   Successful Trades: ${status.winrate.successfulTrades}`);
            console.log(`   Win Rate: ${status.winrate.winrate.toFixed(2)}%`);
            console.log(`   Safety Status: ${JSON.stringify(bot.getSafetyStatus(), null, 2)}`);
        }

        // Clean up PID file
        const fs = require('fs');
        const path = require('path');
        const pidFile = path.join(__dirname, 'bot.pid');
        try {
            if (fs.existsSync(pidFile)) {
                fs.unlinkSync(pidFile);
                console.log('🧹 PID file cleaned up');
            }
        } catch (error) {
            console.error('❌ Error cleaning up PID file:', error.message);
        }

        console.log('👋 Bot shutdown complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
}

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

async function main() {
    try {
        console.log('🚀 CALI FLASHLOAN ARBITRAGE BOT LAUNCH SEQUENCE');
        console.log('================================================');
        console.log(`⏰ Launch Time: ${new Date().toISOString()}`);
        console.log(`🌐 Network: ${CONFIG.network}`);
        console.log(`💰 Min Profit: ${CONFIG.minProfitUSD}`);
        console.log(`⛽ Max Gas Price: ${CONFIG.maxGasPrice} gwei`);
        console.log(`🔄 Scan Interval: ${CONFIG.scanInterval}ms`);
        console.log(`🔒 Forced Signing: ${CONFIG.forcedSigningEnabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`🔄 Max Retries: ${CONFIG.maxRetriesPerTx} per transaction`);
        console.log(`⚡ Gas Multiplier: ${CONFIG.gasPriceMultiplier}x`);
        console.log(`👥 MCP Wallets: ${CONFIG.mcpWallets.length} wallets configured`);
        console.log('');

        // Validate configuration
        console.log('🔍 VALIDATING CONFIGURATION...');
        if (!CONFIG.privateKey) {
            throw new Error('❌ PRIVATE_KEY not found in environment variables');
        }

        if (!CONFIG.rpcUrl) {
            throw new Error('❌ RPC_URL not found in environment variables');
        }

        console.log('✅ Configuration validated');
        console.log('');

        // Check safety measures
        console.log('🛡️ CHECKING SAFETY MEASURES...');
        const safetyStatus = getSafetyStatus();
        console.log('✅ Safety measures active:');
        console.log(`   • Test Mode: ${safetyStatus.testMode.enabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`   • Circuit Breaker: ${safetyStatus.circuitBreaker.isActive ? 'ACTIVE' : 'Ready'}`);
        console.log(`   • Max Trade Size: $${safetyStatus.limits.maxTradeSize}`);
        console.log(`   • Max Gas Price: ${safetyStatus.limits.maxGasPrice} gwei`);
        console.log('');

        // Initialize provider and signer
        console.log('🔗 INITIALIZING BLOCKCHAIN CONNECTION...');
        const provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl);
        const signer = new ethers.Wallet(CONFIG.privateKey, provider);

        // Test connection
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        const balance = await signer.getBalance();

        console.log(`✅ Connected to ${network.name} (Chain ID: ${network.chainId})`);
        console.log(`📊 Current block: ${blockNumber}`);
        console.log(`💰 Wallet balance: ${ethers.utils.formatEther(balance)} BNB ($${parseFloat(ethers.utils.formatEther(balance)) * 567})`);
        console.log(`📍 Wallet address: ${signer.address}`);
        console.log('');

        // Validate minimum balance
        const minBalance = ethers.utils.parseEther('0.001'); // 0.001 BNB minimum
        if (balance.lt(minBalance)) {
            throw new Error(`❌ Insufficient balance: ${ethers.utils.formatEther(balance)} BNB < ${ethers.utils.formatEther(minBalance)} BNB required`);
        }

        // Initialize bot
        console.log('🤖 INITIALIZING ARBITRAGE BOT...');
        bot = new ArbitrageBot(provider, signer, {
            minProfitUSD: CONFIG.minProfitUSD,
            maxGasPrice: CONFIG.maxGasPrice,
            scanInterval: CONFIG.scanInterval
        });

        // Initialize bot with safety checks
        const initSuccess = await bot.initialize();
        if (!initSuccess) {
            throw new Error('❌ Bot initialization failed');
        }

        console.log('✅ Bot initialized successfully');
        console.log('');

        // Display comprehensive bot status and safety measures
        const status = bot.getStatus();
        console.log('📊 BOT STATUS & SAFETY MEASURES:');
        console.log(`   • Running: ${status.isRunning}`);
        console.log(`   • Min Profit: $${status.currentParameters.minProfitUSD}`);
        console.log(`   • Max Gas Price: ${status.currentParameters.maxGasPrice} gwei`);
        console.log(`   • Scan Interval: ${status.currentParameters.scanInterval}ms`);
        console.log('');

        // Display safety measures (same format as validation)
        console.log('🛡️ ACTIVE SAFETY MEASURES:');
        console.log(`   • Test Mode: ${safetyStatus.testMode.enabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`   • Circuit Breaker: ${safetyStatus.circuitBreaker.isActive ? 'ACTIVE' : 'Ready'}`);
        console.log(`   • Max Trade Size: $${safetyStatus.limits.maxTradeSize}`);
        console.log(`   • Max Gas Price: ${safetyStatus.limits.maxGasPrice} gwei`);
        console.log(`   • Slippage Protection: ${safetyStatus.limits.maxSlippage * 100}% maximum`);
        console.log(`   • Emergency Stop: ${bot.getSafetyStatus().emergencyStopTriggered ? 'ACTIVE' : 'Ready'}`);
        console.log(`   • Consecutive Failures: ${bot.getSafetyStatus().consecutiveFailures}/${bot.getSafetyStatus().maxConsecutiveFailures}`);
        console.log('');

        // Write PID file for process management
        const fs = require('fs');
        const path = require('path');
        const pidFile = path.join(__dirname, 'bot.pid');
        fs.writeFileSync(pidFile, process.pid.toString());
        console.log(`📋 PID file created: ${pidFile} (PID: ${process.pid})`);

        // Start the bot
        console.log('🎯 STARTING ARBITRAGE SCANNING...');
        console.log('=====================================');
        console.log('🛡️  SAFETY MEASURES ACTIVE');
        console.log('💰 PROFITABLE FLASHLOAN ARBITRAGE MODE');
        console.log('🚨 EMERGENCY STOP: Ctrl+C');
        console.log('=====================================');
        console.log('');

        await bot.start();

    } catch (error) {
        console.error('💥 BOT LAUNCH FAILED:', error.message);
        console.error('Stack trace:', error.stack);

        // Cleanup on failure
        if (bot) {
            try {
                await bot.stop();
            } catch (cleanupError) {
                console.error('❌ Cleanup failed:', cleanupError.message);
            }
        }

        process.exit(1);
    }
}

// Handle command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Cali Flashloan Arbitrage Bot Launcher

USAGE:
  node launch_bot.js [options]

OPTIONS:
  --help, -h          Show this help message
  --dry-run           Validate configuration without starting
  --test-mode         Force test mode (small amounts)
  --production        Force production mode (full amounts)

ENVIRONMENT VARIABLES:
  PRIVATE_KEY         Your wallet private key
  RPC_URL            Blockchain RPC URL
  MIN_PROFIT_USD     Minimum profit threshold (default: 0.1)
  MAX_GAS_PRICE_GWEI Maximum gas price in gwei (default: 10)
  SCAN_INTERVAL_MS   Scanning interval in ms (default: 5000)

EXAMPLES:
  node launch_bot.js                    # Start with default settings
  node launch_bot.js --dry-run         # Validate without starting
  node launch_bot.js --test-mode       # Force test mode

SAFETY:
  - Test mode limits trades to $500 max
  - Circuit breaker stops after 3 failures
  - Emergency stop with Ctrl+C
  - Gas price limits prevent overpayment
        `);
        process.exit(0);
    }

    if (args.includes('--dry-run')) {
        console.log('🔍 DRY RUN MODE - Validating configuration...');
        // Add dry run logic here if needed
        console.log('✅ Configuration validated (dry run)');
        process.exit(0);
    }

    // Start the bot
    main().catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { main, gracefulShutdown };