pragma solidity ^0.4.2;

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

  event RationCardCreated(address indexed _customerAddress, uint _rationCardNumber);

  function RationCard() {
    government = tx.origin;
    totalNumberOfRationCards = 0;
    cardNumber = 1001;
  }

  // Change, remove checkUserExists, we have to call the of other contracts externally
  function addRationCard(address _customerAddress, string _customerName,
    string _residentialAddress, string _place, address _fpsAddress) onlyGovernment returns (uint) {
    uint cardNum;
    bool exists = rationCardOf[_customerAddress].cardCreated;
    if (_customerAddress == _fpsAddress) { throw; }
    if (!exists) {
      // Check for these addresses seperately
      /*Check CustomerExists(_customerAddress);*/
      /*Check FPSExists(_fpsAddress);*/

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
      RationCardCreated(_customerAddress, cardNumber);
      cardNum = cardNumber;
      cardNumber += 1;
    }
    return cardNum;
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

  function checkRationCardExists(address _addr) constant onlyGovernment returns (bool) {
    bool exists = rationCardOf[_addr].cardCreated;
    return exists;
  }

}
