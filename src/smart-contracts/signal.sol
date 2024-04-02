// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CommunicationContract {
    event MessageSent(address indexed sender, string message);

    function sendMessage(string memory message) public {
        emit MessageSent(msg.sender, message);
    }
}