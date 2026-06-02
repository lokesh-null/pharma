// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title PharmaLyncToken
 * @dev ERC20 token for the PharmaLync ecosystem.
 * Includes burnable, ownable, and permit (gasless approvals) functionality.
 */
contract PharmaLyncToken is ERC20, ERC20Burnable, Ownable, ERC20Permit {
    constructor(address initialOwner)
        ERC20("PharmaLync Token", "PLT")
        Ownable(initialOwner)
        ERC20Permit("PharmaLync Token")
    {
        // Mint 10 million tokens to the initial owner
        _mint(initialOwner, 10000000 * 10 ** decimals());
    }

    /**
     * @dev Function to mint new tokens. Only the owner can mint.
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
