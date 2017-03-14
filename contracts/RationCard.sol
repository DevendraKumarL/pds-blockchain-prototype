pragma solidity ^0.4.2;

contract User {
  function checkUserExists(address _addr, uint) returns (bool){}
}

contract RationCard {
  card[] public rationCards;
  uint public totalNumberOfRationCards;
  address public government;
  mapping (address => card) rationCardOf;
  uint public cardNumber;

  struct card {
    address customerAddress;
    uint rationCardNumber;
    string customerName;
    string residentialAddress;
    string place;
    address fpsOwner;
    bool cardCreated;
  }

  modifier onlyGovernment{
    if (msg.sender != government) throw;
    _;
  }

  event CustomerExists(address _custAddr);
  event FPSExists(address _fpsAddr);
  event RationCardCreated(address _customerAddress);

  function RationCard() {
    government = tx.origin;
    totalNumberOfRationCards = 0;
    cardNumber = 1001;
  }

  function addRationCard(address _customerAddress, string _customerName,
    string _residentialAddress, string _place, address _fpsAddress, address _userContractAddr) onlyGovernment returns (bool) {
    bool exists = rationCardOf[_customerAddress].cardCreated;
    if (!exists) {
      User u = User(_userContractAddr);
      exists = u.checkUserExists(_customerAddress, 2);
      if (!exists) {
        return false;
      }
      CustomerExists(_customerAddress);
      exists = u.checkUserExists(_fpsAddress, 1);
      if (!exists) {
        return false;
      }
      FPSExists(_fpsAddress);

      card memory newCard;
      newCard.customerAddress = _customerAddress;
      newCard.rationCardNumber = cardNumber;
      newCard.customerName = _customerName;
      newCard.residentialAddress = _residentialAddress;
      newCard.place = _place;
      newCard.fpsOwner = _fpsAddress;
      newCard.cardCreated = true;

      rationCards.push(newCard);
      rationCardOf[_customerAddress] = newCard;
      totalNumberOfRationCards += 1;
      cardNumber += 1;
      RationCardCreated(_customerAddress);
      return true;
    }
    return false;
  }

  function getRationCardDetails(address _customerAddress) constant onlyGovernment returns (bool, uint, string, string, string, address) {
    uint cardNum;
    string memory cusName;
    string memory cusAddress;
    string memory place;
    address fpsAddr;

    bool exists = rationCardOf[_customerAddress].cardCreated;
    if (exists) {
      card c = rationCardOf[_customerAddress];
      cardNum = c.rationCardNumber;
      cusName = c.customerName;
      cusAddress = c.residentialAddress;
      place = c.place;
      fpsAddr = c.fpsOwner;
    }
    return (exists, cardNum, cusName, cusAddress, place, fpsAddr);
  }

}
