// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDiamond } from './core/libs/LibDiamond.sol';
import { IERC165 } from './core/interfaces/IERC165.sol';
import { IDiamondCut } from './core/interfaces/IDiamondCut.sol';
import { IDiamondLoupe } from './core/interfaces/IDiamondLoupe.sol';
import { IERC173 } from './core/interfaces/IERC173.sol';

contract InitDiamond {

    function init() external {

        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        
        // Adding ERC165 data.
        ds.supportedInterfaces[type(IERC165).interfaceId]       = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId]   = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId]       = true;
    }

}