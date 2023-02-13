// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library TokenFacetLib {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("tokenFacet.storage");

    struct state {
        mapping(uint256 => uint256) transferCount;
    }

    /**
    * @dev Return stored state struct.
    */
    function getState() internal pure returns (state storage _state) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            _state.slot := position
        }
    }
}

import 'erc721a-upgradeable/contracts/ERC721AUpgradeable.sol';
import { GlobalState } from '../libraries/GlobalState.sol';

contract TokenFacet is ERC721AUpgradeable {
    function mint(uint256 amount) external payable {
        require(amount < 10, "TokenFacet: cannot mint more than 10 tokens");
        require(msg.value == amount * 0.01 ether, "TokenFacet: incorrect amount of Ether sent");

        _mint(msg.sender, amount);
    }

    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal override {
        // calling the parent contract's implementation
        // of this function silences errors from the
        // compiler
        super._beforeTokenTransfers(from, to, startTokenId, quantity);

        // instantiating the state struct as a variable
        // called `s` so that we can manipulate state
        // variables
        TokenFacetLib.state storage s = TokenFacetLib.getState();

        // ERC721A supports transfer of multiple tokens
        // in a single transaction, so we need to loop
        // through the tokens which are being transferred
        // and increment the transferCount for each
        for (uint256 i = startTokenId; i < quantity; i++) {
            s.transferCount[i]++;
        }
    }

    function checkTransferCount(uint256 tokenId) external view returns (uint256) {
        return TokenFacetLib.getState().transferCount[tokenId];
    }

    function withdrawFunds() external payable {
        require(GlobalState.isAdmin(msg.sender), "TokenFacet: only admins may withdraw funds");
        (bool sent, ) = msg.sender.call{ value: address(this).balance }('');
        require(sent, "TokenFacet: failed to withdraw funds");
    }
}