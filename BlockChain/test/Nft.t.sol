// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Nft.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NftTest is Test{
    Nft nft;
    address user = 0x9CF6cb8A7c3B9B07564BAB8bC612785792e1FB82;
    address owner = 0x204E8DEf7E6c467cEbCeBbC5c89ad86Bf3003FE3;

    function setUp() public {
        nft = new Nft(owner);
        vm.deal(user, 100 ether);
        vm.deal(owner, 100 ether);
    }
    function test_initialOwner() public view {
        console.log("Initial Owner:", nft.initialOwner());
        assertEq(nft.initialOwner(), owner, "Initial owner should be the owner");
    }

    function test_mint() public {
        vm.prank(owner);
        uint tokenId = nft.mint(user, "https://www.google.com", 10 ether);
        assertEq(tokenId, 1);
        assertEq(nft.balanceOf(user), 1);
        assertEq(nft.ownerOf(tokenId), user, "User should be the owner of the token");
        assertEq(nft.tokenURI(tokenId), "https://www.google.com", "Token URI should be the same as the one set");
        assertEq(nft.getTokenAmount(tokenId), 10 ether, "Token amount should be the same as the one set");
    }

    function test_RevertWhen_MintCalledByNonOwner() public{
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        nft.mint(user, "https://www.google.com", 10 ether);
    }

    function test_approvalNFT() public {
        // First mint the NFT to user
        vm.startPrank(owner);
        uint tokenId = nft.mint(user, "https://www.google.com", 10 ether);
        vm.stopPrank();

        // Now approve as user since they own the NFT
        vm.prank(user);
        nft.approvalNFT(tokenId);

        assertEq(nft.getApproved(tokenId), address(nft), "NFT should be approved");
    }

    function test_transferNFT() public {
        // First mint the NFT to user
        vm.startPrank(owner);
        uint tokenId = nft.mint(user, "https://www.google.com", 10 ether);
        vm.stopPrank();

        // Approve as user
        vm.prank(user);
        nft.approvalNFT(tokenId);

        // Now transfer as owner with payment
        vm.prank(owner);
        nft.transferNFT{value: 10 ether}(user, owner, tokenId);

        assertEq(nft.ownerOf(tokenId), owner, "NFT should be transferred to owner");
    }
}
