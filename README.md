<h1 align="center">SimpleDEX</h1>

<p align="center">
  <strong>A minimal Automated Market Maker (AMM) Decentralized Exchange built from scratch</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/SOLIDITY-363342?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity" />
  <img src="https://img.shields.io/badge/ETHEREUM-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white" alt="Ethereum" />
  <img src="https://img.shields.io/badge/HARDHAT-FFDB1C?style=for-the-badge&logo=hardhat&logoColor=black" alt="Hardhat" />
  <img src="https://img.shields.io/badge/LICENSE-MIT-green?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <b>Live Demo: <a href="https://simple-dex-swap-liquidity.vercel.app/">simple-dex-swap-liquidity.vercel.app</a></b><br>
  <b>Transaction Proof: <a href="https://sepolia.etherscan.io/tx/0xf118a9b4a60afa330e07e184247073cc8eb8c7f2e819a99af215a6495265850c">View on Etherscan</a></b>
</p>

<p align="center">
  <b>Demo Video</b><br>
  <a href="https://drive.google.com/file/d/1vyswDItxr5KoJ6YzRZfUqMT-wZEwe6dQ/view?usp=drivesdk">
    <img src="https://img.shields.io/badge/▶_WATCH_DEMO-4285F4?style=for-the-badge&logo=google-play&logoColor=white" alt="Watch Demo" />
  </a>
</p>

<p align="center">
  <i>SimpleDEX allows users to swap ERC20 tokens and provide liquidity using the constant-product formula (x * y = k) on the Sepolia testnet.</i>
</p>

---

## Table of Contents

1. [What is a DEX?](#what-is-a-dex)
2. [DEX vs CEX — Advantages](#dex-vs-cex--advantages-no-middleman)
3. [System Architecture](#system-architecture)
4. [Task Pipeline](#task-pipeline)
5. [What is Liquidity?](#what-is-liquidity)
6. [Liquidity Providers](#liquidity-providers)
7. [Constant Product Formula](#constant-product-formula)
8. [Contract Structure](#contract-structure)
9. [Contract Usage](#contract-usage)
10. [Deployed Contracts](#deployed-contracts-sepolia-testnet)
11. [Project Structure](#project-structure)
12. [Setup & Installation](#setup--installation)
13. [Deployment](#deployment)
14. [Frontend Setup](#frontend-setup)
15. [Security Notes](#security-notes)

---

## What is a DEX?

A **Decentralized Exchange (DEX)** is a peer-to-peer marketplace where users can trade cryptocurrencies directly with each other — **without a central authority** like a bank or an exchange company controlling the funds.

Unlike traditional exchanges (Coinbase, Binance), a DEX runs entirely on **smart contracts** deployed on a blockchain. The rules are written in code, transparent, and cannot be changed or manipulated by anyone — including the creators.

```mermaid
graph TD
    A["User A\n(Has TokenA)"] -->|"Sends TokenA"| P["Liquidity Pool\nSmart Contract"]
    P -->|"Sends TokenB"| A
    B["User B\n(Has TokenB)"] -->|"Sends TokenB"| P
    P -->|"Sends TokenA"| B
    P -->|"Holds reserves"| R["reserveA + reserveB\n(x × y = k)"]

    style P fill:#4f46e5,color:#fff
    style R fill:#0f172a,color:#fff
```

**Key properties of a DEX:**
- Non-custodial — you always control your private keys
- Transparent — all code is open source and on-chain
- Permissionless — anyone can trade or provide liquidity without an account
- Automated — pricing is handled by an algorithm (AMM), not humans

---

## DEX vs CEX — Advantages (No Middleman)

A **Centralized Exchange (CEX)** like Binance or Coinbase acts as a middleman — they hold your funds, match your orders, and can freeze your account.

A **DEX** removes this middleman entirely.

```mermaid
graph LR
    subgraph CEX ["Centralized Exchange (CEX)"]
        U1["User"] -->|"Deposit funds"| E["Exchange\n(Controls your money)"]
        E -->|"Match order"| U2["Counterparty"]
        E -.->|"Can freeze, hack, rug"| X["Risk"]
    end

    subgraph DEX ["Decentralized Exchange (DEX)"]
        U3["User"] -->|"Interact directly"| SC["Smart Contract\n(No one controls it)"]
        SC -->|"Automatic swap"| U3
        SC -.->|"Rules fixed in code"| S["Safe & Transparent"]
    end
```

| Feature | CEX | DEX |
|---|---|---|
| Custody of funds | Exchange holds them | You hold them |
| KYC Required | Yes | No |
| Can be hacked/frozen | Yes | No (only smart contract risk) |
| 24/7 availability | Depends | Always |
| Transparent pricing | Hidden order book | On-chain formula |
| Permissionless | Account required | Just a wallet |

---

## System Architecture

The following diagram illustrates the high-level architecture of SimpleDEX, showing the interaction between the user interface and the blockchain.

```mermaid
graph TD
    User((End User))
    UI["Frontend UI\n(HTML/CSS/JS)"]
    Ethers["Ethers.js\n(Web3 Provider)"]
    Network["Ethereum Sepolia\n(Blockchain)"]

    subgraph Contracts ["Smart Contracts"]
        DEX["SimpleDEX.sol"]
        TKA["TokenA.sol"]
        TKB["TokenB.sol"]
    end

    User <--> UI
    UI <--> Ethers
    Ethers <--> Network
    Network <--> DEX
    DEX <--> TKA
    DEX <--> TKB
    
    style Contracts fill:#f9f9f9,stroke:#333,stroke-width:2px
    style DEX fill:#4f46e5,color:#fff
```

---

## Task Pipeline

The deployment and development workflow for the project follows these sequential steps.

```mermaid
graph LR
    Clone["Clone Repo"] --> Install["npm install"]
    Install --> Config["Config .env"]
    Config --> Compile["Compile\n(Hardhat)"]
    Compile --> Deploy["Deploy to\nSepolia"]
    Deploy --> Update["Update\nFrontend addresses"]
    Update --> Run["Run Web App"]
    
    style Deploy fill:#0d9488,color:#fff
    style Run fill:#4285F4,color:#fff
```

---

## What is Liquidity?

**Liquidity** refers to how easily an asset can be bought or sold without significantly affecting its price.

In a DEX, liquidity is not provided by an order book — instead, users **deposit pairs of tokens** into a **liquidity pool** (a smart contract). These pooled tokens are then available for anyone to swap against.

```mermaid
graph TD
    LP["Liquidity Pool\n(reserveA=1000 TKA, reserveB=1000 TKB)"]

    T1["Trader swaps\n100 TKA → TKB"] -->|"adds TKA to pool"| LP
    LP -->|"sends TKB to trader"| T1

    LP --> F["After Swap:\nreserveA = 1100 TKA\nreserveB ≈ 909 TKB\nPrice of TKB goes UP"]

    style LP fill:#0d9488,color:#fff
    style F fill:#1e293b,color:#fff
```

---

## Liquidity Providers

**Liquidity Providers (LPs)** are users who deposit equal-value amounts of both tokens into the pool. In return, they earn trading fees on every swap (in production DEXes like Uniswap).

```mermaid
sequenceDiagram
    participant LP as Liquidity Provider
    participant Token as Token Contracts
    participant DEX as SimpleDEX Contract

    LP->>Token: approve(DEX_ADDRESS, amountA)
    Token-->>LP: Approved

    LP->>Token: approve(DEX_ADDRESS, amountB)
    Token-->>LP: Approved

    LP->>DEX: addLiquidity(amountA, amountB)
    DEX->>Token: transferFrom(LP → DEX, amountA)
    DEX->>Token: transferFrom(LP → DEX, amountB)
    DEX-->>LP: Liquidity Added (reserveA ↑, reserveB ↑)

    Note over LP,DEX: Later, LP can call removeLiquidity()

    LP->>DEX: removeLiquidity(amountA, amountB)
    DEX->>Token: transfer(LP, amountA)
    DEX->>Token: transfer(LP, amountB)
    DEX-->>LP: Tokens returned
```

---

## Constant Product Formula

The heart of any AMM is the **constant product invariant**:

```
x × y = k
```

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
        +transfer(to, amount) bool
        +approve(spender, amount) bool
        +mint(to, amount) void
    }

    class TokenB {
        +string name = "Token B"
        +string symbol = "TKB"
        +uint8 decimals = 18
        +uint256 totalSupply
        +transfer(to, amount) bool
        +approve(spender, amount) bool
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

---

## Contract Usage

### TokenA / TokenB — ERC20 Functions

| Function | Signature | Description |
|---|---|---|
| `balanceOf` | `balanceOf(address) → uint256` | Returns token balance of an address |
| `transfer` | `transfer(address to, uint256 amount) → bool` | Send tokens to another wallet |
| `approve` | `approve(address spender, uint256 amount) → bool` | Allow DEX to spend your tokens |
| `mint` | `mint(address to, uint256 amount)` | Mint test tokens (open access — dev only) |

### SimpleDEX — Core Functions

| Function | Signature | Description |
|---|---|---|
| `addLiquidity` | `addLiquidity(uint256 amountA, uint256 amountB)` | Deposit both tokens into the pool. |
| `removeLiquidity` | `removeLiquidity(uint256 amountA, uint256 amountB)` | Withdraw tokens from the pool. |
| `swapAforB` | `swapAforB(uint256 amountA)` | Sell TKA, receive TKB. |
| `swapBforA` | `swapBforA(uint256 amountB)` | Sell TKB, receive TKA. |

---

## Deployed Contracts (Sepolia Testnet)

| Contract | Address | Etherscan |
|---|---|---|
| **TokenA (TKA)** | `0x70755E14980418aDe2dded4E5ab4DDA21379c97d` | [View ↗](https://sepolia.etherscan.io/address/0x70755E14980418aDe2dded4E5ab4DDA21379c97d) |
| **TokenB (TKB)** | `0x94f16aE8A8864F9d0977f2595661367B8aff974a` | [View ↗](https://sepolia.etherscan.io/address/0x94f16aE8A8864F9d0977f2595661367B8aff974a) |
| **SimpleDEX** | `0x40d623F3FE713DE8D812ebd63A5f408E37A09aDe` | [View ↗](https://sepolia.etherscan.io/address/0x40d623F3FE713DE8D812ebd63A5f408E37A09aDe) |

---

## Project Structure

```
simple-dex/
├── contracts/        # Smart Contracts (Solidity)
├── scripts/          # Deployment Scripts
├── frontend/         # Web Application UI
├── hardhat.config.js # Hardhat Configuration
└── package.json      # Dependencies
```

---

## Setup & Installation

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Configure .env**: Add `ALCHEMY_URL` and `PRIVATE_KEY`
4. **Deploy**: `npm run deploy:sepolia`
5. **Run Frontend**: `npm run dev`

---

## Security Notes

This project is for **educational purposes only**. It is not audited and does not include LP tokens or trading fees.

---

## License

MIT
