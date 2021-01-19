// Approve and stake solidity

// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

interface MINIERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract MultiSwap {

    // destReceiver can be used if it is not the seller who should send
    function swapEth(bytes calldata oneinchdata) public payable {
        address inch = address(0x111111125434b319222CdBf8C261674aDB56F3ae);
        (bool success, ) = inch.call{value: msg.value}(oneinchdata);
        require(success, "1inch call failed");
    }

    function swapEthToMul(uint256[] calldata _ethAmounts, bytes[] calldata _oneinchdatas) public payable {
        require(_ethAmounts.length == _oneinchdatas.length, "Invalid lengths");
        require(msg.value > 0, "No ether transfered");
        address inch = address(0x111111125434b319222CdBf8C261674aDB56F3ae);
        for(uint8 i = 0; i < _ethAmounts.length; i++){
            (bool success, ) = inch.call{value: _ethAmounts[i]}(_oneinchdatas[i]);
            require(success, "1inch call failed");
        }
    }
    
}