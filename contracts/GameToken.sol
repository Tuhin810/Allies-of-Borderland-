// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GameToken
 * @dev Simple game token contract for purchasing in-game currency with ETH
 */
contract GameToken {
    // Token price: 0.0001 ETH per token
    uint256 public constant TOKEN_PRICE = 0.0001 ether;
    
    // Owner of the contract (can withdraw funds)
    address public owner;
    
    // Mapping to track token balances
    mapping(address => uint256) public tokenBalances;
    
    // Total tokens purchased across all users
    uint256 public totalTokensPurchased;
    
    // Events
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 ethPaid);
    event FundsWithdrawn(address indexed owner, uint256 amount);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Purchase game tokens with ETH
     * @param tokenAmount Number of tokens to purchase
     */
    function purchaseTokens(uint256 tokenAmount) external payable {
        require(tokenAmount > 0, "Token amount must be greater than 0");
        
        uint256 requiredEth = tokenAmount * TOKEN_PRICE;
        require(msg.value >= requiredEth, "Insufficient ETH sent");
        
        // Add tokens to buyer's balance
        tokenBalances[msg.sender] += tokenAmount;
        totalTokensPurchased += tokenAmount;
        
        emit TokensPurchased(msg.sender, tokenAmount, msg.value);
        
        // Refund excess ETH if any
        if (msg.value > requiredEth) {
            uint256 refund = msg.value - requiredEth;
            (bool success, ) = msg.sender.call{value: refund}("");
            require(success, "Refund failed");
        }
    }
    
    /**
     * @dev Get token balance for a specific address
     * @param user Address to check balance for
     * @return Token balance
     */
    function getTokenBalance(address user) external view returns (uint256) {
        return tokenBalances[user];
    }
    
    /**
     * @dev Get contract's ETH balance
     * @return Contract balance in wei
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Owner can withdraw collected ETH
     */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(owner, balance);
    }
    
    /**
     * @dev Transfer ownership to a new address
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner address");
        owner = newOwner;
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}
