// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract PracticeOne is ERC721, IERC2981 {
    bool public paused;

    mapping(address => bool) public admins;
    address private royaltyRecipient;

    mapping(address => bool) public allowlist;
    mapping(address => uint256) public numberMinted;

    uint256 private idIndex;
    uint256 public totalSupply;
    uint256 public saleTimestamp;

    uint256 public maxSupply = 1000;
    uint256[] private saleLength = [86400, 172800];
    uint256[] public price = [0.01 ether, 0.03 ether];
    uint256[] public walletCap = [2, 5];

    constructor() ERC721("MyToken", "MTK") {
        admins[msg.sender] = true;
        royaltyRecipient = msg.sender;
    }

    modifier restricted() {
        require(admins[msg.sender], "Caller is not admin");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is currently paused");
        _;
    }

    // ADMIN FUNCTIONS //

    function togglePause() external restricted {
        paused = !paused;
    }

    function toggleAdmins(address account) external restricted {
        admins[account] = !admins[account];
    }

    function toggleAllowlist(address[] calldata accounts) external restricted {
        for (uint256 i = 0; i < accounts.length; i++) {
            allowlist[accounts[i]] = !allowlist[accounts[i]];
        }
    }

    function beginSale() external restricted {
        saleTimestamp = block.timestamp;
    }

    function reserve(uint256 amount) external restricted {
        mintMultiple(msg.sender, amount);
    }

    // PUBLIC FUNCTIONS //

    function mint(uint256 amount) external payable whenNotPaused {
        require(
            // sale timestamp must not be 0
            saleTimestamp != 0 &&
            // sale timestamp must be in the past
            block.timestamp > saleTimestamp &&
            // sales have not concluded
            block.timestamp < saleTimestamp + saleLength[0] + saleLength[1],
            "Sale is not available now"
        );
        require(totalSupply + amount <= maxSupply, "Too few tokens remaining");
        
        if (block.timestamp < saleTimestamp + saleLength[0]) {
            require(allowlist[msg.sender], "You are not on the allowlist");
            require(msg.value == price[0] * amount, "Incorrect amount of Ether sent");
            require(amount + numberMinted[msg.sender] <= walletCap[0], "Trying to mint too many tokens");
        } else {
            require(msg.value == price[1] * amount, "Incorrect amount of Ether sent");
            require(amount + numberMinted[msg.sender] <= walletCap[1], "Trying to mint too many tokens");
        }

        numberMinted[msg.sender] += amount;

        mintMultiple(msg.sender, amount);
    }

    function burn(uint256 tokenId) external whenNotPaused {
        totalSupply--;
        _burn(tokenId);
    }

    // METADATA & MISC FUNCTIONS //

    function mintMultiple(address recipient, uint256 amount) internal {
        totalSupply += amount;
        
        for (uint256 i = 0; i < amount; i++) {
            _mint(recipient, idIndex);
            idIndex++;
        }
    }

    function _baseURI() internal view override returns (string memory) {
        // 1 day == 86400 seconds
        uint256 r = block.timestamp % (86400 * 3);
        
        if (r < 86400) {
            return "https://api.dayone.com/";
        } else if (r > 86400 && r <= 172800) {
            return "https://api.daytwo.com/";
        } else {
            return "https://api.daythree.com/";
        }
    }

    function royaltyInfo(uint256, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        return (royaltyRecipient, salePrice / 10);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override whenNotPaused {}

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, IERC165) returns (bool) {
        bytes4 ID_IERC2981 = 0x2a55205a;

        return
            ERC721.supportsInterface(interfaceId) ||
            interfaceId == ID_IERC2981;
    }
}