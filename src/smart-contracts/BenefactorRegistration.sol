// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BenefactorRegistration {
    struct Benefactor {
        bool exists;
        address[] beneficiaries;
        mapping(address => bool) isBeneficiary;
    }

    mapping(address => Benefactor) public benefactors;

    event BeneficiaryAdded(address indexed benefactor, address indexed beneficiary);
    event BeneficiaryRemoved(address indexed benefactor, address indexed beneficiary);

    function registerBenefactor() external {
        require(!benefactors[msg.sender].exists, "Benefactor already registered");
        benefactors[msg.sender].exists = true;
    }

    function addBeneficiary(address _beneficiary) external {
        require(benefactors[msg.sender].exists, "Benefactor not registered");
        require(!benefactors[msg.sender].isBeneficiary[_beneficiary], "Beneficiary already added");

        benefactors[msg.sender].beneficiaries.push(_beneficiary);
        benefactors[msg.sender].isBeneficiary[_beneficiary] = true;

        emit BeneficiaryAdded(msg.sender, _beneficiary);
    }

    function removeBeneficiary(address _beneficiary) external {
        require(benefactors[msg.sender].exists, "Benefactor not registered");
        require(benefactors[msg.sender].isBeneficiary[_beneficiary], "Beneficiary not found");

        for (uint256 i = 0; i < benefactors[msg.sender].beneficiaries.length; i++) {
            if (benefactors[msg.sender].beneficiaries[i] == _beneficiary) {
                delete benefactors[msg.sender].beneficiaries[i];
                benefactors[msg.sender].isBeneficiary[_beneficiary] = false;

                emit BeneficiaryRemoved(msg.sender, _beneficiary);
                return;
            }
        }
    }

    function getBeneficiaries(address _benefactor) external view returns (address[] memory) {
        require(benefactors[_benefactor].exists, "Benefactor not registered");
        return benefactors[_benefactor].beneficiaries;
    }
}
