// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract TransferFacet {

    /**
     * @notice Transfers ERC20 tokens from caller to recipient.
     * @param tokenAddress The address of the token to transfer.
     * @param recipient The account to transfer tokens to.
     * @param amount The amount of tokens to transfer.
     */
    function transferToken(
        address tokenAddress,
        address recipient,
        uint256 amount
    ) external returns (bool) {

        SafeERC20.safeTransferFrom(IERC20(tokenAddress), msg.sender, recipient, amount);
        return true;
    }
        
    /**
     * @notice Transfers Ether (ETH) from caller to recipient.
     * @param recipient The account to transfer Ether (ETH) to.
     */
    function transferEth(
        address payable recipient
    ) external payable returns (bool sent) {

        (sent, ) = recipient.call{value: msg.value}("");
        require(sent, "TransferFacet: Failed to send Ether");
    }
}