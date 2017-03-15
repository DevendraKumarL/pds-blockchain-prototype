pragma solidity ^0.4.2;

contract Approval {
  uint public numberOfNotApprovedCustomers;
  uint public numberOfNotApprovedFPS;
  address public government;
  userApproval[] approvals;
  mapping (address => userApproval) userApprovals;
  mapping (address => bool) userAlreadyInApprovalList;

  struct userApproval {
    address userAddress;
    bool approved;
    uint usertype;
  }

  modifier onlyGovernment() {
    if (msg.sender != government) throw;
    _;
  }

  event CustomerAddedToApprovalList(address _customerAddress);
  event FPSAddedToApprovalList(address _fpsAddress);
  event CustomerApproved(address _customerAddress);
  event FPSApproved(address _fpsAddress);

  function Approval() {
    government = tx.origin;
    numberOfNotApprovedCustomers = 0;
    numberOfNotApprovedFPS = 0;
  }

  function addToNotApprovedList(address _userAddr, uint _type) {
    userApproval memory newAppro;
    if (_type == 2) {
      if (userApprovals[_userAddr].userAddress == address(0) && ! userAlreadyInApprovalList[_userAddr]) {
        newAppro.userAddress = _userAddr;
        newAppro.approved = false;
        newAppro.usertype = _type;
        approvals.push(newAppro);

        userApprovals[_userAddr] = newAppro;
        userAlreadyInApprovalList[_userAddr] = true;
        numberOfNotApprovedCustomers += 1;
        CustomerAddedToApprovalList(_userAddr);
      }
    }
    else if (_type == 1) {
      if (userApprovals[_userAddr].userAddress == address(0) && ! userAlreadyInApprovalList[_userAddr]) {
        newAppro.userAddress = _userAddr;
        newAppro.approved = false;
        newAppro.usertype = _type;
        approvals.push(newAppro);

        userApprovals[_userAddr] = newAppro;
        userAlreadyInApprovalList[_userAddr] = true;
        numberOfNotApprovedFPS += 1;
        FPSAddedToApprovalList(_userAddr);
      }
    }
  }

  function approveCustomer(address _customer) onlyGovernment {
    if (userApprovals[_customer].userAddress == _customer && ! userApprovals[_customer].approved && userAlreadyInApprovalList[_customer]) {
      userApprovals[_customer].approved = true;
      if (numberOfNotApprovedCustomers - 1 < 0) throw;
      numberOfNotApprovedCustomers -= 1;
      CustomerApproved(_customer);

      // create rationCard for this customer
    }
  }

  function approveFPS(address _fps) onlyGovernment {
    if (userApprovals[_fps].userAddress == _fps && ! userApprovals[_fps].approved && userAlreadyInApprovalList[_fps]) {
      userApprovals[_fps].approved = true;
      if (numberOfNotApprovedFPS - 1 < 0) throw;
      numberOfNotApprovedFPS -= 1;
      FPSApproved(_fps);
    }
  }

  function getUnApprovedCustomers() constant onlyGovernment returns (uint)  {
    return numberOfNotApprovedCustomers;
  }

  function getUnApprovedFPS() constant onlyGovernment returns (uint) {
    return numberOfNotApprovedFPS;
  }

  function getUnapprovedUser(uint _index, uint _type) constant returns (address) {
    uint i;
    if (_type == 1) {
      if (_index >= numberOfNotApprovedFPS)
        return address(0);
      for (i = _index; i < numberOfNotApprovedFPS; i++) {
        if (!approvals[i].approved && approvals[i].usertype == _type)
          return approvals[i].userAddress;
      }
    } else if (_type == 2) {
      if (_index >= numberOfNotApprovedCustomers)
        return address(0);
      for (i = _index; i < numberOfNotApprovedCustomers; i++) {
        if (!approvals[i].approved && approvals[i].usertype == 2)
        return approvals[i].userAddress;
      }
    }
    return address(0);
  }

}
