const {expect} = require("chai");
const {mine} = require("@nomicfoundation/hardhat-network-helpers")

describe("NFTDutchAuction_ERC20Bids", function () {
  let auction;
  let erc20Token;
  let nfterc721Reference;
  let nftTokenId;
  let reservePrice;
  let numBlocksAuctionOpen;
  let offerPriceDecrement;
  let initialPrice;
  let bidder;
  let bidderAddress;
  let owner;
  let signer;

  beforeEach(async () => {
    [owner, bidder] = await ethers.getSigners();
    // Deploy ERC721 Token Contract
    const YourERC721Token = await ethers.getContractFactory("YourERC721Token");
    nfterc721Reference = await YourERC721Token.deploy();
    let tmpTokenID = await nfterc721Reference.mint(owner.address, "TokenNFT");
    
    
    // Deploy ERC20 Token Contract
    const YourERC20Token = await ethers.getContractFactory("YourERC20Token");
    erc20Token = await YourERC20Token.deploy();
    await erc20Token.mint(bidder.address, 1000);
    

    // Set the required variables
    nftTokenId = 0;
    reservePrice = 10;
    numBlocksAuctionOpen = 10;
    offerPriceDecrement = 1;
    initialPrice = reservePrice + numBlocksAuctionOpen * offerPriceDecrement;

    // Deploy Auction Contract
    const Auction = await ethers.getContractFactory("NFTDutchAuction_ERC20Bids");
    auction = await Auction.deploy(
      erc20Token.address,
      nfterc721Reference.address,
      nftTokenId,
      reservePrice,
      numBlocksAuctionOpen,
      offerPriceDecrement
    );

    
  });

  it("should allow a bidder to place a bid with ERC20 tokens", async function () {
    const bidAmount = 10;

    expect(await auction.getCurrentPrice()).to.equal(
      19
    );

    await erc20Token.approve(bidder.address, 1000);

    await nfterc721Reference.approve(auction.address, nftTokenId);

    await erc20Token
    .connect(bidder)
    .approve(auction.address, 10000);
    await erc20Token.mint(bidder.address, 100);
    await nfterc721Reference.mint(owner.address, "TokenNFT");
    

    let balance = await erc20Token.balanceOf(owner.address);
    await auction.connect(bidder).bid(100);
    await expect(auction.connect(bidder).bid(1)).to.be.revertedWith("Auction has already ended")

    expect(await erc20Token.balanceOf(owner.address)).to.equal(
      balance.add(100)
    );
  });


  it("should not allow a bidder to place a bid with insufficient ERC20 tokens", async function () {
    expect(await auction.getCurrentPrice()).to.equal(
      19
    );


    await nfterc721Reference.approve(auction.address, nftTokenId);

    

    let balance = await erc20Token.balanceOf(owner.address);
    await expect(auction.connect(bidder).bid(100)).to.be.revertedWith("Bid amount accepted, but bid failed because not enough balance to transfer erc20 token");
   
  });

  it("should not allow a bidder to place a bid with low amount", async function () {
    expect(await auction.getCurrentPrice()).to.equal(
      19
    );


    await nfterc721Reference.approve(auction.address, nftTokenId);

  
    

    let balance = await erc20Token.balanceOf(owner.address);
    await expect(auction.connect(bidder).bid(1)).to.be.revertedWith("The bid amount sent is too low");
   
  });

  it("should not allow a bidder to place a bid when the number of blocks is more than 10 ahead", async function () {
    expect(await auction.getCurrentPrice()).to.equal(
      19
    );

    

    await nfterc721Reference.approve(auction.address, nftTokenId);

    mine(20);

    expect(await auction.getCurrentPrice()).to.equal(
      10
    );

    let balance = await erc20Token.balanceOf(owner.address);
    await expect(auction.connect(bidder).bid(1)).to.be.revertedWith("Auction Ended");
    
  });

 
});
