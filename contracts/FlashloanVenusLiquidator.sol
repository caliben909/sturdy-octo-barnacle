// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Interfaces.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract FlashloanVenusLiquidator is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    mapping(address => bool) public authorizedFlashloanProviders;

    event LiquidationExecuted(address indexed borrower, address vTokenBorrow, address vTokenCollateral, uint repayAmount, uint profit);

    constructor(address[] memory providers) {
        for (uint i = 0; i < providers.length; i++) {
            authorizedFlashloanProviders[providers[i]] = true;
        }
    }

    function addFlashloanProvider(address provider) external onlyOwner {
        authorizedFlashloanProviders[provider] = true;
    }

    function removeFlashloanProvider(address provider) external onlyOwner {
        authorizedFlashloanProviders[provider] = false;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }


    // Generic entrypoint for flash providers to call after transferring funds.
    // `data` must encode: (borrower, vTokenBorrow, vTokenCollateral, underlyingToken, minOut)
    function receiveFlashLoan(address token, uint amount, uint fee, bytes calldata data) external whenNotPaused nonReentrant {
        require(authorizedFlashloanProviders[msg.sender], "Unauthorized flashloan provider");

        (address borrower, address vTokenBorrow, address vTokenCollateral, address underlying, uint minOut) = abi.decode(data, (address, address, address, address, uint));

        // Approve vTokenBorrow to pull repay amount
        IERC20(token).approve(vTokenBorrow, amount);

        // Execute liquidation on Venus vToken (vTokenBorrow is the vToken representing the borrowed asset)
        IVToken(vTokenBorrow).liquidateBorrow(borrower, amount, vTokenCollateral);

        // Redeem the seized vTokens for underlying
        uint seizedVTokens = IVToken(vTokenCollateral).balanceOf(address(this));
        if (seizedVTokens > 0) {
            IVToken(vTokenCollateral).redeem(seizedVTokens);
        }

        // Assume underlying == token for simplicity; in production, add swap logic if needed
        require(underlying == token, "Underlying token mismatch - swap not implemented");

        // Compute repay and allow provider to pull funds back
        uint repayAmount = amount + fee;
        require(IERC20(token).balanceOf(address(this)) >= repayAmount, "Insufficient balance to repay");
        IERC20(token).approve(msg.sender, repayAmount);

        // Profit calculation
        uint profit = IERC20(token).balanceOf(address(this)) - repayAmount;
        emit LiquidationExecuted(borrower, vTokenBorrow, vTokenCollateral, amount, profit);
    }

    // Owner withdrawal for any ERC20 profit
    function withdraw(address token) external onlyOwner {
        uint bal = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner, bal);
    }

    // Emergency withdraw native BNB
    function withdrawBNB() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}
