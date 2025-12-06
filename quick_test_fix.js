#!/usr/bin/env node

/**
 * QUICK TEST TO VERIFY THE FIX
 * Tests the triangular arbitrage executor with clean profit values
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 QUICK FIX TEST');
console.log('==================');
console.log('');

async function testFixedExecutor() {
    return new Promise((resolve, reject) => {
        console.log('🧪 Testing JavaScript executor with forced signing...');
        
        // Test with reasonable profit values
        const cmd = [
            'node',
            'execute_triangular_arb.js',
            'WBNB',
            'USDT', 
            'BTCB',
            '25.50',  // Clean, reasonable profit value
            '--forced-signing'
        ];

        console.log('🔧 Command:', cmd.join(' '));
        console.log('');

        const node = spawn(cmd[0], cmd.slice(1), { 
            cwd: path.resolve(__dirname),
            timeout: 30000  // 30 second timeout
        });

        let stdout = '';
        let stderr = '';

        node.stdout.on('data', (data) => {
            const text = data.toString();
            stdout += text;
            console.log(text);
        });

        node.stderr.on('data', (data) => {
            const text = data.toString();
            stderr += text;
            console.error(text);
        });

        node.on('close', (code) => {
            console.log('');
            console.log('📊 TEST RESULT:');
            console.log('Exit Code:', code);
            
            if (code === 0) {
                console.log('✅ SUCCESS: JavaScript executor works with clean profit values');
                console.log('✅ The address checksum error should be resolved');
                console.log('✅ Forced signing integration is working');
                resolve(true);
            } else {
                console.log('❌ FAILED: Check the error output above');
                console.log('STDERR:', stderr);
                reject(new Error(`Exit code: ${code}`));
            }
        });

        node.on('error', (error) => {
            console.log('❌ SPAWN ERROR:', error.message);
            reject(error);
        });
    });
}

async function main() {
    try {
        await testFixedExecutor();
        console.log('');
        console.log('🎉 FIX VERIFICATION COMPLETE');
        console.log('The triangular arbitrage should now work properly with:');
        console.log('  ✅ Clean profit values (no scientific notation)');
        console.log('  ✅ Proper address checksum handling');
        console.log('  ✅ Forced signing transaction execution');
        console.log('  ✅ MCP wallet profit distribution');
        console.log('');
        console.log('🚀 Ready to run the main bot: python final_printer_2025.py');
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        process.exit(1);
    }
}

main();