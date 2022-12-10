// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract PracticeTwo is ERC721A, IERC2981 {
    bool public paused;

    mapping(address => bool) public admins;
    address private royaltyRecipient;

    mapping(uint256 => uint256) private transferCounter;

    uint256 public saleTimestamp;

    uint256 public maxSupply = 1000;
    uint256 private saleLength = 172800;
    uint256 public price = 0.01 ether;
    uint256 public walletCap = 5;

    string private imageBaseUrl = "https://api.images.com/";
    string private animBaseUrl = "https://api.animations.com/";

    constructor() ERC721A("MyToken", "MTK") {
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

    function beginSale() external restricted {
        saleTimestamp = block.timestamp;
    }

    function reserve(uint256 amount) external restricted {
        _mint(msg.sender, amount);
    }

    function withdraw() external restricted {
        payable(msg.sender).transfer(address(this).balance);
    }

    // PUBLIC FUNCTIONS //

    function mint(uint256 amount) external payable {
        require(
            saleTimestamp != 0 &&
            block.timestamp > saleTimestamp &&
            block.timestamp < saleTimestamp + saleLength,
            "Sale is not available now"
        );
        require(_totalMinted() + amount < maxSupply, "Too few tokens remaining");
        require(msg.value == price * amount, "Incorrect amount of Ether sent");
        require(amount + _numberMinted(msg.sender) <= walletCap, "Trying to mint too many tokens");

        _mint(msg.sender, amount);
    }

    function burn(uint256 tokenId) external whenNotPaused {
        _burn(tokenId, true);
    }

    // METADATA & MISC FUNCTIONS //

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        super.tokenURI(tokenId);

        return string(
            abi.encodePacked(
                'data:application/json;utf8,',
                '{"name": "MyToken #', _toString(tokenId), '",',
                '"description": "This is my token. By owning this token, you are automatically cool.",',
                '"created_by": "ktrby",',
                '"image": "', imageBaseUrl, _toString(tokenId), '",',
                '"animation": "', animBaseUrl, _toString(tokenId), '",',
                '"attributes":[',
                    '{"trait_type":"Transfers","value":"', _toString(transferCounter[tokenId]), '"}',
                "]}"
            )
        );
    }

    function royaltyInfo(uint256, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        return (royaltyRecipient, salePrice / 10);
    }

    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal override whenNotPaused {
        super._beforeTokenTransfers(from, to, startTokenId, quantity);

        if (from != address(0)) {

            // transferCounter[startTokenId]++;

            for (uint i = startTokenId; i < startTokenId + quantity; i++) {
                transferCounter[i]++;
            }
        }
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721A, IERC165) returns (bool) {
        bytes4 ID_IERC2981 = 0x2a55205a;

        return
            ERC721A.supportsInterface(interfaceId) ||
            interfaceId == ID_IERC2981;
    }
}