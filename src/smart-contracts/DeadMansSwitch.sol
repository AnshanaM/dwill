// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @title DeadMansSwitch
 * @dev Contract for managing a benefactor's dead man's switch with assigned beneficiaries.
 */
contract DeadMansSwitch {
    address public benefactor;
    uint256 public countdownDuration;
    uint256 public lastBenefactorResponseTime;
    bool public isSwitchedOff;
    bool public isAlive;

    event DeadMansSwitchEnabled(address indexed beneficiary, uint256 countdownDuration);
    event DeadMansSwitchDisabled(address indexed benefactor, uint256 responseTime);
    event SwitchAlreadyOff(address indexed caller);
    event SwitchAlreadyOn(address indexed caller);
    event remainingCountdownInfo(uint256 countdownDuration, uint256 responseTime, uint256 currentTime, uint256 lastBenefactorResponseTime);
    event BenefactorIsAlive(address indexed benefactor, string aliveStatus);
    event BenefactorIsDead(address indexed benefactor, string deadStatus);

    /**
     * @dev Modifier to check if the caller is the benefactor and the benefactor is alive.
     */
    modifier onlyBenefactor() {
        require(msg.sender == benefactor && isAlive == true, "Not the benefactor");
        _;
    }

    /**
     * @dev Modifier to check if the caller is the benefactor and the benefactor is dead.
     */
    modifier onlyBeneficiary() {
        require(msg.sender == benefactor && isAlive == false, "Not the benefactor");
        _;
    }

    /**
     * @dev Constructor to initialize the DeadMansSwitch contract.
     */
    constructor() {
        benefactor = msg.sender;
        isSwitchedOff = true;
        isAlive = true;
        lastBenefactorResponseTime = 0;
    }

    /**
    * @dev sets the countdown duration
    * @param _countdownDuration The duration of the countdown in seconds.
     */
    function setCountdownDuration(uint256 _countdownDuration) external onlyBenefactor(){
        countdownDuration = _countdownDuration;
    }

    /**
     * @dev Enables the dead man's switch. Only callable by beneficiaries.
     */
    function enableSwitch() external onlyBeneficiary {
        if (!isSwitchedOff) {
            emit SwitchAlreadyOn(msg.sender);
            return;
        }
        isSwitchedOff = false;
        lastBenefactorResponseTime = block.timestamp;
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
}
