import { expect } from "chai";
import { ethers, upgrades} from "hardhat";
import { mine } from "@nomicfoundation/hardhat-network-helpers";
// const { upgrades } = require("hardhat");

describe("NFTDutchAuction_ERC20Bids", function () {
  let nftToken;
  let erc20Token;
  let dutchAuction;

  let auction;


  let initialPrice;
  let bidder;
  let bidderAddress;
  let owner;
  let signer;

  // Constants for testing
  const nftTokenId = 0;
  const reservePrice = 100;
  const numBlocksAuctionOpen = 10;
  const offerPriceDecrement = 10;

  beforeEach(async function () {
    [owner, bidder] = await ethers.getSigners();
    // Deploy the ERC721 token contract
    const NFTToken = await ethers.getContractFactory("YourERC721Token");
    nftToken = await NFTToken.deploy();
    // await nftToken.deployed();

    // Deploy the ERC20 token contract
    const ERC20Token = await ethers.getContractFactory("YourERC20Token");
    erc20Token = await ERC20Token.deploy();
    // await erc20Token.deployed();
    erc20Token = await erc20Token.attach(erc20Token.address);

    // Deploy the DutchAuction contract
    const DutchAuction = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids");
    dutchAuction = await upgrades.deployProxy(DutchAuction, [
      erc20Token.address,
      nftToken.address,
      nftTokenId,
      reservePrice,
      numBlocksAuctionOpen,
      offerPriceDecrement
    ]),{kind: 'uups', initializer: "initialize(address, address, uint256, uint256, uint256, uint256)",timeout:0};
    await dutchAuction.deployed();
  

    // auction = await AuctionProxy.deployed();
    expect(await dutchAuction.getCurrentPrice()).to.equal(190);
    // console.log(await dutchAuction.getCurrentPrice())
  });
  it("should allow a bidder to place a bid with ERC20 tokens", async function () {
    const bidAmount = 10;

    expect(await dutchAuction.getCurrentPrice()).to.equal(190);

    await erc20Token.approve(bidder.address, 1000);


    console.log((await nftToken.mint(owner.address)).value);

    await nftToken.approve(dutchAuction.address, nftTokenId);
    // await nftToken.mint(bidder.address, )

    await erc20Token
    .connect(bidder)
    .approve(dutchAuction.address, 10000);
    await erc20Token.mint(bidder.address, 500);
    
    await erc20Token.mint(owner.address, 200);
    

    let balance = await erc20Token.balanceOf(owner.address);
    await dutchAuction.connect(bidder).bid(200);
    await expect(dutchAuction.connect(bidder).bid(1)).to.be.revertedWith("Auction has already ended")

    expect(await erc20Token.balanceOf(owner.address)).to.equal(
      balance.add(200)
    );
    expect(await nftToken.ownerOf(nftTokenId)).to.equal(bidder.address);
  })
  

  it("should not allow a bidder to place a bid with insufficient ERC20 tokens", async function () {
    expect(await dutchAuction.getCurrentPrice()).to.equal(190);

    // await nftToken.approve(dutchAuction.address, nftTokenId);

    let balance = await erc20Token.balanceOf(owner.address);
    await expect(dutchAuction.connect(bidder).bid(500)).to.be.revertedWith(
      "Bid amount accepted, but bid failed because not enough balance to transfer erc20 token"
    );
  });

  it("should not allow a bidder to place a bid with a low amount", async function () {
    expect(await dutchAuction.getCurrentPrice()).to.equal(190);

    // await nftToken.approve(auction.address, nftTokenId);

    let balance = await erc20Token.balanceOf(owner.address);
    await expect(dutchAuction.connect(bidder).bid(1)).to.be.revertedWith("The bid amount sent is too low");
  });

  it("should not allow a bidder to place a bid when the number of blocks is more than 10 ahead", async function () {
    expect(await dutchAuction.getCurrentPrice()).to.equal(190);

    // await nftToken.approve(dutchAuction.address, nftTokenId);

    await mine(20);

    expect(await dutchAuction.getCurrentPrice()).to.equal(100);

    let balance = await erc20Token.balanceOf(owner.address);
    await expect(dutchAuction.connect(bidder).bid(1)).to.be.revertedWith("Auction Ended");
  });
  
});
