# services/ArbitrageCalculator.py
# GROK ULTIMATE EDITION – Runs on a potato, prints money on BSC

from decimal import Decimal
import os
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

# ================== BSC CONSTANTS ==================
WBNB   = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
USDT   = "0x55d398326f99059fF775485246999027B3197955"
USDC   = "0x8AC76a51cc950d9822D68b83fE1Ad004bD0C0b1E"
BUSD   = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
CAKE   = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"
BTCB   = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3EAd9c"

ROUTERS = {
    "pancake": "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    "biswap":  "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD48",
    "apeswap": "0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7"
}

RPC = os.getenv("BSC_RPC", "https://bsc-dataseed.binance.org/")
w3 = Web3(Web3.HTTPProvider(RPC))

# Minimal ABI – only getAmountsOut
ROUTER_ABI = '''[{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"}]'''

# ===================================================

def get_price(router_addr: str, token_in: str, token_out: str, amount_in: int) -> int:
    """Return amountOut or 0 if failed"""
    try:
        contract = w3.eth.contract(address=router_addr, abi=ROUTER_ABI)
        amounts = contract.functions.getAmountsOut(amount_in, [token_in, token_out]).call()
        return amounts[-1]
    except:
        return 0

def best_price_across_dexs(token_in: str, token_out: str, amount_in: int):
    """Returns (best_amount_out, best_dex_name)"""
    best = 0
    best_dex = ""
    for name, router in ROUTERS.items():
        out = get_price(router, token_in, token_out, amount_in)
        if out > best:
            best = out
            best_dex = name
    return best, best_dex

def calculate_triangular_profit(path: list, amount_in: int = int(1e18)):
    """Simple triangular arb: A → B → C → A"""
    a_to_b = get_price(ROUTERS["pancake"], path[0], path[1], amount_in)
    if a_to_b == 0: return 0
    
    b_to_c = get_price(ROUTERS["pancake"], path[1], path[2], a_to_b)
    if b_to_c == 0: return 0
    
    c_to_a, _ = best_price_across_dexs(path[2], path[0], b_to_c)
    if c_to_a <= amount_in:
        return 0
    
    # Apply fees roughly (0.25% per swap × 3 = ~0.75%)
    profit = c_to_a - amount_in
    profit_after_fees = profit * 0.9925  # conservative
    return int(profit_after_fees)

class EnhancedArbitrageCalculator:
    # All the fancy shit stripped — we only need this one method for the bot
    @staticmethod
    def find_profitable_cycle(flash_loan_usd: float = 10000.0) -> dict:
        # Hardcode the few paths that actually print in real life (2025 meta)
        cycles = [
            [WBNB, USDT, BUSD, WBNB],
            [WBNB, USDC, USDT, WBNB],
            [WBNB, CAKE, USDT, WBNB],
            [WBNB, BTCB, USDT, WBNB],
            [USDT, WBNB, CAKE, USDT],
            [USDT, WBNB, BTCB, USDT],
        ]

        # Convert USD → WBNB amount (BNB ≈ $885 right now)
        bnb_price = 885
        amount_in = int((flash_loan_usd / bnb_price) * 1e18)

        best_profit = 0
        best_path = None

        for cycle in cycles:
            profit = calculate_triangular_profit(cycle, amount_in)
            if profit > best_profit:
                best_profit = profit
                best_path = cycle

        profit_usd = (best_profit / 1e18) * bnb_price if best_profit > 0 else 0

        return {
            "profitable": profit_usd >= 2,           # minimum $2 or we don’t bother
            "profit_usd": round(profit_usd, 2),
            "best_path": best_path,
            "amount_in_bnb": round(amount_in / 1e18, 4),
            "raw_profit_wei": best_profit
        }

# ========= QUICK TEST WHEN RUN DIRECTLY =========
if __name__ == "__main__":
    import time
    print("Grok Ultimate Arb Scanner LIVE – scanning triangles every 5 sec")
    while True:
        result = EnhancedArbitrageCalculator.find_profitable_cycle(10000)
        if result["profitable"]:
            print(f"PRINT DETECTED → ${result['profit_usd']} | Path: {result['best_path']}")
        else:
            print(f"No juice yet… best = ${result['profit_usd']}")
        time.sleep(5)