//written by group members
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BenefactorsDeadManSwitch {

    struct Beneficiary {
        bool exists;
        string[] ipfsCIDs;
        string benefactorPublicKey;
        string beneficiaryPublicKey;
    }

    struct BenefactorInfo {
        bool exists;
        mapping(address => Beneficiary) beneficiaries;
        address[] beneficiaryAddresses;
        uint256 countdownDuration;
        uint256 lastBenefactorResponseTime;
        bool isSwitchedOff;
        bool isAlive;
    }

    mapping(address => BenefactorInfo) private benefactors;

    event DeadMansSwitchEnabled(address indexed benefactor, address indexed beneficiary, uint256 countdownDuration);
    event DeadMansSwitchDisabled(address indexed benefactor, address indexed caller, uint256 responseTime);
    event BeneficiaryAdded(address indexed benefactor, address indexed beneficiary);
    event BeneficiaryRemoved(address indexed benefactor, address indexed beneficiary);
    event SwitchAlreadyOff(address indexed benefactor, address indexed caller);
    event SwitchAlreadyOn(address indexed benefactor, address indexed caller);
    event RemainingCountdownInfo(address indexed benefactor, uint256 countdownDuration, uint256 responseTime, uint256 currentTime, uint256 lastBenefactorResponseTime);
    event BenefactorIsAlive(address indexed benefactor, string aliveStatus);
    event BenefactorIsDead(address indexed benefactor, string deadStatus);
    event IpfsCIDAdded(address indexed benefactor, address indexed beneficiary, string ipfsCID);
    event IpfsCIDRemoved(address indexed benefactor, address indexed beneficiary, string ipfsCID);
    event BenefactorKeyAdded(address indexed benefactor, address indexed beneficiary, string key);
    event BeneficiaryKeyAdded(address indexed benefactor, address indexed beneficiary, string key);

    modifier onlyBenefactor() {
        require(benefactors[msg.sender].exists && benefactors[msg.sender].isAlive, "Not a valid benefactor");
        _;
    }


    constructor() {}

    function setBenefactor() public {
        require(!benefactors[msg.sender].exists,"benefactor already exists");
        BenefactorInfo storage newBenefactor = benefactors[msg.sender];
        newBenefactor.exists = true;
        newBenefactor.countdownDuration = 7*24*3600 seconds;
        newBenefactor.isSwitchedOff = true;
        newBenefactor.isAlive = true;
        newBenefactor.lastBenefactorResponseTime = 0;
    }

    function getData(address _benefactor) public view returns (bool switchStatus, address[] memory beneficiaries, uint256 remainingTime) {
        require(benefactors[_benefactor].exists, "Benefactor does not exist");
        switchStatus = !benefactors[_benefactor].isSwitchedOff;
        beneficiaries = benefactors[_benefactor].beneficiaryAddresses;
        if (benefactors[_benefactor].isSwitchedOff) {
            remainingTime = 0;
        } else {
            remainingTime = getRemainingCountdownTime(_benefactor);
        }
        return (switchStatus, beneficiaries, remainingTime);
    }

    function removeBenefactor(address _benefactor) public {
        BenefactorInfo storage newBenefactor = benefactors[_benefactor];
        newBenefactor.exists = false;
        newBenefactor.isAlive = false;
    }

    function getSwitchStatus(address _benefactor) public view returns (bool) {
        require(benefactors[_benefactor].exists,"Benefactor does not exist");
        return !benefactors[_benefactor].isSwitchedOff;
    }

    function isBeneficiary(address _benefactor, address _address) public view returns (bool) {
        return benefactors[_benefactor].beneficiaries[_address].exists;
    }

    function removeBeneficiary(address _beneficiary) external onlyBenefactor {
        require(isBeneficiary(msg.sender,_beneficiary), "Beneficiary not found");
        delete benefactors[msg.sender].beneficiaries[_beneficiary];
        emit BeneficiaryRemoved(msg.sender,_beneficiary);
    }

    function addBeneficiary(address _beneficiary) external onlyBenefactor {
        if (isBeneficiary(msg.sender, _beneficiary)){
            benefactors[msg.sender].beneficiaries[_beneficiary] = Beneficiary(true, new string[](0),"","");
            benefactors[msg.sender].beneficiaryAddresses.push(_beneficiary);
            emit BeneficiaryAdded(msg.sender,_beneficiary);
        }
        // require(!isBeneficiary(msg.sender,_beneficiary), "Beneficiary already exists");
    }

    function addIpfsCID(address _beneficiary, string memory _ipfsCID) external onlyBenefactor {
        require(isBeneficiary(msg.sender,_beneficiary), "Beneficiary not found");
        string[] storage ipfsCIDs = benefactors[msg.sender].beneficiaries[_beneficiary].ipfsCIDs;
        for (uint256 i = 0; i < ipfsCIDs.length; i++) {
            require(keccak256(abi.encodePacked(ipfsCIDs[i])) != keccak256(abi.encodePacked(_ipfsCID)), "CID already assigned to this beneficiary");
        }
        benefactors[msg.sender].beneficiaries[_beneficiary].ipfsCIDs.push(_ipfsCID);
        emit IpfsCIDAdded(msg.sender,_beneficiary, _ipfsCID);
    }

    function removeIpfsCID(address _beneficiary, string memory _ipfsCID) external onlyBenefactor {
        require(isBeneficiary(msg.sender, _beneficiary), "Beneficiary not found");

        string[] storage ipfsCIDs = benefactors[msg.sender].beneficiaries[_beneficiary].ipfsCIDs;
        
        for (uint256 i = 0; i < ipfsCIDs.length; i++) {
            if (keccak256(abi.encodePacked(ipfsCIDs[i])) == keccak256(abi.encodePacked(_ipfsCID))) {
                ipfsCIDs[i] = ipfsCIDs[ipfsCIDs.length - 1];
                ipfsCIDs.pop();
                emit IpfsCIDRemoved(msg.sender, _beneficiary, _ipfsCID);
                return;
            }
        }
        revert("CID not assigned to this beneficiary");
    }

    function addBenefactorPublicKey(address _benefactor, address _beneficiary, string memory _key) public {
        require(isBeneficiary(_benefactor,_beneficiary), "Beneficiary/Benefactor not found");
        benefactors[_benefactor].beneficiaries[_beneficiary].benefactorPublicKey = _key;
        emit BenefactorKeyAdded(_benefactor,_beneficiary, _key);
    }

    function addBeneficiaryPublicKey(address _benefactor, address _beneficiary, string memory _key) public {
        require(isBeneficiary(_benefactor,_beneficiary), "Beneficiary/Benefactor not found");
        benefactors[_benefactor].beneficiaries[_beneficiary].beneficiaryPublicKey = _key;
        emit BeneficiaryKeyAdded(_benefactor,_beneficiary, _key);
    }

    function getBenefactorPublicKey(address _benefactor, address _beneficiary) public view returns(string memory) {
        if (isBeneficiary(_benefactor, _beneficiary)) {
            return benefactors[_benefactor].beneficiaries[_beneficiary].benefactorPublicKey;
        } else {
            return "";
        }
    }

    function getBeneficiaryPublicKey(address _benefactor, address _beneficiary) public view returns(string memory) {
        if (isBeneficiary(_benefactor, _beneficiary)) {
            return benefactors[_benefactor].beneficiaries[_beneficiary].beneficiaryPublicKey;
        } else {
            return "";
        }
    }


    function enableSwitch(address _benefactor) external {
        require(benefactors[_benefactor].beneficiaries[msg.sender].exists, "Not a valid beneficiary");
        if (!benefactors[_benefactor].isSwitchedOff) {
            emit SwitchAlreadyOn(_benefactor,msg.sender);
            return;
        }
        benefactors[_benefactor].isSwitchedOff = false;
        benefactors[_benefactor].lastBenefactorResponseTime = block.timestamp;
        emit DeadMansSwitchEnabled(_benefactor,msg.sender, benefactors[_benefactor].countdownDuration);
    }

    function getRemainingCountdownTime(address _benefactor) public view returns (uint256) {
        uint256 responseTime = block.timestamp - benefactors[_benefactor].lastBenefactorResponseTime;
        return (responseTime > benefactors[_benefactor].countdownDuration) ? 0 : benefactors[_benefactor].countdownDuration - responseTime;
    }

    function checkAliveStatus(address _benefactor) public returns (bool) {
        if (getSwitchStatus(_benefactor)){
            if (benefactors[_benefactor].lastBenefactorResponseTime != 0) {
                uint256 remainingCountdown = getRemainingCountdownTime(_benefactor);
                if (remainingCountdown <= 0) {
                    benefactors[_benefactor].isAlive = false;
                }
             }   
        }
        return benefactors[_benefactor].isAlive;
    }

    function disableSwitch() internal onlyBenefactor {
        if (benefactors[msg.sender].isSwitchedOff) {
            emit SwitchAlreadyOff(msg.sender,msg.sender);
            return;
        }
        benefactors[msg.sender].isSwitchedOff = true;
        emit DeadMansSwitchDisabled(msg.sender,msg.sender, block.timestamp);
    }

    function respondToSwitch() external onlyBenefactor {
        if (benefactors[msg.sender].lastBenefactorResponseTime != 0) {
            if (checkAliveStatus(msg.sender)) {
                emit BenefactorIsAlive(msg.sender,"Benefactor is alive");
                disableSwitch();
                benefactors[msg.sender].lastBenefactorResponseTime = block.timestamp;
            } else {
                removeBenefactor(msg.sender);
                emit BenefactorIsDead(msg.sender,"Benefactor is dead");
            }
        } else {
            emit BenefactorIsAlive(msg.sender,"Benefactor is alive");
            disableSwitch();
            benefactors[msg.sender].lastBenefactorResponseTime = block.timestamp;
        }
    }
    
    function getCIDs(address _benefactor, address _beneficiary) public returns (string[] memory){
        require(isBeneficiary(_benefactor,_beneficiary),"Beneficiary not found");
        require(!checkAliveStatus(_benefactor), "No access to CIDs");
        return benefactors[_benefactor].beneficiaries[_beneficiary].ipfsCIDs;
    }


    
    function getDisplayCIDs() public view returns (address[] memory, string[][] memory) {
        require(benefactors[msg.sender].exists, "No access to CIDs");
        uint256 totalBeneficiaries = benefactors[msg.sender].beneficiaryAddresses.length;
        address[] memory beneficiaryAddresses = new address[](totalBeneficiaries);
        string[][] memory beneficiaryCIDs = new string[][](totalBeneficiaries);
        for (uint256 i = 0; i < totalBeneficiaries; i++) {
            address beneficiaryAddress = benefactors[msg.sender].beneficiaryAddresses[i];
            string[] memory cids = benefactors[msg.sender].beneficiaries[beneficiaryAddress].ipfsCIDs;
            beneficiaryAddresses[i] = beneficiaryAddress;
            beneficiaryCIDs[i] = cids;
        }
        return (beneficiaryAddresses, beneficiaryCIDs);
    }
}
