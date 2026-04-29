// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract SimpleDEX {
    address public immutable tokenA;
    address public immutable tokenB;

    uint256 public reserveA;
    uint256 public reserveB;

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB);
    event SwapAforB(address indexed user, uint256 amountAIn, uint256 amountBOut);
    event SwapBforA(address indexed user, uint256 amountBIn, uint256 amountAOut);

    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != address(0) && _tokenB != address(0), "DEX: zero address");
        require(_tokenA != _tokenB, "DEX: identical tokens");
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    function addLiquidity(uint256 amountA, uint256 amountB) external {
        require(amountA > 0 && amountB > 0, "DEX: amounts must be > 0");

        require(
            IERC20(tokenA).transferFrom(msg.sender, address(this), amountA),
            "DEX: TokenA transferFrom failed"
        );
        require(
            IERC20(tokenB).transferFrom(msg.sender, address(this), amountB),
            "DEX: TokenB transferFrom failed"
        );

        reserveA += amountA;
        reserveB += amountB;

        emit LiquidityAdded(msg.sender, amountA, amountB);
    }

    function removeLiquidity(uint256 amountA, uint256 amountB) external {
        require(amountA > 0 && amountB > 0, "DEX: amounts must be > 0");
        require(reserveA >= amountA,        "DEX: insufficient TokenA liquidity");
        require(reserveB >= amountB,        "DEX: insufficient TokenB liquidity");

        reserveA -= amountA;
        reserveB -= amountB;

        require(IERC20(tokenA).transfer(msg.sender, amountA), "DEX: TokenA transfer failed");
        require(IERC20(tokenB).transfer(msg.sender, amountB), "DEX: TokenB transfer failed");

        emit LiquidityRemoved(msg.sender, amountA, amountB);
    }

    function swapAforB(uint256 amountA) external {
        require(amountA > 0, "DEX: amountA must be > 0");
        require(reserveA > 0 && reserveB > 0, "DEX: pool has no liquidity");

        uint256 amountBOut = getAmountOut(amountA, reserveA, reserveB);
        require(amountBOut > 0,         "DEX: insufficient output amount");
        require(reserveB >= amountBOut, "DEX: insufficient TokenB liquidity");

        require(
            IERC20(tokenA).transferFrom(msg.sender, address(this), amountA),
            "DEX: TokenA transferFrom failed"
        );
        require(IERC20(tokenB).transfer(msg.sender, amountBOut), "DEX: TokenB transfer failed");

        reserveA += amountA;
        reserveB -= amountBOut;

        emit SwapAforB(msg.sender, amountA, amountBOut);
    }

    function swapBforA(uint256 amountB) external {
        require(amountB > 0, "DEX: amountB must be > 0");
        require(reserveA > 0 && reserveB > 0, "DEX: pool has no liquidity");

        uint256 amountAOut = getAmountOut(amountB, reserveB, reserveA);
        require(amountAOut > 0,         "DEX: insufficient output amount");
        require(reserveA >= amountAOut, "DEX: insufficient TokenA liquidity");

        require(
            IERC20(tokenB).transferFrom(msg.sender, address(this), amountB),
            "DEX: TokenB transferFrom failed"
        );
        require(IERC20(tokenA).transfer(msg.sender, amountAOut), "DEX: TokenA transfer failed");

        reserveB += amountB;
        reserveA -= amountAOut;

        emit SwapBforA(msg.sender, amountB, amountAOut);
    }

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256) {
        require(amountIn > 0, "DEX: amountIn must be > 0");
        require(reserveIn > 0 && reserveOut > 0, "DEX: invalid reserves");

        return (amountIn * reserveOut) / (reserveIn + amountIn);
    }

    function getReserves() external view returns (uint256 _reserveA, uint256 _reserveB) {
        return (reserveA, reserveB);
    }
}
