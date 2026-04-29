// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TokenA {
    string public name     = "Token A";
    string public symbol   = "TKA";
    uint8  public decimals = 18;

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 initialSupply) {
        totalSupply           = initialSupply;
        balanceOf[msg.sender] = initialSupply;
        emit Transfer(address(0), msg.sender, initialSupply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(to != address(0),              "TokenA: transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "TokenA: insufficient balance");

        balanceOf[msg.sender] -= amount;
        balanceOf[to]         += amount;

        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "TokenA: approve to zero address");

        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(to != address(0),                          "TokenA: transfer to zero address");
        require(balanceOf[from] >= amount,                 "TokenA: insufficient balance");
        require(allowance[from][msg.sender] >= amount,     "TokenA: insufficient allowance");

        allowance[from][msg.sender] -= amount;
        balanceOf[from]             -= amount;
        balanceOf[to]               += amount;

        emit Transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external {
        require(to != address(0), "TokenA: mint to zero address");

        totalSupply   += amount;
        balanceOf[to] += amount;

        emit Transfer(address(0), to, amount);
    }
}
