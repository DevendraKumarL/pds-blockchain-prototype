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

  event CustomerAddedToApprovalList(address indexed _customerAddress);
  event FPSAddedToApprovalList(address indexed _fpsAddress);
  event CustomerApproved(address indexed _customerAddress);
  event FPSApproved(address indexed _fpsAddress);

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

  // Use getters like the below ones everywhere
  function getUnApprovedCustomers() constant onlyGovernment returns (uint)  {
    return numberOfNotApprovedCustomers;
  }

  function getUnApprovedFPS() constant onlyGovernment returns (uint) {
    return numberOfNotApprovedFPS;
  }

  /*function getUnapprovedUser(uint _index, uint _type) constant returns (address) {
    uint i;
    uint total = numberOfNotApprovedCustomers + numberOfNotApprovedFPS;
    if (_index >= total)
      return address(0);
    for (i = _index; i < total; i++) {
      if (!approvals[i].approved && approvals[i].usertype == _type)
        return approvals[i].userAddress;
    }
    return address(0);
  }*/

  // FIX IT
  function getUnapprovedUser(address _addr, uint _type) constant returns (address) {
    address userAddr;
    userApproval usapp = userApprovals[_addr];
    if (usapp.userAddress != address(0) && !usapp.approved && usapp.usertype == _type) {
      userAddr = _addr;
    }
    return userAddr;
  }

  // FIX IT
  function getApprovedUser(address _addr, uint _type) constant returns (address) {
    address userAddr;
    userApproval usapp = userApprovals[_addr];
    if (usapp.userAddress != address(0) && usapp.approved && usapp.usertype == _type) {
      userAddr = _addr;
    }
    return userAddr;
  }

  // Have combined the above 2 methods into one method which returns (address, aprpoved)
  function getUserApproval(address _addr, uint _type) constant returns (address, bool) {
    address userAddr;
    bool approved;
    userApproval usapp = userApprovals[_addr];
    if (usapp.userAddress != address(0) && usapp.usertype == _type) {
      userAddr = _addr;
      approved = usapp.approved;
    }
    return (userAddr, approved);
  }

  // To prevent accidental sending of ether to this contract
  // so funds are not locked in the contract forever
  function destroy() onlyGovernment {
    suicide(government); // suicides the curret contract and sends the funds to the given address
  }

}
