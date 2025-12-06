
from web3.middleware import geth_poa_middleware
if " bsc\ in w3.clientVersion.lower() or \binance\ in w3.clientVersion.lower():
 w3.middleware_onion.inject(geth_poa_middleware, layer=0)
 print(\POA middleware injected — pending block error fixed\)
