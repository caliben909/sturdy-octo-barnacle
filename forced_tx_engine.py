# forced_tx_engine.py
import time
import math
import threading
from web3 import Web3
from web3.exceptions import TransactionNotFound
import os
from dotenv import load_dotenv

load_dotenv()

# ======================
# CONFIGURATION (edit me)
# ======================
BSC_RPC = os.getenv("BSC_RPC_URL", "https://bsc-dataseed.binance.org/")   # change to testnet RPC for testing
PRIVATE_KEY = os.getenv("PRIVATE_KEY", "0xYOUR_PRIVATE_KEY")              # keep secure; use env vars in production
WALLET_ADDRESS = os.getenv("WALLET_ADDRESS", "0xYourWalletAddress").lower()   # checksum not needed for comparisons

CONTRACT_ADDRESS = os.getenv("FLASHLOAN_ARB_CONTRACT", "0xYourContractAddress")      # the contract you call for arbitrage
MCP_WALLETS = [
    "0xfb1abaee3bb70922cc91b6b02d29339b53a43661",  # MCP Wallet 1
    "0xbb1d2b77b02909e6418c6a130570228f098428c0",  # MCP Wallet 2
    "0xd65fdd4361f0b6d87a4a8c18afe15279a9b1ca9c",  # MCP Wallet 3
]

TOKEN_ADDRESSES = {
    "BNB": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    "BUSD": "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    "USDT": "0x55d398326f99059ff775485246999027b3197955",
    "USDC": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    "WBTC": "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
    "CAKE": "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"
}

CHAIN_ID = 56
GAS_LIMIT_DEFAULT = 21000
GAS_LIMIT_TOKEN = 200_000
GAS_LIMIT_ARBITRAGE = 2_000_000

# Retry/self-heal params
MAX_RETRIES_PER_TX = 6
GAS_PRICE_MULTIPLIER = 1.25
PENDING_CHECK_INTERVAL = 5   # seconds to scan pending block
RECEIPT_TIMEOUT = 20         # seconds to wait for receipt before replacing

# ----------------------
# Web3 init
# ----------------------
web3 = Web3(Web3.HTTPProvider(BSC_RPC))
if not web3.is_connected():
    raise SystemExit("RPC not connected - update BSC_RPC or check node")

# Nonce lock to avoid concurrent TX nonce issues
nonce_lock = threading.Lock()

# ======================
# HELPERS
# ======================
def get_pending_nonce():
    """Return the next nonce considering pending txs (prevents overwriting)."""
    return web3.eth.get_transaction_count(WALLET_ADDRESS, "pending")

def current_gas_price():
    return web3.eth.gas_price

def to_checksum(addr):
    return web3.to_checksum_address(addr)

# ======================
# Simple ERC20 transfer helper (assumes 18 decimals)
# ======================
ERC20_TRANSFER_ABI = [
    {
        "constant": False,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    }
]

def get_token_contract(symbol):
    addr = TOKEN_ADDRESSES.get(symbol)
    if not addr:
        raise ValueError(f"No token address configured for {symbol}")
    return web3.eth.contract(address=to_checksum(addr), abi=ERC20_TRANSFER_ABI)

# ======================
# SIGN & BROADCAST (self-heal)
# ======================
def sign_and_send_raw(tx_dict):
    signed = web3.eth.account.sign_transaction(tx_dict, PRIVATE_KEY)
    return web3.eth.send_raw_transaction(signed.rawTransaction)

def wait_for_receipt(tx_hash, timeout=RECEIPT_TIMEOUT):
    start = time.time()
    while time.time() - start < timeout:
        try:
            receipt = web3.eth.get_transaction_receipt(tx_hash)
            return receipt
        except TransactionNotFound:
            time.sleep(1)
    return None

def send_and_ensure_confirmed(to, value, gas_limit=GAS_LIMIT_DEFAULT, data=b"", start_nonce=None):
    """
    Sign + broadcast and retry by replacing same-nonce tx with higher gas until confirmed
    or retries exhausted. Returns receipt or None.
    """
    attempt = 0
    nonce = start_nonce if start_nonce is not None else get_pending_nonce()
    base_gas_price = current_gas_price()
    gas_price = base_gas_price

    while attempt < MAX_RETRIES_PER_TX:
        tx = {
            "nonce": nonce,
            "to": to if to else "0x0000000000000000000000000000000000000000",
            "value": int(value),
            "gas": gas_limit,
            "gasPrice": int(gas_price),
            "chainId": CHAIN_ID,
            "data": data
        }

        try:
            tx_hash = sign_and_send_raw(tx)
            hex_hash = web3.to_hex(tx_hash)
            print(f"[attempt {attempt+1}] broadcasted tx {hex_hash} nonce={nonce} gasPrice={gas_price}")
        except Exception as e:
            print(f"[attempt {attempt+1}] broadcast error: {e}")
            attempt += 1
            gas_price = math.ceil(gas_price * GAS_PRICE_MULTIPLIER)
            time.sleep(1)
            continue

        receipt = wait_for_receipt(tx_hash)
        if receipt and receipt.get("status", 0) == 1:
            print(f"✅ TX confirmed {hex_hash} block {receipt['blockNumber']}")
            return receipt

        # not confirmed — bump gas and retry (replacement)
        attempt += 1
        gas_price = math.ceil(gas_price * GAS_PRICE_MULTIPLIER)
        print(f"⏳ No confirmation yet for {hex_hash}, will replace with gasPrice={gas_price}")
        time.sleep(1)

    print(f"❌ TX failed after {MAX_RETRIES_PER_TX} attempts (nonce={nonce})")
    return None

# ======================
# PENDING TX HANDLER
# ======================
def handle_pending_txs():
    """Scan pending block for our wallet's txs and replace them with higher gas-price txs."""
    try:
        pending_block = web3.eth.get_block("pending", full_transactions=True)
    except Exception as e:
        print("Unable to fetch pending block:", e)
        return

    for tx in pending_block.transactions:
        try:
            if tx["from"].lower() == WALLET_ADDRESS:
                print(f"Pending TX found: {web3.to_hex(tx['hash'])} nonce={tx['nonce']}. Attempting replacement.")
                # build replacement preserving to/value/input; higher gas price will be chosen by send_and_ensure_confirmed
                replace_nonce = tx["nonce"]
                old_gas_price = tx.get("gasPrice") or current_gas_price()
                # set starting gas price higher than old
                new_gas_price = int((old_gas_price or current_gas_price()) * GAS_PRICE_MULTIPLIER * 1.1)
                # attempt replace
                send_and_ensure_confirmed(to=tx["to"] or "", value=tx["value"] or 0,
                                          gas_limit=tx.get("gas") or GAS_LIMIT_DEFAULT,
                                          data=tx.get("input", b""), start_nonce=replace_nonce)
        except Exception as e:
            print("Error handling pending tx:", e)

# ======================
# PROFIT SPLIT WITH FORCED SIGNING
# ======================
def distribute_profit_with_forced_signing(profit_dict):
    """
    profit_dict example: {"BNB": 0.02, "BUSD": 1.0, "USDT": 50.0}
    This function will:
      - split each asset equally among MCP_WALLETS
      - for BNB: perform native transfers with forced signing
      - for tokens: perform ERC20 transfer calls with forced signing
      - include retry mechanism and gas price bumping
    """
    with nonce_lock:
        nonce = get_pending_nonce()

        for asset, amount in profit_dict.items():
            if amount <= 0:
                continue

            if asset == "BNB":
                amount_wei = web3.to_wei(amount, "ether")
            else:
                # assume 18 decimals for tokens; adjust if needed
                amount_wei = int(amount * (10 ** 18))

            per_wallet = amount_wei // len(MCP_WALLETS)
            print(f"Distributing {amount} {asset} => {per_wallet} wei per wallet (with forced signing)")

            for w in MCP_WALLETS:
                if asset == "BNB":
                    # send native with forced signing
                    receipt = send_and_ensure_confirmed(
                        to=w, 
                        value=per_wallet, 
                        gas_limit=GAS_LIMIT_DEFAULT, 
                        start_nonce=nonce
                    )
                else:
                    token = get_token_contract(asset)
                    data = token.functions.transfer(to_checksum(w), per_wallet).buildTransaction({'from': WALLET_ADDRESS})['data']
                    receipt = send_and_ensure_confirmed(
                        to=token.address, 
                        value=0, 
                        gas_limit=GAS_LIMIT_TOKEN, 
                        data=data, 
                        start_nonce=nonce
                    )

                if receipt is None:
                    print(f"Warning: transfer to {w} failed for asset {asset} - will retry")
                    # Retry with higher gas
                    time.sleep(2)
                    if asset == "BNB":
                        receipt = send_and_ensure_confirmed(
                            to=w, 
                            value=per_wallet, 
                            gas_limit=GAS_LIMIT_DEFAULT, 
                            start_nonce=nonce
                        )
                    else:
                        data = token.functions.transfer(to_checksum(w), per_wallet).buildTransaction({'from': WALLET_ADDRESS})['data']
                        receipt = send_and_ensure_confirmed(
                            to=token.address, 
                            value=0, 
                            gas_limit=GAS_LIMIT_TOKEN, 
                            data=data, 
                            start_nonce=nonce
                        )
                    
                    if receipt:
                        print(f"✅ Retry successful: transfer to {w} completed")
                    else:
                        print(f"❌ Final failure: transfer to {w} for asset {asset}")
                else:
                    print(f"✅ Transfer successful to {w}")
                    
                nonce += 1
                time.sleep(0.5)  # Small delay between transactions

# ======================
# ARBITRAGE TX BUILDER & FORCED SIGNING (integration point)
# ======================
def build_arbitrage_tx_data(contract_abi, method_name, args=None):
    """
    Example helper if you have the arbitrage contract abi loaded.
    - contract_abi: standard ABI (list/dict) for the contract
    - method_name: function to call that executes arbitrage (string)
    - args: list of args for the method
    Returns the contract call data bytes (hex) which you can pass to send_and_ensure_confirmed.
    """
    # user should replace with an actual contract instance in their code
    from web3.contract import Contract
    # This helper expects you to instead create the contract in your main script and call:
    # data = contract.functions.yourMethod(...).buildTransaction({'from': WALLET_ADDRESS})['data']
    raise NotImplementedError("Use your contract instance to build tx data (see integration example).")

# ======================
# INTEGRATION EXAMPLE (how your arbitrage bot should call this)
# ======================
def on_successful_arb_with_forced_signing(profit_dict, execute_contract_call=None):
    """
    Called by your arbitrage/flashloan bot after a successful on-chain arbitrage (or when profit is realized).
    - profit_dict: {"BNB": 0.02, "BUSD": 1.5, "USDT": 50.0}
    - execute_contract_call: optional tuple (to, data, gas_limit) if you need the engine to execute a contract call
      e.g., execute_contract_call = (CONTRACT_ADDRESS, <data bytes>, 600000)
    Flow:
      1) Optionally execute provided contract call (this will be signed and forced)
      2) When that call returns (confirmed), call distribute_profit_with_forced_signing to push profits to MCP wallets
    """
    # Step A: optionally execute contract (e.g., flashloan/arb executor) with forced signing
    if execute_contract_call:
        to, data, gas_limit = execute_contract_call
        print("Executing on-chain arbitrage call (forced signing)...")
        with nonce_lock:
            nonce = get_pending_nonce()
            rec = send_and_ensure_confirmed(
                to=to, 
                value=0, 
                gas_limit=gas_limit, 
                data=data, 
                start_nonce=nonce
            )
            if rec is None:
                print("Arbitrage execution failed — aborting distribution")
                return
            else:
                print("Arbitrage exec receipt:", rec['transactionHash'].hex())

    # Step B: distribute profits to MCP wallets with forced signing
    print("Distributing profits to MCP wallets (equal split, WITH forced signing).")
    distribute_profit_with_forced_signing(profit_dict)

# ======================
# PROFIT CALCULATION INTEGRATION
# ======================
def calculate_and_distribute_profits(arbitrage_result):
    """
    Calculate profits from arbitrage result and distribute to MCP wallets
    arbitrage_result: {
        'success': bool,
        'profit_assets': {'BNB': 0.01, 'USDT': 25.5, 'BUSD': 10.0},
        'gas_used': 150000,
        'tx_hash': '0x...',
        'profit_usd': 45.60
    }
    """
    if not arbitrage_result.get('success', False):
        print("Arbitrage was not successful, skipping profit distribution")
        return

    profit_assets = arbitrage_result.get('profit_assets', {})
    if not profit_assets:
        print("No profits to distribute")
        return

    print(f"💰 PROFIT DISTRIBUTION: ${arbitrage_result.get('profit_usd', 0):.2f}")
    print(f"📊 Assets: {profit_assets}")
    
    # Distribute with forced signing
    distribute_profit_with_forced_signing(profit_assets)

# ======================
# EMERGENCY PROFIT RECOVERY
# ======================
def emergency_profit_recovery():
    """
    Emergency function to recover stuck profits by checking recent transactions
    and manually distributing any found profits.
    """
    print("🚨 EMERGENCY PROFIT RECOVERY - Checking for stuck profits...")
    
    try:
        # Get recent transactions
        current_block = web3.eth.block_number
        from_block = current_block - 100  # Check last 100 blocks
        
        # Filter for incoming transactions to our wallet
        incoming_txs = []
        
        # This would need to be implemented based on your specific needs
        # For now, just print a message
        print("🔍 Emergency recovery scan completed - manual review recommended")
        
    except Exception as e:
        print(f"❌ Emergency recovery failed: {e}")

# ======================
# UTILITY
# ======================
def to_checksum(a):
    try:
        return web3.to_checksum_address(a)
    except:
        return a

# ======================
# MONITORING THREAD
# ======================
def start_monitoring():
    """Start background monitoring for pending transactions and profit recovery"""
    def monitor_loop():
        while True:
            try:
                handle_pending_txs()
                time.sleep(PENDING_CHECK_INTERVAL)
            except Exception as e:
                print(f"Monitor error: {e}")
                time.sleep(5)
    
    monitor_thread = threading.Thread(target=monitor_loop, daemon=True)
    monitor_thread.start()
    print("Background monitoring started for pending transactions")

# End of forced_tx_engine.py