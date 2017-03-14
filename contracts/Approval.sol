pragma solidity ^0.4.2;

contract Approval {
  uint public numberOfNotApprovedCustomers;
  uint public numberOfNotApprovedFPS;
  address public government;
  mapping (address => bool) approvalsCustomer;
  mapping (address => bool) approvalsFPS;

  modifier onlyGovernment() {
    if (msg.sender != government) throw;
    _;
  }

  function Approval() {
    government = tx.origin;
    numberOfNotApprovedCustomers = 0;
    numberOfNotApprovedFPS = 0;
  }

  function addToNotApprovedList(address _userAddr, uint _type) onlyGovernment {
    if (_type == 2) {
      approvalsCustomer[_userAddr] = false;
      numberOfNotApprovedCustomers += 1;
    }
    else if (_type == 1) {
      approvalsFPS[_userAddr] = false;
      numberOfNotApprovedFPS += 1;
    }
  }

  function approveCustomer(address _customer) onlyGovernment {
    if (! approvalsCustomer[_customer]) {
      approvalsCustomer[_customer] = true;
      numberOfNotApprovedCustomers -= 1;
    }
  }

  function approveFPS(address _fps) onlyGovernment {
    if (! approvalsFPS[_fps]) {
      approvalsFPS[_fps] = true;
      numberOfNotApprovedFPS -= 1;
    }
  }

  function getUnApprovedCustomers() constant onlyGovernment returns (uint)  {
    return numberOfNotApprovedCustomers;
  }

  function getUnApprovedFPS() constant onlyGovernment returns (uint) {
    return numberOfNotApprovedFPS;
  }

}
