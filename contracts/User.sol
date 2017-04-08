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
        /*string password; // remove this*/
        bytes32 sha3Password;
        // if Customer then this same as his rationCard's address which this same address
        address userAddress;
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

    function addUser(address _userAddress, string _name, string _email, uint _type, string _password, uint _place) onlyGovernment returns (address) {
        address uAddr;
        if ( userEmailAddress[_email] == address(0) ) {
            userStruct memory newUser;
            newUser.username = _name;
            newUser.email = _email;
            /*newUser.password = _password;*/
            newUser.sha3Password = sha3(_password);
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

    function authenticateUserWithAddress(address _userAddr, string _password) constant returns (bool) {
        return users[_userAddr].sha3Password == sha3(_password);
    }

    function authenticateUserWithEmail(string _email, string _password) constant returns (bool) {
        return users[userEmailAddress[_email]].sha3Password == sha3(_password);
    }

    // Remove this ??
    // Only user can get his own profile info using the password used at registration time
    function getUserProfile(address _userAddress, string _password) constant returns (address, string, string, string, string) {
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

    // Only government can see all users' details
    function getUserDetails(address _userAddress) constant onlyGovernment returns (address, string, string, string, string) {
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

    function getUserTypes() constant onlyGovernment returns (string, string, string) {
        return (userTypes[0], userTypes[1], userTypes[2]);
    }

    function getPlaces() constant onlyGovernment returns (string, string, string) {
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
