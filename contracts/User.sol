pragma solidity ^0.4.2;

contract User {
  address public government;
  uint public totalUsersInBlockchain;
  string[] userTypes;
  string[] places;
  mapping (address => userStruct) users;
  mapping (string => address) userEmailAddress;

  struct userStruct {
    string username;
    string email;
    string password;
    // bytes32 sha3Password;
    address userAddress; // if Customer => rationCardNumber i.e., address
    string usertype;
    uint utype;
    string place;
  }

  modifier onlyGovernment{
    if (msg.sender != government) throw;
    _;
  }

  event UserAdded(address indexed _userAddress, string _userName);

  function User() {
    totalUsersInBlockchain = 0;
    government = tx.origin;

    userTypes.push("Government");
    userTypes.push("FPS");
    userTypes.push("Customer");

    places.push("Srinagar");
    places.push("Girinagar");
    places.push("Hanumanthnagar");
  }

  // remove return and use throw instead
  function addUser(address _userAddress, string _name, string _email, uint _type, string _password, uint _place) returns (address) {
    address uAddr;
    if ( userEmailAddress[_email] == address(0) ) {
      userStruct memory newUser;
      newUser.username = _name;
      newUser.email = _email;
      newUser.password = _password;
      // use web3.sha3()
      /*newUser.sha2Password = sha3(_password);*/
      newUser.userAddress = _userAddress;
      newUser.usertype = userTypes[_type];
      newUser.utype = _type;
      newUser.place = places[_place];
      users[_userAddress] = newUser;

      userEmailAddress[_email] = _userAddress;
      totalUsersInBlockchain += 1;
      UserAdded(_userAddress, _name);
      uAddr = _userAddress;
    }
    return uAddr;
  }

  // remove this function and refer Hash.sol
  /*function authenticateUserWithEmail(string _email, string _password) constant returns (bool exists) {
    // search for user with _email, _password
    address userAddr = userEmailAddress[_email];
    userStruct user = users[userAddr];

    bytes storage password = bytes(user.password);
    bytes memory password2 = bytes(_password);

    if (password.length != password2.length) {
        return false;
    }
    for (uint i = 0; i < password.length; i++) {
      if (password[i] != password2[i])
        return false;
    }
    return true;
  }*/

  // remove this function and refer Hash.sol
  /*function authenticateUserWithAddress(address _userAddress, string _password) constant returns(bool exists) {
    // search for user with _userAddress, _password
    userStruct user = users[_userAddress];

    bytes storage password = bytes(user.password);
    bytes memory password2 = bytes(_password);

    if (password.length != password2.length) {
      return false;
    }
    for (uint i = 0; i < password.length; i++) {
      if (password[i] != password2[i])
        return false;
    }
    return true;
  }*/

  function getUserInfo(address _userAddress, string _password) constant returns (address, string, string, string, string) {
    address userAddr;
    string memory username;
    string memory email;
    string memory usertype;
    string memory place;

    if (authenticateUserWithAddress(_userAddress, _password)) {
      userStruct user = users[_userAddress];
      userAddr = user.userAddress;
      username = user.username;
      email = user.email;
      usertype = user.usertype;
      place = user.place;
    }

    return (userAddr, username, email ,usertype , place);
  }

  function getUserDetails(address _userAddress) constant returns (address, string, string, string, string) {
    address userAddr;
    string memory username;
    string memory email;
    string memory usertype;
    string memory place;

    userStruct user = users[_userAddress];
    userAddr = user.userAddress;
    username = user.username;
    email = user.email;
    usertype = user.usertype;
    place = user.place;
    return (userAddr, username, email ,usertype , place);
  }

  function getUserTypes() constant returns (string, string, string) {
    return (userTypes[0], userTypes[1], userTypes[2]);
  }

  function getPlaces() constant returns (string, string, string) {
    return (places[0], places[1], places[2]);
  }

  function checkUserExists(address _addr, uint _type) constant returns (bool) {
    userStruct user = users[_addr];
    if (user.userAddress == _addr && user.utype == _type)
      return true;
    else
      return false;
  }

  function checkUserRegistered(address _userAddr) constant returns (bool) {
    bool exists;
    if (users[_userAddr].userAddress == _userAddr) {
      exists = true;
    }
    return exists;
  }

  // To prevent accidental sending of ether to this contract
  // so funds are not locked in the contract forever
  function destroy() onlyGovernment {
    suicide(government); // suicides the curret contract and sends the funds to the given address
  }

}
