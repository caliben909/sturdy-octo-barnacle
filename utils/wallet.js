import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

let pk = process.env.PRIVATE_KEY.trim();
if (!pk.startsWith("0x")) pk = "0x" + pk;

if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) {
  console.error("❌ INVALID PRIVATE KEY");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
const wallet = new ethers.Wallet(pk, provider);

console.log("Signer Address :", wallet.address);
console.log("BNB Balance    :", ethers.formatEther(await provider.getBalance(wallet.address)), "BNB");

export default wallet;