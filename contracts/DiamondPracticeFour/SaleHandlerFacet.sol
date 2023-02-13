// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library SaleHandlerFacetLib {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("saleHandlerFacet.storage");

    struct state {
        uint64 privateSaleStartTime;
        uint64 publicSaleStartTime;
        uint64 privateSaleDuration;
        uint64 publicSaleDuration;
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

    function isPrivateSaleActive() external view returns (bool) {
        state storage s = getState();

        return
            block.timestamp >= s.privateSaleStartTime &&
            block.timestamp < s.privateSaleStartTime + s.privateSaleDuration;
    }

    function isPublicSaleActive() external view returns (bool) {
        state storage s = getState();

        return
            block.timestamp >= s.publicSaleStartTime &&
            block.timestamp < s.publicSaleStartTime + s.publicSaleDuration;
    }
}

import { GlobalState } from '../libraries/GlobalState.sol';

contract SaleHandlerFacet {

    // VARIABLE GETTERS //

    function privateSaleStartTime() external view returns (uint64) {
        return SaleHandlerFacetLib.getState().privateSaleStartTime;
    }

    function publicSaleStartTime() external view returns (uint64) {
        return SaleHandlerFacetLib.getState().publicSaleStartTime;
    }

    function privateSaleDuration() external view returns (uint64) {
        return SaleHandlerFacetLib.getState().privateSaleDuration;
    }

    function publicSaleDuration() external view returns (uint64) {
        return SaleHandlerFacetLib.getState().publicSaleDuration;
    }

    // SETTER FUNCTIONS //

    function setPrivateSaleStartTime(uint64 timestamp) external {
        SaleHandlerFacetLib.getState().privateSaleStartTime = timestamp;
    }

    function setPublicSaleStartTime(uint64 timestamp) external {
        SaleHandlerFacetLib.getState().publicSaleStartTime = timestamp;
    }

    function setPrivateSaleDuration(uint64 duration) external {
        SaleHandlerFacetLib.getState().privateSaleDuration = duration;
    }

    function setPublicSaleDuration(uint64 duration) external {
        SaleHandlerFacetLib.getState().publicSaleDuration = duration;
    }

    // SALE CHECKER FUNCTIONS //

    function isPrivateSaleActive() external view returns (bool) {
        return SaleHandlerFacetLib.isPrivateSaleActive();
    }

    function isPublicSaleActive() external view returns (bool) {
        return SaleHandlerFacetLib.isPublicSaleActive();
    }
}