//written by group members
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title BenefactorsDeadManSwitch
 * @dev Smart contract for managing a benefactor's dead man's switch with assigned beneficiaries.
 */
contract BenefactorsDeadManSwitch {
    address public benefactor; // stores the benefactor's address

    struct BeneficiaryInfo {
        bool exists;
        string[] ipfsCIDs; // array to store IPFS CIDs
    }

    /**
     * @dev Modifier to check if the caller is the benefactor.
     */
    modifier onlyBenefactor() {
        require(msg.sender == benefactor && isAlive == true, "Not the benefactor");
        _;
    }

    mapping(address => BeneficiaryInfo) private beneficiaries; // stores the list of beneficiaries assigned by the benefactor
    uint256 public countdownDuration; // stores the countdown duration
    uint256 public lastBenefactorResponseTime; // stores the benefactor's last response time to check with current time and countdown
    bool public isSwitchedOff; // stores the status of the dead man's switch
    bool public isAlive;

    event DeadMansSwitchEnabled(address indexed beneficiary, uint256 countdownDuration); // which beneficiary triggered the switch and started the countdown
    event DeadMansSwitchDisabled(address indexed benefactor, uint256 responseTime); // emits info about the current time when the benefactor responded
    event BeneficiaryAdded(address indexed beneficiary, string[] ipfsCIDs); // emits info about a beneficiary being added
    event BeneficiaryRemoved(address indexed beneficiary); // emits info about a beneficiary being removed
    event SwitchAlreadyOff(address indexed caller); // emits info when someone tries to disable the switch which is already off
    event SwitchAlreadyOn(address indexed caller); // emits info when someone tries to enable the switch which is already on
    event remainingCountdownInfo(uint256 countdownDuration, uint256 responseTime, uint256 currentTime, uint256 lastBenefactorResponseTime);
    event BenefactorIsAlive(address indexed benefactor, string aliveStatus);
    event BenefactorIsDead(address indexed benefactor, string deadStatus);
    event IpfsCIDAdded(address indexed beneficiary, string ipfsCID);
    event IpfsCIDRemoved(address indexed beneficiary, string ipfsCID);

    /**
     * @dev Modifier to check if the caller is a beneficiary.
     */
    modifier onlyBeneficiary() {
        require(beneficiaries[msg.sender].exists, "Not a beneficiary");
        _;
    }

    /**
     * @dev Modifier to check if the caller is a beneficiary and is called when the benefactor is dead
     */
    modifier onlyPostHumoAccess(){
        require(beneficiaries[msg.sender].exists && isAlive == false,"No access to CIDs");
        _;
    }

    /**
     * @dev Constructor to initialize the BenefactorsDeadManSwitch contract.
     */
    constructor() {
        benefactor = msg.sender;
        countdownDuration = 7*24*3600 seconds; // countdown duration set to 1 week
        // countdownDuration= 1 minutes; // for testing purposes
        isSwitchedOff = true;
        isAlive = true;
        lastBenefactorResponseTime = 0;
    }

    //create a function that onlyBenefactor can access that creates the mapping of the beneficiaries to the CIDS
    //another function that adds cids to the mapping
    //the mapping maps the address of the beneficiaries to the cids assigned to them

    /**
     * @dev Checks if the given address is a beneficiary. Only benefactor
     * @param _address The address to check.
     * @return A boolean indicating whether the address is a beneficiary.
     */
    function isBeneficiary(address _address) public view returns (bool) {
        return beneficiaries[_address].exists;
    }

    /**
     * @dev Removes a beneficiary from the list. Only callable by the benefactor.
     * @param _beneficiary The address of the beneficiary to be removed.
     */
    function removeBeneficiary(address _beneficiary) external onlyBenefactor {
        require(isBeneficiary(_beneficiary), "Beneficiary not found");
        delete beneficiaries[_beneficiary];
        emit BeneficiaryRemoved(_beneficiary);
    }

    /**
     * @dev Adds a new beneficiary to the list. Only callable by the benefactor.
     * @param _beneficiary The address of the new beneficiary.
     * @param _ipfsCIDs An array of IPFS CIDs associated with the new beneficiary.
     */
    function addBeneficiary(address _beneficiary, string[] memory _ipfsCIDs) external onlyBenefactor {
        require(!isBeneficiary(_beneficiary), "Beneficiary already exists");
        beneficiaries[_beneficiary] = BeneficiaryInfo(true, _ipfsCIDs);
        emit BeneficiaryAdded(_beneficiary, _ipfsCIDs);
    }

    /**
     * @dev Adds an IPFS CID to the specified beneficiary. Only callable by the benefactor.
     * @param _beneficiary The address of the beneficiary.
     * @param _ipfsCID The IPFS CID to add.
     */
    function addIpfsCID(address _beneficiary, string memory _ipfsCID) external onlyBenefactor {
        require(isBeneficiary(_beneficiary), "Beneficiary not found");
        string[] storage ipfsCIDs = beneficiaries[_beneficiary].ipfsCIDs;
        //check if cid already exists
        for (uint256 i = 0; i < ipfsCIDs.length; i++) {
            require(keccak256(abi.encodePacked(ipfsCIDs[i])) != keccak256(abi.encodePacked(_ipfsCID)), "CID already assigned to this beneficiary");
        }
        //if CID doesn't exist, append it to the list
        beneficiaries[_beneficiary].ipfsCIDs.push(_ipfsCID);
        emit IpfsCIDAdded(_beneficiary, _ipfsCID);
    }

    /**
     * @dev Removes an IPFS CID from the specified beneficiary. Only callable by benefactor.
     * @param _beneficiary The address of the beneficiary.
     * @param _ipfsCID The IPFS CID to remove.
     */
    function removeIpfsCID(address _beneficiary, string memory _ipfsCID) external onlyBenefactor {
        require(isBeneficiary(_beneficiary), "Beneficiary not found");

        string[] storage ipfsCIDs = beneficiaries[_beneficiary].ipfsCIDs;
        
        // check if the CID exists
        for (uint256 i = 0; i < ipfsCIDs.length; i++) {
            if (keccak256(abi.encodePacked(ipfsCIDs[i])) == keccak256(abi.encodePacked(_ipfsCID))) {
                for (uint256 j = i; j < ipfsCIDs.length - 1; j++) {
                    ipfsCIDs[j] = ipfsCIDs[j + 1];
                }
                ipfsCIDs.pop();
                emit IpfsCIDRemoved(_beneficiary, _ipfsCID);
                return;
            }
        }
        // CID not found in the array
        revert("CID not assigned to this beneficiary");
    }

    /**
     * @dev Enables the dead man's switch. Only callable by beneficiaries.
     */
    function enableSwitch() external onlyBeneficiary {
        if (!isSwitchedOff) {
            emit SwitchAlreadyOn(msg.sender);
            return;
        }
        isSwitchedOff = false; // switch is on
        // countdown starts
        lastBenefactorResponseTime = block.timestamp; //setting last response time as current time, this shows that countdown starts at this moment when the switch is enabled
        emit DeadMansSwitchEnabled(msg.sender, countdownDuration);
    }

    /**
     * @dev Returns the remaining countdown time.
     * @return The remaining countdown time in seconds.
     */
    function getRemainingCountdownTime() public returns (uint256) {
        uint256 responseTime = block.timestamp - lastBenefactorResponseTime;
        emit remainingCountdownInfo(countdownDuration, responseTime, block.timestamp, lastBenefactorResponseTime);
        return (responseTime > countdownDuration) ? 0 : countdownDuration - responseTime;
    }

    /**
     * @dev Checks the alive status of the benefactor.
     * @return A boolean indicating whether the benefactor is alive.
     */
    function checkAliveStatus() public returns (bool) {
        if (lastBenefactorResponseTime != 0) {
            uint256 remainingCountdown = getRemainingCountdownTime();
            if (remainingCountdown == 0) {
                isAlive = false;
            }
        }
        return isAlive;
    }

    /**
     * @dev Performs actions based on benefactor's activity when responding to an enabled switch. Only callable by the benefactor.
     */
    function respondToSwitch() external onlyBenefactor {
        if (lastBenefactorResponseTime != 0) {
            if (checkAliveStatus()) {
                emit BenefactorIsAlive(benefactor,"Benefactor is alive");
                disableSwitch();
                lastBenefactorResponseTime = block.timestamp;
            } else {
                emit BenefactorIsDead(benefactor,"Benefactor is dead");
            }
        } else {
            emit BenefactorIsAlive(benefactor,"Benefactor is alive");
            disableSwitch();
            lastBenefactorResponseTime = block.timestamp;
        }
    }

    /**
     * @dev Disables the dead man's switch. Only callable by the benefactor.
     */
    function disableSwitch() internal onlyBenefactor {
        if (isSwitchedOff) {
            emit SwitchAlreadyOff(msg.sender);
            return;
        }
        isSwitchedOff = true;
        emit DeadMansSwitchDisabled(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Release CIDs to beneficiary.
     */
    function getCIDs(address _beneficiary) public view onlyPostHumoAccess returns (string[] memory){
        require(isBeneficiary(_beneficiary),"Beneficiary not found");
        return beneficiaries[_beneficiary].ipfsCIDs;
    }
}