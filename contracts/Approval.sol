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

  function approveCustomer(address _customerAddr) onlyGovernment {
    if (userApprovals[_customerAddr].userAddress == _customerAddr && !userApprovals[_customerAddr].approved && userAlreadyInApprovalList[_customerAddr]) {
      if (numberOfNotApprovedCustomers - 1 < 0) throw;
      userApprovals[_customerAddr].approved = true;
      for (uint i = 0; i < approvals.length; i++) {
        if (approvals[i].usertype == 2 && approvals[i].userAddress == _customerAddr) {
          approvals[i].approved = true;
          break;
        }
      }
      numberOfNotApprovedCustomers -= 1;
      CustomerApproved(_customerAddr);
    }
  }

  function approveFPS(address _fpsAddr) onlyGovernment {
    if (userApprovals[_fpsAddr].userAddress == _fpsAddr && !userApprovals[_fpsAddr].approved && userAlreadyInApprovalList[_fpsAddr]) {
      if (numberOfNotApprovedFPS - 1 < 0) throw;
      userApprovals[_fpsAddr].approved = true;
      for (uint i = 0; i < approvals.length; i++) {
        if (approvals[i].usertype == 1 && approvals[i].userAddress == _fpsAddr) {
          approvals[i].approved = true;
          break;
        }
      }
      numberOfNotApprovedFPS -= 1;
      FPSApproved(_fpsAddr);
    }
  }

  function getUnapprovedUser(uint _index) constant returns (address, uint, bool) {
    address userAddr;
    uint usertype;
    bool approved;

    if (_index < approvals.length) {
      userAddr = approvals[_index].userAddress;
      usertype = approvals[_index].usertype;
      approved = approvals[_index].approved;
    }
    return (userAddr, usertype, approved);
  }

  /*// FIX IT
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
  }*/

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
