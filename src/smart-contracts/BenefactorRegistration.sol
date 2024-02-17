// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Benefactor Registration
 * @dev A smart contract for registering benefactors and managing their beneficiaries.
 */
contract BenefactorRegistration {
    struct Benefactor {
        bool exists;
        address[] beneficiaries;
        mapping(address => bool) isBeneficiary;
    }

    mapping(address => Benefactor) public benefactors;

    /**
     * @dev Emitted when a beneficiary is added to a benefactor's list.
     * @param benefactor The address of the benefactor.
     * @param beneficiary The address of the beneficiary being added.
     */
    event BeneficiaryAdded(address indexed benefactor, address indexed beneficiary);

    /**
     * @dev Emitted when a beneficiary is removed from a benefactor's list.
     * @param benefactor The address of the benefactor.
     * @param beneficiary The address of the beneficiary being removed.
     */
    event BeneficiaryRemoved(address indexed benefactor, address indexed beneficiary);

    /**
     * @dev Registers the caller as a benefactor.
     * Reverts if the caller is already a registered benefactor.
     */
    function registerBenefactor() external {
        require(!benefactors[msg.sender].exists, "Benefactor already registered");
        benefactors[msg.sender].exists = true;
    }

    /**
     * @dev Checks if the caller is a registered benefactor.
     * @return true if the caller is a registered benefactor, false otherwise.
     */
    function isBenefactor() view external returns (bool) {
        return benefactors[msg.sender].exists;
    }

    /**
     * @dev Adds a beneficiary to the caller's list of beneficiaries.
     * Reverts if the caller is not a registered benefactor or if the beneficiary is already added.
     * @param _beneficiary The address of the beneficiary to be added.
     */
    function addBeneficiary(address _beneficiary) external {
        require(benefactors[msg.sender].exists, "Benefactor not registered");
        require(!benefactors[msg.sender].isBeneficiary[_beneficiary], "Beneficiary already added");

        benefactors[msg.sender].beneficiaries.push(_beneficiary);
        benefactors[msg.sender].isBeneficiary[_beneficiary] = true;

        emit BeneficiaryAdded(msg.sender, _beneficiary);
    }

    /**
     * @dev Removes a beneficiary from the caller's list of beneficiaries.
     * Reverts if the caller is not a registered benefactor or if the beneficiary is not found.
     * @param _beneficiary The address of the beneficiary to be removed.
     */
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

    /**
     * @dev Retrieves the list of beneficiaries for a specified benefactor.
     * Reverts if the specified benefactor is not registered.
     * @param _benefactor The address of the benefactor.
     * @return An array of beneficiary addresses.
     */
    function getBeneficiaries(address _benefactor) external view returns (address[] memory) {
        require(benefactors[_benefactor].exists, "Benefactor not registered");
        return benefactors[_benefactor].beneficiaries;
    }

    /**
     * @dev Checks if the caller is a beneficiary of a specified benefactor.
     * @param _benefactor The address of the benefactor.
     * @return true if the caller is a beneficiary of the specified benefactor, false otherwise.
     */
    function isBeneficiary(address _benefactor) external view returns (bool) {
        for (uint256 i = 0; i < benefactors[msg.sender].beneficiaries.length; i++) {
            if (benefactors[_benefactor].beneficiaries[i] == msg.sender){
                return true;
            }
        }
        return false;
    }
}
