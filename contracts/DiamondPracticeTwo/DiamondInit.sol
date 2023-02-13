// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { CounterFacetLib } from './CounterFacet.sol';

contract DiamondInit {

    // `initCounterFacet` will be called during the diamond cut
    // which adds CounterFacet to the diamond
    function initCounterFacet() external {
        CounterFacetLib.getState().count = 10;
    }

}