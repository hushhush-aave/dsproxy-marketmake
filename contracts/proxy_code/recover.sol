// Approve and stake solidity

// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;
interface MINIERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
}
contract ProxyRec { //Within this, we have the message sender!
    function recover(address _erc20, uint _amount) public {
        require(MINIERC20(_erc20).transfer(msg.sender, _amount));
    }
    function recover() public{
        msg.sender.transfer(address(this).balance);
    }
}