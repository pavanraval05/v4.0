// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
//import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
//import "@openzeppelin/contracts-upgradeable/proxy/ERC1967/UUPSUpgradeable.sol";
//import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

//pragma solidity 0.8.18;

//import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
//import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
//import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
//import "@openzeppelin/contracts/security/Pausable.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";
//import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
//import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract YourERC721Token is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("YourERC721Token", "PAV") {}

    function mint(address recipient, string memory tokenString) public returns (uint256) {
        uint256 newTokenId = _tokenIdCounter.current();
        _mint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenString);
        _tokenIdCounter.increment();
        return newTokenId;
    }
}

contract YourERC20Token is ERC20 {
    constructor() ERC20("Dutch Auction fungibleToken", "PAV20") {
        _mint(msg.sender, 1000000);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}

contract NFTDutchAuction_ERC20Bids is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    //address private owner;
    IERC721 public nfterc721Reference;
    IERC20 public erc20TokenReference;
    uint256 public nftTokenId;
    uint256 public reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public offerPriceDecrement;
    uint256 public startAtBlockNumber;
    uint256 public endsAtBlockNumber;
    uint256 public initialPrice;
    uint256 public finalPrice;
    mapping(address => uint256) public bidderTokens;
    address[] public bidders;
    uint256 public totalBidTokens;
    bool public auctionEnded;
    string public upgradeNumber;

    function initialize(
        address erc20TokenAddress,
        address erc721TokenAddress,
        uint256 _nftTokenId,
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();

        _transferOwnership(msg.sender);
        nfterc721Reference = IERC721(erc721TokenAddress);
        erc20TokenReference = IERC20(erc20TokenAddress);
        nftTokenId = _nftTokenId;
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;

        startAtBlockNumber = block.number;
        endsAtBlockNumber = startAtBlockNumber + numBlocksAuctionOpen;
        initialPrice = reservePrice + (numBlocksAuctionOpen * offerPriceDecrement - 1);
        auctionEnded = false;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function getCurrentPrice() public view returns (uint256) {
        uint256 blocks = block.number - startAtBlockNumber;
        if (blocks >= numBlocksAuctionOpen) {
            return reservePrice;
        } else {
            return initialPrice - (blocks * offerPriceDecrement);
        }
    }

    function bid(uint256 bidAmount) external returns (address) {
        require(!auctionEnded, "Auction has already ended");
        if ((block.number - startAtBlockNumber) > numBlocksAuctionOpen) {
            auctionEnded = true;
        }

        require((block.number - startAtBlockNumber) <= numBlocksAuctionOpen, "Auction Ended");

        uint256 blocks = block.number - startAtBlockNumber;
        uint256 currentPrice = initialPrice - (blocks * offerPriceDecrement - 1);

        require(bidAmount >= currentPrice, "The bid amount sent is too low");

        require(
            bidAmount <= erc20TokenReference.allowance(owner(), address(this)),
            "Bid amount accepted, but bid failed because not enough balance to transfer erc20 token"
        );

        nfterc721Reference.transferFrom(owner(), msg.sender, nftTokenId);
        erc20TokenReference.transferFrom(msg.sender, owner(), bidAmount);
        auctionEnded = true;
        return msg.sender;
    }
}

