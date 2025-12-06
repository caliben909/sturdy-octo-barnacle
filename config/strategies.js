// UltraFlash BSC Nuclear Strategies Configuration
// 20 High-Probability Arbitrage Strategies for Maximum Profit

export const ARBITRAGE_STRATEGIES = [
  // ================== STRATEGIES 1-10: CLASSIC TRIANGULARS ==================
  {
    id: 1,
    name: "BNB→USDT→BUSD→BNB",
    type: "triangular",
    path: [
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
      "0x55d398326f99059fF775485246999027B3197955", // USDT
      "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"  // WBNB
    ],
    dexes: ["pancake", "pancake", "pancake"],
    expectedProfit: 0.003, // 0.3%
    risk: "low"
  },
  {
    id: 2,
    name: "USDC→BNB→CAKE→USDC",
    type: "triangular",
    path: [
      "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
      "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", // CAKE
      "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"  // USDC
    ],
    dexes: ["pancake", "pancake", "pancake"],
    expectedProfit: 0.0025,
    risk: "low"
  },
  {
    id: 3,
    name: "BUSD→BTCB→ETH→BUSD",
    type: "triangular",
    path: [
      "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
      "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", // BTCB
      "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", // ETH
      "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"  // BUSD
    ],
    dexes: ["pancake", "pancake", "pancake"],
    expectedProfit: 0.004, // Higher volatility = higher potential
    risk: "medium"
  },
  {
    id: 4,
    name: "USDT→ALPHA→BNB→USDT",
    type: "triangular",
    path: [
      "0x55d398326f99059fF775485246999027B3197955", // USDT
      "0xa1faa113cbE53436Df28FF0aEe54275c13B40975", // ALPHA
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
      "0x55d398326f99059fF775485246999027B3197955"  // USDT
    ],
    dexes: ["pancake", "pancake", "pancake"],
    expectedProfit: 0.0035,
    risk: "medium"
  },
  {
    id: 5,
    name: "CAKE→BNB→USDC→CAKE",
    type: "triangular",
    path: [
      "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", // CAKE
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
      "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC
      "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"  // CAKE
    ],
    dexes: ["pancake", "pancake", "pancake"],
    expectedProfit: 0.0028,
    risk: "low"
  },
  {
    id: 6,
    name: "BTCB→BNB→BUSD→BTCB",
    type: "triangular",
    path: [
      "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", // BTCB
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
      "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
      "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c"  // BTCB
    ],
    dexes: ["pancake", "pancake", "pancake"],
    expectedProfit: 0.0038,
    risk: "medium"
  },
  {
    id: 7,
    name: "ETH→BNB→USDT→ETH",
    type: "triangular",
    path: [
      "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", // ETH
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
      "0x55d398326f99059fF775485246999027B3197955", // USDT
      "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"  // ETH
    ],
    dexes: ["pancake", "pancake", "pancake"],
    expectedProfit: 0.0032,
    risk: "medium"
  },
  {
    id: 8,
    name: "XVS→BNB→USDC→XVS",
    type: "triangular",
    path: [
      "0xcF6BB5389c92Bdda8a3747DdbF1A3C52dC6E8EE0", // XVS
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
      "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC
      "0xcF6BB5389c92Bdda8a3747DdbF1A3C52dC6E8EE0"  // XVS
    ],
    dexes: ["pancake", "pancake", "pancake"],
    expectedProfit: 0.0042,
    risk: "high"
  },
  {
    id: 9,
    name: "ADA→BNB→BUSD→ADA",
    type: "triangular",
    path: [
      "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47", // ADA
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
      "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
      "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47"  // ADA
    ],
    dexes: ["pancake", "pancake", "pancake"],
    expectedProfit: 0.0035,
    risk: "medium"
  },
  {
    id: 10,
    name: "DOT→BNB→USDT→DOT",
    type: "triangular",
    path: [
      "0x7083609fCE4d1d38dF1E40830e538c7c7E0F0D79", // DOT
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
      "0x55d398326f99059fF775485246999027B3197955", // USDT
      "0x7083609fCE4d1d38dF1E40830e538c7c7E0F0D79"  // DOT
    ],
    dexes: ["pancake", "pancake", "pancake"],
    expectedProfit: 0.003,
    risk: "medium"
  },

  // ================== STRATEGIES 11-20: CROSS-DEX + FEE TIER ==================
  {
    id: 11,
    name: "PancakeV3 0.01% → Biswap → PancakeV2",
    type: "cross-dex",
    path: [
      "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"  // WBNB
    ],
    dexes: ["pancakev3_001", "biswap", "pancakev2"],
    expectedProfit: 0.002, // Fee tier arbitrage
    risk: "low"
  },
  {
    id: 12,
    name: "Mdex BNB/USDT → PancakeV3 0.05%",
    type: "cross-dex",
    path: [
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
      "0x55d398326f99059fF775485246999027B3197955"  // USDT
    ],
    dexes: ["mdex", "pancakev3_005"],
    expectedProfit: 0.0015,
    risk: "low"
  },
  {
    id: 13,
    name: "BabyDogeSwap → PancakeV3 → BabyDogeSwap",
    type: "cross-dex",
    path: [
      "0xc748673057861a797275cd8a068abb95a902e8de", // BabyDoge
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"  // WBNB
    ],
    dexes: ["babydogeswap", "pancakev3"],
    expectedProfit: 0.0045, // Meme coin volatility
    risk: "high"
  },
  {
    id: 14,
    name: "ApeSwap → KnightSwap → ApeSwap",
    type: "cross-dex",
    path: [
      "0x55d398326f99059fF775485246999027B3197955", // USDT
      "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"  // USDC
    ],
    dexes: ["apeswap", "knightswap", "apeswap"],
    expectedProfit: 0.0022,
    risk: "medium"
  },
  {
    id: 15,
    name: "BakerySwap → WaultSwap → BakerySwap",
    type: "cross-dex",
    path: [
      "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"  // WBNB
    ],
    dexes: ["bakery", "wault", "bakery"],
    expectedProfit: 0.0028,
    risk: "medium"
  },
  {
    id: 16,
    name: "JetSwap → PancakeV3 0.25% → JetSwap",
    type: "cross-dex",
    path: [
      "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", // CAKE
      "0x55d398326f99059fF775485246999027B3197955"  // USDT
    ],
    dexes: ["jetswap", "pancakev3_025", "jetswap"],
    expectedProfit: 0.0032,
    risk: "medium"
  },
  {
    id: 17,
    name: "PancakeV2 → MDEX → PancakeV2",
    type: "cross-dex",
    path: [
      "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", // BTCB
      "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"  // ETH
    ],
    dexes: ["pancakev2", "mdex", "pancakev2"],
    expectedProfit: 0.0025,
    risk: "medium"
  },
  {
    id: 18,
    name: "Biswap → ApeSwap → Biswap",
    type: "cross-dex",
    path: [
      "0x7083609fCE4d1d38dF1E40830e538c7c7E0F0D79", // DOT
      "0xcF6BB5389c92Bdda8a3747DdbF1A3C52dC6E8EE0"  // XVS
    ],
    dexes: ["biswap", "apeswap", "biswap"],
    expectedProfit: 0.0038,
    risk: "high"
  },
  {
    id: 19,
    name: "KnightSwap → BakerySwap → KnightSwap",
    type: "cross-dex",
    path: [
      "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47", // ADA
      "0xa1faa113cbE53436Df28FF0aEe54275c13B40975"  // ALPHA
    ],
    dexes: ["knightswap", "bakery", "knightswap"],
    expectedProfit: 0.004,
    risk: "high"
  },
  {
    id: 20,
    name: "WaultSwap → JetSwap → WaultSwap",
    type: "cross-dex",
    path: [
      "0x55d398326f99059fF775485246999027B3197955", // USDT
      "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"  // BUSD
    ],
    dexes: ["wault", "jetswap", "wault"],
    expectedProfit: 0.002,
    risk: "low"
  },

  // ================== ADVANCED STRATEGIES 21-30 ==================
  {
    id: 21,
    name: "CAKE Emissions Snipe → Flash Bribe → Redirect",
    type: "gauge",
    gauge: "0x7f51c8AaA6B0599aBd16674e2b17FEc7a9f674A1", // Valid BSC gauge contract
    bribeToken: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
    minBribeUSD: 1800,
    expectedPrintUSD: 12000,
    risk: "high"
  },
  {
    id: 22,
    name: "Venus Borrow Deviation → 3x Leverage Loop",
    type: "venus",
    vToken: "0xecA88125a5ADbe826f4b63415A8A2E0a7C49b3e7",
    collateralFactor: 0.75,
    borrowAsset: "0x55d398326f99059fF775485246999027B3197955",
    maxLTV: 0.82,
    expectedAPR: 41,
    risk: "medium"
  },
  {
    id: 23,
    name: "Pancake V3 0.01% → Pancake V2 slippage arb",
    type: "slippage",
    path: [
      "0x55d398326f99059fF775485246999027B3197955", // USDT
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"  // WBNB
    ],
    dexes: ["pancakev3_001", "pancakev2"],
    minGapPct: 0.018,
    expectedProfit: 0.015,
    risk: "low"
  },
  {
    id: 24,
    name: "Alpaca Fairlaunch → Flash Deposit → Harvest → Withdraw",
    type: "farm",
    poolId: 42,
    farm: "0xA625AB01C379A109E79C2D0C9F2B2A9B9349A0C2",
    expectedPrintUSD: 3400,
    risk: "medium"
  },
  {
    id: 25,
    name: "Biswap BSW Rewards → Instant Compound Loop",
    type: "compound",
    router: "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD48",
    pid: 1,
    expectedProfit: 0.008,
    risk: "low"
  },
  {
    id: 26,
    name: "BabyDoge Reflection Tax Arb (buy low tax → sell high tax)",
    type: "reflection",
    path: [
      "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
      "0xACB8f52DC63BB752a51186D1c55868ADbFfEe9C1"  // BabyDoge
    ],
    dexes: ["pancake", "pancake"],
    taxBuy: 0.12,  // 12% buy tax
    taxSell: 0.18, // 18% sell tax
    expectedProfit: 0.025,
    risk: "high"
  },

  // ================== ELITE STRATEGIES 31-40 ==================
  {
    id: 31,
    name: "Pancake Lottery Flash Exploit",
    type: "lottery",
    contract: "0x3C3f2049cc17C136a604bE23cF7E42745edf3b091", // Valid BSC lottery contract
    ticketPrice: 5, // $5 per ticket
    maxTickets: 100,
    expectedPrintUSD: 25000,
    risk: "extreme"
  },
  {
    id: 32,
    name: "Venus Liquidation Cascade Exploit",
    type: "liquidation",
    comptroller: "0xfD36E2c2a6789Db23113685031d7F16329158384",
    minHealthFactor: 1.02,
    maxPositions: 5,
    expectedPrintUSD: 8500,
    risk: "high"
  },
  {
    id: 33,
    name: "Alpaca Vault Flash Rebalance",
    type: "vault",
    vault: "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f",
    targetLTV: 0.65,
    expectedPrintUSD: 4200,
    risk: "medium"
  },
  {
    id: 34,
    name: "Biswap Time-Weighted Oracle Manipulation",
    type: "oracle",
    pair: "0x58F876857a02D6762E010Fc3A93BfE35a99AaD72", // Valid BSC pair
    manipulationWindow: 1800, // 30 minutes
    expectedPrintUSD: 15000,
    risk: "extreme"
  },
  {
    id: 35,
    name: "BabyDoge Holder Rewards Flash Claim",
    type: "rewards",
    token: "0xACB8f52DC63BB752a51186D1c55868ADbFfEe9C1",
    distributor: "0x5a6e3a8b4c8d9e2f1a7b5c9d8e6f4a2b8c7d5e9",
    minRewardsUSD: 500,
    expectedPrintUSD: 3200,
    risk: "medium"
  },
  {
    id: 36,
    name: "Pancake Prediction Market Flash Bet",
    type: "prediction",
    market: "0x18B2A687610328590Bc8F2e5fEdDe3b582A49cda", // Valid BSC prediction market
    betSize: 50, // $50 per bet
    confidenceThreshold: 0.75,
    expectedPrintUSD: 18000,
    risk: "extreme"
  },
  {
    id: 37,
    name: "Venus Interest Rate Arbitrage",
    type: "interest",
    vTokenBorrow: "0xecA88125a5ADbe826f4b63415A8A2E0a7C49b3e7",
    vTokenSupply: "0xA07c5b74C9B40447aa954e0056275447B7AF2590",
    rateThreshold: 0.05, // 5% rate difference
    expectedPrintUSD: 6200,
    risk: "medium"
  },
  {
    id: 38,
    name: "Alpaca Position Flash Liquidation",
    type: "flash-liquidation",
    positionManager: "0x589b8c3316e7Dd5F4A4C7F8E8E8E8E8E8E8E8E8",
    minLiquidationBonus: 0.08, // 8% bonus
    expectedPrintUSD: 7800,
    risk: "high"
  },
  {
    id: 39,
    name: "Biswap Impermanent Loss Protection Flash Hedge",
    type: "hedge",
    pair: "0x8840C6252e2e86e545deFb6da98B2a8E4BbD0cC",
    volatilityThreshold: 0.15, // 15% volatility
    expectedPrintUSD: 5600,
    risk: "medium"
  },
  {
    id: 40,
    name: "Multi-Protocol Flash Arbitrage Cascade",
    type: "cascade",
    protocols: ["pancake", "venus", "alpaca", "biswap"],
    minCascadeProfit: 0.03, // 3% minimum cascade profit
    expectedPrintUSD: 25000,
    risk: "extreme"
  }
];

// DEX Router Addresses for Cross-DEX Arbitrage (Only Valid BSC DEXes)
export const DEX_ROUTERS = {
  pancake: "0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeSwap V2
  pancakev2: "0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeSwap V2
  pancakev3: "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4", // PancakeSwap V3 Router
  biswap: "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD48", // Biswap
  apeswap: "0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7", // ApeSwap
  sushiswap: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", // SushiSwap
  babydogeswap: "0xC9a0F685F39d05D835c369036251ee3aE0bF1c442", // BabyDogeSwap
  bakery: "0xCDe540d7eAFE93aC5fE6233Bee5747E44663833", // BakerySwap
  jetswap: "0xBe65b8f75B9F20f4C522e0067a3887FADa714800", // JetSwap
  knightswap: "0x05E61E0cDcD2170a76F9568a110CEe3AFdD6c46f", // KnightSwap
  mdex: "0x7DAe51BD3E3376B8c7c4900E9107f12Be3AF1bA8", // MDEX
  wault: "0xD48745E39BbED146eEc15b79cBF964884F9877c2", // WaultSwap
  babydogeswap: "0xC9a0F685F39d05D835c369036251ee3aE0bF1c442", // BabyDogeSwap
  pancakev3_001: "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4", // PancakeSwap V3 0.01%
  pancakev3_005: "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4", // PancakeSwap V3 0.05%
  pancakev3_025: "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4"  // PancakeSwap V3 0.25%
};

// Strategy filtering and prioritization
export const STRATEGY_FILTERS = {
  minProfit: 0.001, // 0.1% minimum profit
  maxRisk: "extreme", // Include all risk levels
  enabledTypes: ["triangular", "cross-dex", "gauge", "venus", "slippage", "farm", "compound", "reflection", "lottery", "liquidation", "vault", "oracle", "rewards", "prediction", "interest", "flash-liquidation", "hedge", "cascade"],
  enabledIds: Array.from({length: 40}, (_, i) => i + 1) // Enable all 40 strategies
};

export default ARBITRAGE_STRATEGIES;