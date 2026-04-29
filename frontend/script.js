"use strict";

const TOKEN_A_ADDRESS = "0x70755E14980418aDe2dded4E5ab4DDA21379c97d";
const TOKEN_B_ADDRESS = "0x94f16aE8A8864F9d0977f2595661367B8aff974a";
const DEX_ADDRESS     = "0x40d623F3FE713DE8D812ebd63A5f408E37A09aDe";

const REQUIRED_CHAIN_ID = 11155111;

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function mint(address to, uint256 amount) external",
];

const DEX_ABI = [
  "function addLiquidity(uint256 amountA, uint256 amountB) external",
  "function removeLiquidity(uint256 amountA, uint256 amountB) external",
  "function swapAforB(uint256 amountA) external",
  "function swapBforA(uint256 amountB) external",
  "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256)",
  "function getReserves() external view returns (uint256 reserveA, uint256 reserveB)",
  "function reserveA() external view returns (uint256)",
  "function reserveB() external view returns (uint256)",
];

let provider       = null;
let signer         = null;
let dexContract    = null;
let tokenAContract = null;
let tokenBContract = null;
let isTxPending    = false;

function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Element #${id} not found`);
  return node;
}

function setVisible(id, visible) {
  el(id).classList.toggle("hidden", !visible);
}

function setStatus(type, message) {
  const bar  = el("status-bar");
  const icon = el("status-icon");
  const msg  = el("status-message");

  bar.classList.remove("status-pending", "status-success", "status-error", "hidden");

  if (type === "hidden") {
    bar.classList.add("hidden");
    return;
  }

  const icons = { pending: "⏳", success: "✓", error: "✗" };
  icon.textContent = icons[type] || "ℹ";
  msg.textContent  = message;
  bar.classList.add(`status-${type}`);
}

function setControlsEnabled(enabled) {
  const ids = [
    "add-amount-a", "add-amount-b", "btn-add-liquidity",
    "rem-amount-a", "rem-amount-b", "btn-remove-liquidity",
    "swap-a-input", "btn-swap-a-for-b",
    "swap-b-input", "btn-swap-b-for-a",
    "btn-refresh",
  ];
  ids.forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.disabled = !enabled;
  });
}

function shortenAddress(addr) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask is not installed. Please install it from https://metamask.io");
    return;
  }

  try {
    setStatus("pending", "Requesting wallet access…");
    await window.ethereum.request({ method: "eth_requestAccounts" });

    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer   = provider.getSigner();

    const address = await signer.getAddress();
    const network = await provider.getNetwork();

    const allowedChains = [11155111, 31337];
    if (!allowedChains.includes(network.chainId)) {
      setStatus("pending", "Requesting MetaMask to switch to Sepolia...");
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
        });
        return; // The page will reload automatically
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia',
                rpcUrls: ['https://rpc.sepolia.org'],
                nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              }],
            });
            return;
          } catch (addError) {
            setStatus("error", `Failed to add Sepolia: ${addError.message}`);
            return;
          }
        }
        setStatus("error", `Wrong network. Please manually switch MetaMask to Sepolia.`);
        return;
      }
    }

    el("wallet-address").textContent = shortenAddress(address);
    setVisible("wallet-info",   true);
    setVisible("network-badge", true);
    el("network-name").textContent = network.chainId === 31337 ? "Localhost" : "Sepolia";
    el("btn-connect").textContent  = "Connected";
    el("btn-connect").disabled     = true;

    tokenAContract = new ethers.Contract(TOKEN_A_ADDRESS, ERC20_ABI, signer);
    tokenBContract = new ethers.Contract(TOKEN_B_ADDRESS, ERC20_ABI, signer);
    dexContract    = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);

    setControlsEnabled(true);
    await refreshBalances();
    setStatus("success", `Wallet connected: ${shortenAddress(address)}`);

    window.ethereum.on("accountsChanged", handleAccountChange);
    window.ethereum.on("chainChanged", () => window.location.reload());

  } catch (err) {
    console.error("connectWallet error:", err);
    setStatus("error", `Connection failed: ${err.message}`);
  }
}

async function handleAccountChange(accounts) {
  if (accounts.length === 0) {
    window.location.reload();
    return;
  }
  signer = provider.getSigner();
  const address = await signer.getAddress();
  el("wallet-address").textContent = shortenAddress(address);

  tokenAContract = new ethers.Contract(TOKEN_A_ADDRESS, ERC20_ABI, signer);
  tokenBContract = new ethers.Contract(TOKEN_B_ADDRESS, ERC20_ABI, signer);
  dexContract    = new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer);

  await refreshBalances();
}

async function refreshBalances() {
  if (!signer || !dexContract) return;

  try {
    const address = await signer.getAddress();
    const [balEth, balA, balB, rA, rB] = await Promise.all([
      provider.getBalance(address),
      tokenAContract.balanceOf(address),
      tokenBContract.balanceOf(address),
      dexContract.reserveA(),
      dexContract.reserveB(),
    ]);

    el("balance-eth").textContent = formatToken(balEth);
    el("balance-a").textContent = formatToken(balA);
    el("balance-b").textContent = formatToken(balB);
    el("reserve-a").textContent = formatToken(rA);
    el("reserve-b").textContent = formatToken(rB);
  } catch (err) {
    console.error("refreshBalances error:", err);
  }
}

function formatToken(bigNum) {
  const formatted = ethers.utils.formatUnits(bigNum, 18);
  return parseFloat(formatted).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

function parseToken(value) {
  if (!value || isNaN(value) || parseFloat(value) <= 0) {
    throw new Error("Invalid amount");
  }
  return ethers.utils.parseUnits(value.trim(), 18);
}

async function ensureApproval(tokenContract, amount, tokenName) {
  const ownerAddress = await signer.getAddress();
  const current = await tokenContract.allowance(ownerAddress, DEX_ADDRESS);

  if (current.lt(amount)) {
    setStatus("pending", `Approving ${tokenName} — confirm in MetaMask…`);
    const tx = await tokenContract.approve(DEX_ADDRESS, ethers.constants.MaxUint256);
    setStatus("pending", `Waiting for ${tokenName} approval to confirm…`);
    await tx.wait();
    setStatus("pending", `${tokenName} approved ✓`);
  }
}

async function runTx(fn, label) {
  if (isTxPending) return;
  isTxPending = true;
  setControlsEnabled(false);

  try {
    const tx = await fn();
    setStatus("pending", `${label} submitted — waiting for confirmation…`);
    await tx.wait();
    await refreshBalances();
    setStatus("success", `${label} confirmed ✓`);
  } catch (err) {
    console.error(`${label} error:`, err);
    const reason = err?.reason || err?.data?.message || err?.error?.message || err?.message || "Transaction failed";
    setStatus("error", `${label} failed: ${reason}`);
  } finally {
    isTxPending = false;
    setControlsEnabled(true);
  }
}

async function addLiquidity() {
  if (!dexContract) return;

  let amountA, amountB;
  try {
    amountA = parseToken(el("add-amount-a").value);
    amountB = parseToken(el("add-amount-b").value);
  } catch {
    setStatus("error", "Enter valid amounts for both tokens.");
    return;
  }

  await runTx(async () => {
    await ensureApproval(tokenAContract, amountA, "TokenA");
    await ensureApproval(tokenBContract, amountB, "TokenB");
    setStatus("pending", "Adding liquidity — confirm in MetaMask…");
    return dexContract.addLiquidity(amountA, amountB);
  }, "Add Liquidity");

  el("add-amount-a").value = "";
  el("add-amount-b").value = "";
}

async function removeLiquidity() {
  if (!dexContract) return;

  let amountA, amountB;
  try {
    amountA = parseToken(el("rem-amount-a").value);
    amountB = parseToken(el("rem-amount-b").value);
  } catch {
    setStatus("error", "Enter valid amounts for both tokens.");
    return;
  }

  await runTx(async () => {
    setStatus("pending", "Removing liquidity — confirm in MetaMask…");
    return dexContract.removeLiquidity(amountA, amountB);
  }, "Remove Liquidity");

  el("rem-amount-a").value = "";
  el("rem-amount-b").value = "";
}

async function swapAforB() {
  if (!dexContract) return;

  let amountA;
  try {
    amountA = parseToken(el("swap-a-input").value);
  } catch {
    setStatus("error", "Enter a valid TokenA amount.");
    return;
  }

  await runTx(async () => {
    await ensureApproval(tokenAContract, amountA, "TokenA");
    setStatus("pending", "Swapping TokenA for TokenB — confirm in MetaMask…");
    return dexContract.swapAforB(amountA);
  }, "Swap A → B");

  el("swap-a-input").value    = "";
  el("est-b-out").textContent = "—";
}

async function swapBforA() {
  if (!dexContract) return;

  let amountB;
  try {
    amountB = parseToken(el("swap-b-input").value);
  } catch {
    setStatus("error", "Enter a valid TokenB amount.");
    return;
  }

  await runTx(async () => {
    await ensureApproval(tokenBContract, amountB, "TokenB");
    setStatus("pending", "Swapping TokenB for TokenA — confirm in MetaMask…");
    return dexContract.swapBforA(amountB);
  }, "Swap B → A");

  el("swap-b-input").value    = "";
  el("est-a-out").textContent = "—";
}

async function previewSwapAforB() {
  const input   = el("swap-a-input").value;
  const preview = el("est-b-out");

  if (!dexContract || !input || parseFloat(input) <= 0) {
    preview.textContent = "—";
    return;
  }

  try {
    const amountIn = parseToken(input);
    const [rA, rB] = await dexContract.getReserves();

    if (rA.isZero() || rB.isZero()) {
      preview.textContent = "Pool empty";
      return;
    }

    const out = await dexContract.getAmountOut(amountIn, rA, rB);
    preview.textContent = formatToken(out);
  } catch {
    preview.textContent = "—";
  }
}

async function previewSwapBforA() {
  const input   = el("swap-b-input").value;
  const preview = el("est-a-out");

  if (!dexContract || !input || parseFloat(input) <= 0) {
    preview.textContent = "—";
    return;
  }

  try {
    const amountIn = parseToken(input);
    const [rA, rB] = await dexContract.getReserves();

    if (rA.isZero() || rB.isZero()) {
      preview.textContent = "Pool empty";
      return;
    }

    const out = await dexContract.getAmountOut(amountIn, rB, rA);
    preview.textContent = formatToken(out);
  } catch {
    preview.textContent = "—";
  }
}

setControlsEnabled(false);
