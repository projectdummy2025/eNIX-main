// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { FhenixYieldVault } from "../src/FhenixYieldVault.sol";

address constant USDC = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
address constant RLC = 0x9923eD3cbd90CD78b910c475f9A731A6e0b8C963;

contract DeployFhenixVaults is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        FhenixYieldVault usdcVault = new FhenixYieldVault(IERC20(USDC));
        console.log("fUSDC Vault deployed at:", address(usdcVault));

        FhenixYieldVault rlcVault = new FhenixYieldVault(IERC20(RLC));
        console.log("fRLC Vault deployed at:", address(rlcVault));

        vm.stopBroadcast();
    }
}
