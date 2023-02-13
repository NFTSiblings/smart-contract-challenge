// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library CounterFacetLib {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("counterFacet.storage");

    struct state {
        uint256 count;
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

contract CounterFacet {
    function count() external view returns (uint256) {
        // return the stored `count` variable from
        // diamond storage
        return CounterFacetLib.getState().count;
    }
    
    function increment() external {
        // create a temporary variable called `s` which
        // stores the `state` struct
        CounterFacetLib.state storage s = CounterFacetLib.getState();

        // increment the `count` variable within the
        // state struct
        s.count++;
    }

    function decrement() external {
        // directly decrement the `count` variable
        CounterFacetLib.getState().count--;
    }
}