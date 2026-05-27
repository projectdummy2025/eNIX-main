// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { CofheTest } from "@cofhe/foundry-plugin/contracts/CofheTest.sol";
import { CofheClient } from "@cofhe/foundry-plugin/contracts/CofheClient.sol";
import { InEuint64 } from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { FhenixYieldVault } from "../src/FhenixYieldVault.sol";

contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient balance");
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        return true;
    }
}

contract FhenixYieldVaultTest is CofheTest {
    FhenixYieldVault public vault;
    MockERC20 public token;
    CofheClient public alice;
    CofheClient public bob;

    uint256 constant ALICE_PKEY = 0xA11CE;
    uint256 constant BOB_PKEY = 0xB0B;

    function setUp() public {
        deployMocks();

        alice = createCofheClient();
        alice.connect(ALICE_PKEY);
        bob = createCofheClient();
        bob.connect(BOB_PKEY);

        token = new MockERC20("Test USD", "tUSD", 6);
        vm.prank(bob.account());
        token.mint(bob.account(), 1000e6);

        vm.prank(bob.account());
        vault = new FhenixYieldVault(IERC20(address(token)));
    }

    function test_Deposit() public {
        uint256 depositAmount = 100e6;

        vm.prank(bob.account());
        token.approve(address(vault), depositAmount);

        InEuint64 memory encrypted = bob.createInEuint64(uint64(depositAmount));

        vm.prank(bob.account());
        vault.deposit(encrypted, depositAmount);

        assertEq(token.balanceOf(address(vault)), depositAmount);
        assertEq(token.balanceOf(bob.account()), 1000e6 - depositAmount);

        expectPlaintext(vault.encryptedBalanceOf(bob.account()), uint64(depositAmount));
    }

    function test_DepositAndWithdraw() public {
        uint256 depositAmount = 100e6;
        uint256 withdrawAmount = 40e6;

        vm.prank(bob.account());
        token.approve(address(vault), depositAmount);

        InEuint64 memory encDeposit = bob.createInEuint64(uint64(depositAmount));
        vm.prank(bob.account());
        vault.deposit(encDeposit, depositAmount);

        InEuint64 memory encWithdraw = bob.createInEuint64(uint64(withdrawAmount));
        vm.prank(bob.account());
        vault.withdraw(encWithdraw, withdrawAmount);

        uint256 remaining = depositAmount - withdrawAmount;
        assertEq(token.balanceOf(address(vault)), remaining);
        expectPlaintext(vault.encryptedBalanceOf(bob.account()), uint64(remaining));
    }

    function test_MultipleDepositors() public {
        uint256 aliceAmount = 200e6;
        uint256 bobAmount = 300e6;

        vm.prank(alice.account());
        token.mint(alice.account(), aliceAmount);
        vm.prank(bob.account());
        token.approve(address(vault), bobAmount);

        InEuint64 memory encBob = bob.createInEuint64(uint64(bobAmount));
        vm.prank(bob.account());
        vault.deposit(encBob, bobAmount);

        vm.prank(alice.account());
        token.approve(address(vault), aliceAmount);

        InEuint64 memory encAlice = alice.createInEuint64(uint64(aliceAmount));
        vm.prank(alice.account());
        vault.deposit(encAlice, aliceAmount);

        assertEq(vault.totalAssets(), aliceAmount + bobAmount);
        expectPlaintext(vault.encryptedBalanceOf(alice.account()), uint64(aliceAmount));
        expectPlaintext(vault.encryptedBalanceOf(bob.account()), uint64(bobAmount));
    }

    function test_DepositYield() public {
        uint256 depositAmount = 100e6;
        uint256 yieldAmount = 10e6;

        vm.prank(bob.account());
        token.approve(address(vault), depositAmount + yieldAmount);

        InEuint64 memory encrypted = bob.createInEuint64(uint64(depositAmount));
        vm.prank(bob.account());
        vault.deposit(encrypted, depositAmount);

        vm.prank(bob.account());
        vault.depositYield(yieldAmount);

        assertEq(vault.yieldAccumulated(), yieldAmount);
        assertEq(vault.totalAssets(), depositAmount + yieldAmount);
    }

    function test_TotalAssets() public {
        assertEq(vault.totalAssets(), 0);

        uint256 depositAmount = 100e6;
        vm.prank(bob.account());
        token.approve(address(vault), depositAmount);

        InEuint64 memory encrypted = bob.createInEuint64(uint64(depositAmount));
        vm.prank(bob.account());
        vault.deposit(encrypted, depositAmount);

        assertEq(vault.totalAssets(), depositAmount);
    }

    function test_EstimatedAPY() public {
        assertEq(vault.estimatedAPY(), 0);

        uint256 depositAmount = 100e6;
        uint256 yieldAmount = 5e6;
        vm.prank(bob.account());
        token.approve(address(vault), depositAmount + yieldAmount);

        InEuint64 memory encrypted = bob.createInEuint64(uint64(depositAmount));
        vm.prank(bob.account());
        vault.deposit(encrypted, depositAmount);

        vm.prank(bob.account());
        vault.depositYield(yieldAmount);

        assertGt(vault.estimatedAPY(), 0);
    }

    function test_RevertWithdrawInsufficientLiquidity() public {
        uint256 depositAmount = 100e6;

        vm.prank(bob.account());
        token.approve(address(vault), depositAmount);

        InEuint64 memory encDeposit = bob.createInEuint64(uint64(depositAmount));
        vm.prank(bob.account());
        vault.deposit(encDeposit, depositAmount);

        InEuint64 memory encWithdraw = bob.createInEuint64(uint64(depositAmount + 1));
        vm.prank(bob.account());
        vm.expectRevert("FhenixYieldVault: insufficient liquidity");
        vault.withdraw(encWithdraw, depositAmount + 1);
    }

    function test_RevertDepositZero() public {
        InEuint64 memory encrypted = bob.createInEuint64(0);
        vm.prank(bob.account());
        vm.expectRevert("FhenixYieldVault: zero amount");
        vault.deposit(encrypted, 0);
    }
}
