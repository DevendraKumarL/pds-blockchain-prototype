pragma solidity ^0.4.2;

contract Rupee {
    address public centralGovernment;
    address public stateGovernment;
    uint stateGovernmentBudget;
    mapping (address => uint) balanceDetailsOf;

    modifier onlyGovernment {
        if (msg.sender != centralGovernment) throw;
        _;
    }

    event BudgetAddedLog(address indexed _stateGovernmentAddress, uint _budget);
    event MoneyAddedLog(address indexed _userAddress, uint _amount);
    event StateToCentralRupeeTransferLog(address indexed _stateGovermentAddress, address indexed _centralGovernmentAddress, uint _amount, uint _foodIndex);
    event CustomerToStateRupeeTransferLog(address indexed _customerAddress, address indexed _stateGovernmentAddress, address _fpsAddress, uint _amount, uint _foodIndex);

    function Rupee() {
        centralGovernment = tx.origin;
    }

    function setStateGovernmentAddress(address _governAddr) onlyGovernment {
        stateGovernment = _governAddr;
        stateGovernmentBudget = 0;
    }

    // authenticate first and then make the transfer call
    function addBudget(uint _budget) onlyGovernment returns (bool) {
        if (stateGovernment == address(0)) throw;
        if (stateGovernmentBudget + _budget < stateGovernmentBudget) throw;
        if (_budget == 0) return false;
        stateGovernmentBudget += _budget;
        BudgetAddedLog(stateGovernment, _budget);
        return true;
    }

    // authenticate first and then make the transfer call
    function addMoney(address _userAddress, uint _amount) onlyGovernment returns (bool) {
        if (balanceDetailsOf[_userAddress] + _amount < balanceDetailsOf[_userAddress]) throw;
        if (_amount == 0) return false;
        balanceDetailsOf[_userAddress] += _amount;
        MoneyAddedLog(_userAddress, _amount);
        return true;
    }

    // authenticate first and then make the transfer call
    // after stateGovernment has confirmed that it has received the foodStock from centralGovernment
    function stateTransferToCentral(uint _amount, uint _foodIndex) returns (bool) {
        if (stateGovernment == address(0)) throw;
        if (stateGovernmentBudget < _amount) { throw; }
        if (balanceDetailsOf[centralGovernment] + _amount < balanceDetailsOf[centralGovernment]) { throw; }
        stateGovernmentBudget -= _amount;
        balanceDetailsOf[centralGovernment] += _amount;
        StateToCentralRupeeTransferLog(stateGovernment, centralGovernment, _amount, _foodIndex);
        return true;
    }

    // authenticate first and then make the transfer call
    // after customer has confirmed that it has received the foodStock from fps
    function customerTransferToState(address _customerAddr, uint _amount, uint _foodIndex, address _fpsAddr) returns (bool) {
        if (stateGovernment == address(0)) throw;
        if (balanceDetailsOf[_customerAddr] < _amount) { throw; }
        if (balanceDetailsOf[stateGovernment] + _amount < balanceDetailsOf[stateGovernment]) { throw; }
        balanceDetailsOf[_customerAddr] -= _amount;
        balanceDetailsOf[stateGovernment] += _amount;
        CustomerToStateRupeeTransferLog(_customerAddr, stateGovernment, _fpsAddr, _amount, _foodIndex);
        return true;
    }

    // authenticate first
    function getBalance(address _addr) constant returns (uint) {
        return balanceDetailsOf[_addr];
    }

    // authenticate first
    function getBudgetBalance() constant returns (uint) {
        return stateGovernmentBudget;
    }

    function getStateGovernmentAddress() constant returns (address) {
        return stateGovernment;
    }

    /* Implement Universla Cash Card ~ Offline & Online Sync ups */
    /* Use of a Hashed value and a Private Key to get the Hashed value */
    /* in order to confirm food and money transfer between the 2 parties */

    // To prevent accidental sending of ether to this contract
    // so funds are not locked in the contract forever
    function destroy() onlyGovernment {
        suicide(centralGovernment); // suicides the curret contract and sends the funds to the given address
    }

}
