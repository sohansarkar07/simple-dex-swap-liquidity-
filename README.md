# SimpleDEX

> A minimal **Automated Market Maker (AMM)** Decentralized Exchange built from scratch using Solidity, Hardhat, and ethers.js — deployed on Ethereum Sepolia testnet.

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![Network](https://img.shields.io/badge/Network-Sepolia-purple)](https://sepolia.etherscan.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

---

## Table of Contents

1. [What is a DEX?](#what-is-a-dex)
2. [DEX vs CEX — Advantages](#dex-vs-cex--advantages-no-middleman)
3. [What is Liquidity?](#what-is-liquidity)
4. [Liquidity Providers](#liquidity-providers)
5. [Constant Product Formula](#constant-product-formula)
6. [Contract Structure](#contract-structure)
7. [Contract Usage](#contract-usage)
8. [Deployed Contracts](#-deployed-contracts-sepolia-testnet)
9. [Project Structure](#project-structure)
10. [Setup & Installation](#setup--installation)
11. [Deployment](#deployment)
12. [Frontend Setup](#frontend-setup)
13. [Security Notes](#security-notes)

---

## What is a DEX?

A **Decentralized Exchange (DEX)** is a peer-to-peer marketplace where users can trade cryptocurrencies directly with each other — **without a central authority** like a bank or an exchange company controlling the funds.

Unlike traditional exchanges (Coinbase, Binance), a DEX runs entirely on **smart contracts** deployed on a blockchain. The rules are written in code, transparent, and cannot be changed or manipulated by anyone — including the creators.

```mermaid
graph TD
    A["👤 User A\n(Has TokenA)"] -->|"Sends TokenA"| P["🏦 Liquidity Pool\nSmart Contract"]
    P -->|"Sends TokenB"| A
    B["👤 User B\n(Has TokenB)"] -->|"Sends TokenB"| P
    P -->|"Sends TokenA"| B
    P -->|"Holds reserves"| R["📦 reserveA + reserveB\n(x × y = k)"]

    style P fill:#4f46e5,color:#fff
    style R fill:#0f172a,color:#fff
```

**Key properties of a DEX:**
- 🔓 **Non-custodial** — you always control your private keys
- 📖 **Transparent** — all code is open source and on-chain
- 🌐 **Permissionless** — anyone can trade or provide liquidity without an account
- 🤖 **Automated** — pricing is handled by an algorithm (AMM), not humans

---

## DEX vs CEX — Advantages (No Middleman)

A **Centralized Exchange (CEX)** like Binance or Coinbase acts as a middleman — they hold your funds, match your orders, and can freeze your account.

A **DEX** removes this middleman entirely.

```mermaid
graph LR
    subgraph CEX ["❌ Centralized Exchange (CEX)"]
        U1["User"] -->|"Deposit funds"| E["Exchange\n(Controls your money)"]
        E -->|"Match order"| U2["Counterparty"]
        E -.->|"Can freeze, hack, rug"| X["⚠️ Risk"]
    end

    subgraph DEX ["✅ Decentralized Exchange (DEX)"]
        U3["User"] -->|"Interact directly"| SC["Smart Contract\n(No one controls it)"]
        SC -->|"Automatic swap"| U3
        SC -.->|"Rules fixed in code"| S["✅ Safe & Transparent"]
    end
```

| Feature | CEX | DEX |
|---|---|---|
| Custody of funds | Exchange holds them | You hold them |
| KYC Required | ✅ Yes | ❌ No |
| Can be hacked/frozen | ✅ Yes | ❌ No (only smart contract risk) |
| 24/7 availability | Depends | ✅ Always |
| Transparent pricing | ❌ Hidden order book | ✅ On-chain formula |
| Permissionless | ❌ Account required | ✅ Just a wallet |

---

## What is Liquidity?

**Liquidity** refers to how easily an asset can be bought or sold without significantly affecting its price.

In a DEX, liquidity is not provided by an order book — instead, users **deposit pairs of tokens** into a **liquidity pool** (a smart contract). These pooled tokens are then available for anyone to swap against.

```mermaid
graph TD
    LP["💰 Liquidity Pool\n(reserveA=1000 TKA, reserveB=1000 TKB)"]

    T1["🔄 Trader swaps\n100 TKA → TKB"] -->|"adds TKA to pool"| LP
    LP -->|"sends TKB to trader"| T1

    LP --> F["📊 After Swap:\nreserveA = 1100 TKA\nreserveB ≈ 909 TKB\nPrice of TKB goes UP ↑"]

    style LP fill:#0d9488,color:#fff
    style F fill:#1e293b,color:#fff
```

**Why does price change?**
- The pool always maintains `x × y = k`
- When you buy more of token B, its reserve shrinks → its price rises
- This is **automatic price discovery** without any human intervention

**High liquidity = small price impact per trade**
**Low liquidity = large price impact (slippage) per trade**

---

## Liquidity Providers

**Liquidity Providers (LPs)** are users who deposit equal-value amounts of both tokens into the pool. In return, they earn trading fees on every swap (in production DEXes like Uniswap).

```mermaid
sequenceDiagram
    participant LP as 💼 Liquidity Provider
    participant Token as 🪙 Token Contracts
    participant DEX as 🏦 SimpleDEX Contract

    LP->>Token: approve(DEX_ADDRESS, amountA)
    Token-->>LP: ✅ Approved

    LP->>Token: approve(DEX_ADDRESS, amountB)
    Token-->>LP: ✅ Approved

    LP->>DEX: addLiquidity(amountA, amountB)
    DEX->>Token: transferFrom(LP → DEX, amountA)
    DEX->>Token: transferFrom(LP → DEX, amountB)
    DEX-->>LP: ✅ Liquidity Added (reserveA ↑, reserveB ↑)

    Note over LP,DEX: Later, LP can call removeLiquidity()

    LP->>DEX: removeLiquidity(amountA, amountB)
    DEX->>Token: transfer(LP, amountA)
    DEX->>Token: transfer(LP, amountB)
    DEX-->>LP: ✅ Tokens returned
```

**In production AMMs (e.g. Uniswap v2):**
- LPs receive **LP tokens** proportional to their share of the pool
- They earn a **0.3% fee** on every swap
- They can redeem LP tokens to withdraw their share + accumulated fees

> ⚠️ **This SimpleDEX** has no LP tokens and no fees — it's for learning purposes only.

---

## Constant Product Formula

The heart of any AMM is the **constant product invariant**:

```
x × y = k
```

Where:
- `x` = reserve of TokenA in the pool
- `y` = reserve of TokenB in the pool
- `k` = a constant that **never changes** during a swap

### How a Swap is Priced

```mermaid
graph LR
    A["Pool State:\nreserveA = 1000\nreserveB = 1000\nk = 1,000,000"]
    B["User sends\n100 TKA to pool"]
    C["New reserveA\n= 1100"]
    D["New reserveB\nmust satisfy:\n1100 × y = 1,000,000\ny = 909.09"]
    E["User receives:\n1000 - 909.09\n= 90.91 TKB"]

    A --> B --> C --> D --> E

    style A fill:#1e3a5f,color:#fff
    style E fill:#065f46,color:#fff
```

**The formula used in this contract:**

```
amountOut = (amountIn × reserveOut) / (reserveIn + amountIn)
```

### Numerical Example

| State | reserveA (TKA) | reserveB (TKB) | k |
|---|---|---|---|
| Initial | 1000 | 1000 | 1,000,000 |
| Swap 100 TKA → TKB | 1100 | 909.09 | 1,000,000 ✅ |
| Swap 200 TKA → TKB | 1300 | 769.23 | 1,000,000 ✅ |

**Key insight:** The more you buy, the worse your rate — this is called **price impact / slippage**. Large trades in small pools get worse prices.

### Price Curve

The constant product formula creates a **hyperbolic curve** where reserves can never reach zero:

```
         TKB
          |
    1000  |*
          | *
     500  |   *
          |      *
     200  |          *
          |                *
          +--+--+--+--+--+--+-- TKA
           200 500 1000 2000
```

> The curve asymptotically approaches the axes — meaning you can never drain a pool to zero.

---

## Contract Structure

```mermaid
classDiagram
    class IERC20 {
        <<interface>>
        +transferFrom(from, to, amount) bool
        +transfer(to, amount) bool
        +balanceOf(account) uint256
        +approve(spender, amount) bool
    }

    class TokenA {
        +string name = "Token A"
        +string symbol = "TKA"
        +uint8 decimals = 18
        +uint256 totalSupply
        +mapping balanceOf
        +mapping allowance
        +transfer(to, amount) bool
        +approve(spender, amount) bool
        +transferFrom(from, to, amount) bool
        +mint(to, amount) void
    }

    class TokenB {
        +string name = "Token B"
        +string symbol = "TKB"
        +uint8 decimals = 18
        +uint256 totalSupply
        +mapping balanceOf
        +mapping allowance
        +transfer(to, amount) bool
        +approve(spender, amount) bool
        +transferFrom(from, to, amount) bool
        +mint(to, amount) void
    }

    class SimpleDEX {
        +address tokenA (immutable)
        +address tokenB (immutable)
        +uint256 reserveA
        +uint256 reserveB
        +addLiquidity(amountA, amountB) void
        +removeLiquidity(amountA, amountB) void
        +swapAforB(amountA) void
        +swapBforA(amountB) void
        +getAmountOut(amountIn, rIn, rOut) uint256
        +getReserves() tuple
    }

    IERC20 <|.. TokenA : implements
    IERC20 <|.. TokenB : implements
    SimpleDEX --> IERC20 : uses
```

### File Overview

| File | Purpose |
|---|---|
| `contracts/TokenA.sol` | ERC20 token (TKA) — manual implementation, no OpenZeppelin |
| `contracts/TokenB.sol` | ERC20 token (TKB) — identical structure to TokenA |
| `contracts/SimpleDEX.sol` | AMM DEX — holds liquidity pool, handles swaps |
| `scripts/deploy.js` | Deploys all 3 contracts in sequence to any Hardhat network |
| `frontend/index.html` | Single-page app UI |
| `frontend/script.js` | ethers.js wallet + contract interaction logic |
| `hardhat.config.js` | Hardhat config with Sepolia network + dotenv |

---

## Contract Usage

### TokenA / TokenB — ERC20 Functions

| Function | Signature | Description |
|---|---|---|
| `balanceOf` | `balanceOf(address) → uint256` | Returns token balance of an address |
| `transfer` | `transfer(address to, uint256 amount) → bool` | Send tokens to another wallet |
| `approve` | `approve(address spender, uint256 amount) → bool` | Allow DEX to spend your tokens |
| `allowance` | `allowance(address owner, address spender) → uint256` | Check approved amount |
| `transferFrom` | `transferFrom(address from, address to, uint256 amount) → bool` | DEX calls this to pull tokens from your wallet |
| `mint` | `mint(address to, uint256 amount)` | Mint test tokens (open access — dev only) |

### SimpleDEX — Core Functions

| Function | Signature | Description |
|---|---|---|
| `addLiquidity` | `addLiquidity(uint256 amountA, uint256 amountB)` | Deposit both tokens into the pool. Requires prior `approve()` on both tokens. |
| `removeLiquidity` | `removeLiquidity(uint256 amountA, uint256 amountB)` | Withdraw tokens from the pool. Fails if pool has insufficient reserves. |
| `swapAforB` | `swapAforB(uint256 amountA)` | Sell TKA, receive TKB. Price set by constant product formula. |
| `swapBforA` | `swapBforA(uint256 amountB)` | Sell TKB, receive TKA. |
| `getAmountOut` | `getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) → uint256` | Pure view — preview swap output amount. |
| `getReserves` | `getReserves() → (uint256, uint256)` | Returns current `(reserveA, reserveB)`. |

### Swap Flow (Step by Step)

```mermaid
sequenceDiagram
    participant User
    participant TKA as TokenA Contract
    participant DEX as SimpleDEX Contract
    participant TKB as TokenB Contract

    User->>TKA: approve(DEX_ADDRESS, amountA)
    TKA-->>User: ✅ Allowance set

    User->>DEX: swapAforB(amountA)
    DEX->>DEX: amountBOut = getAmountOut(amountA, reserveA, reserveB)
    DEX->>TKA: transferFrom(User → DEX, amountA)
    TKA-->>DEX: ✅ TKA received
    DEX->>TKB: transfer(User, amountBOut)
    TKB-->>User: ✅ TKB sent
    DEX->>DEX: reserveA += amountA\nreserveB -= amountBOut
    DEX-->>User: emit SwapAforB event
```

### Events Emitted

| Event | When Triggered |
|---|---|
| `LiquidityAdded(provider, amountA, amountB)` | On successful `addLiquidity()` |
| `LiquidityRemoved(provider, amountA, amountB)` | On successful `removeLiquidity()` |
| `SwapAforB(user, amountAIn, amountBOut)` | On successful TKA → TKB swap |
| `SwapBforA(user, amountBIn, amountAOut)` | On successful TKB → TKA swap |

---

## 🚀 Deployed Contracts (Sepolia Testnet)

| Contract | Address | Etherscan |
|---|---|---|
| **TokenA (TKA)** | `0x70755E14980418aDe2dded4E5ab4DDA21379c97d` | [View ↗](https://sepolia.etherscan.io/address/0x70755E14980418aDe2dded4E5ab4DDA21379c97d) |
| **TokenB (TKB)** | `0x94f16aE8A8864F9d0977f2595661367B8aff974a` | [View ↗](https://sepolia.etherscan.io/address/0x94f16aE8A8864F9d0977f2595661367B8aff974a) |
| **SimpleDEX** | `0x40d623F3FE713DE8D812ebd63A5f408E37A09aDe` | [View ↗](https://sepolia.etherscan.io/address/0x40d623F3FE713DE8D812ebd63A5f408E37A09aDe) |

> 🌐 Network: **Ethereum Sepolia Testnet** (Chain ID: 11155111)

---

## Project Structure

```
simple-dex/
├── contracts/
│   ├── TokenA.sol        # ERC20 token (TKA) — manual implementation
│   ├── TokenB.sol        # ERC20 token (TKB) — manual implementation
│   └── SimpleDEX.sol     # AMM DEX — constant product formula
│
├── scripts/
│   └── deploy.js         # Deploys TokenA, TokenB, then SimpleDEX
│
├── frontend/
│   ├── index.html        # Single-page UI
│   ├── style.css         # Styles
│   ├── script.js         # ethers.js wallet + contract integration
│   └── ethers.min.js     # ethers.js v5 (local copy)
│
├── hardhat.config.js     # Hardhat + Sepolia network config
├── package.json
├── .env.example          # Template for environment variables
└── .gitignore
```

---

## Setup & Installation

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| MetaMask | Latest browser extension |
| Sepolia ETH | Get from [sepoliafaucet.com](https://sepoliafaucet.com) |

### 1. Clone the repository

```bash
git clone <repo-url>
cd simple-dex
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/<your-key>
PRIVATE_KEY=<your-wallet-private-key-without-0x>
```

> ⚠️ **Security:** Never commit your `.env` file. The `.gitignore` already excludes it.

---

## Deployment

### Compile contracts

```bash
npm run compile
```

### Deploy to Sepolia

```bash
npm run deploy:sepolia
```

**Expected output:**

```
Deploying contracts with account: 0xYourAddress
Deployer balance: X.XX ETH

TokenA deployed to:   0xAAA...
TokenB deployed to:   0xBBB...
SimpleDEX deployed to: 0xCCC...

─────────────────────────────────────────────
✅  Deployment complete. Update frontend/script.js with:
─────────────────────────────────────────────
  TOKEN_A_ADDRESS = "0xAAA..."
  TOKEN_B_ADDRESS = "0xBBB..."
  DEX_ADDRESS     = "0xCCC..."
```

### Deploy to local Hardhat node (for development)

```bash
# Terminal 1 – start local node
npm run node

# Terminal 2 – deploy
npm run deploy:local
```

---

## Frontend Setup

### 1. Update contract addresses

Open `frontend/script.js` and set the deployed addresses:

```js
const TOKEN_A_ADDRESS = "0xAAA...";
const TOKEN_B_ADDRESS = "0xBBB...";
const DEX_ADDRESS     = "0xCCC...";
```

### 2. Run the frontend

```bash
npm run dev
```

Or just open `frontend/index.html` directly in your browser.

### 3. Use the DEX

1. Click **Connect Wallet** — MetaMask will prompt for access.
2. Ensure you are on the **Sepolia** network in MetaMask.
3. **Mint tokens** — via [Etherscan Write Contract](https://sepolia.etherscan.io/address/0x70755E14980418aDe2dded4E5ab4DDA21379c97d#writeContract) if your wallet has none.
4. **Add Liquidity** — enter amounts of TKA and TKB, approve, then deposit.
5. **Swap** — enter an input amount, check the estimated output, confirm.
6. **Remove Liquidity** — enter amounts to withdraw back.

---

## Testing

```bash
npm run test
```

Tests should be placed in the `test/` directory (create as needed).

---

## Security Notes

This project is for **educational purposes only**.

- ❌ No LP tokens — liquidity removal is not proportional to share
- ❌ No trading fee — not production-ready
- ❌ `mint()` is open to any address — not production-ready
- ❌ Not audited

---

## License

MIT
