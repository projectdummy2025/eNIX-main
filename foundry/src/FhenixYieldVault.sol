// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { FHE, euint64, InEuint64 } from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FhenixYieldVault {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;
    address public owner;
    uint256 public yieldAccumulated;

    mapping(address => euint64) private _encryptedBalances;

    event Deposited(address indexed user, uint256 plaintextAmount);
    event Withdrawn(address indexed user, uint256 plaintextAmount);
    event YieldDeposited(address indexed by, uint256 amount);

    constructor(IERC20 _asset) {
        asset = _asset;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "FhenixYieldVault: only owner");
        _;
    }

    function totalAssets() public view returns (uint256) {
        return asset.balanceOf(address(this));
    }

    function deposit(InEuint64 calldata encryptedAmount, uint256 plaintextAmount) external {
        require(plaintextAmount > 0, "FhenixYieldVault: zero amount");
        asset.safeTransferFrom(msg.sender, address(this), plaintextAmount);

        euint64 amount = FHE.asEuint64(encryptedAmount);
        _encryptedBalances[msg.sender] = FHE.add(_encryptedBalances[msg.sender], amount);

        FHE.allowThis(_encryptedBalances[msg.sender]);
        FHE.allowSender(_encryptedBalances[msg.sender]);

        emit Deposited(msg.sender, plaintextAmount);
    }

    function encryptedBalanceOf(address user) external view returns (euint64) {
        return _encryptedBalances[user];
    }

    function withdraw(InEuint64 calldata encryptedAmount, uint256 plaintextAmount) external {
        require(plaintextAmount > 0, "FhenixYieldVault: zero amount");
        require(
            asset.balanceOf(address(this)) >= plaintextAmount,
            "FhenixYieldVault: insufficient liquidity"
        );

        euint64 amount = FHE.asEuint64(encryptedAmount);
        _encryptedBalances[msg.sender] = FHE.sub(_encryptedBalances[msg.sender], amount);

        FHE.allowThis(_encryptedBalances[msg.sender]);
        FHE.allowSender(_encryptedBalances[msg.sender]);

        asset.safeTransfer(msg.sender, plaintextAmount);

        emit Withdrawn(msg.sender, plaintextAmount);
    }

    function depositYield(uint256 amount) external onlyOwner {
        asset.safeTransferFrom(msg.sender, address(this), amount);
        yieldAccumulated += amount;
        emit YieldDeposited(msg.sender, amount);
    }

    function estimatedAPY() external view returns (uint256) {
        uint256 tvl = totalAssets();
        if (tvl == 0 || yieldAccumulated == 0) return 0;
        return (yieldAccumulated * 1e18 * 365 days) / (tvl * 30 days);
    }
}
