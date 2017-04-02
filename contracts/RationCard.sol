pragma solidity ^0.4.2;

contract RationCard {
  uint public totalNumberOfRationCards;
  uint public totalNumberOfFlexicards;
  address public government;

  card[] public rationCards;
  mapping (address => card) rationCardOf;

  flexiCard[] public flexiCards;
  mapping (address => flexiCard) flexiCardOf;

  uint public cardNumber;
  uint public flexiCardNumber;

  struct card {
    address customerAddress;
    uint rationCardNumber;
    string customerName;
    string residentialAddress;
    string place;
    address fpsOwner;
    bool cardCreated;
    uint foodItem1Points;
    uint foodItem2Points;
    uint foodItem3Points;
  }

  struct flexiCard {
    address customerAddress;
    uint rationCardNumber;
    string customerName;
    string residentialAddress;
    string place;
    address fpsOwner;
    bool cardCreated;
    uint creditPoints;
  }

  modifier onlyGovernment{
    if (msg.sender != government) throw;
    _;
  }

  event RationCardCreated(address indexed _customerAddress, uint _rationCardNumber);
  event FlexiRationCardCreated(address indexed _customerAddress, uint _rationCardNumber);

  function RationCard() {
    government = tx.origin;
    totalNumberOfRationCards = 0;
    cardNumber = 1001;
    flexiCardNumber = 5001;
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

      // government should give points to customer for this card
    }
    return cardNum;
  }

  function checkRationCardExists(address _addr) constant onlyGovernment returns (bool) {
    return rationCardOf[_addr].cardCreated;
  }

  function getRationCardInfo(uint _cardNum, address _customerAddress) constant returns (bool, uint, string, string, string, address) {
    uint cardNum;
    string memory cusName;
    string memory cusAddress;
    string memory place;
    address fpsAddr;
    bool exists;

    for (uint i = 0; i < rationCards.length; i++) {
      if (rationCards[i].rationCardNumber == _cardNum || rationCardOf[_customerAddress] != address(0)) {
        exists = true;
        cardNum = rationCards[i].rationCardNumber;
        cusName = rationCards[i].customerName;
        cusAddress = rationCards[i].residentialAddress;
        place = rationCards[i].place;
        fpsAddr = rationCards[i].fpsOwner;
        break;
      }
    }
    return (exists, cardNum, cusName, cusAddress, place, fpsAddr);
  }

  function addFlexiRationCard(address _customerAddress, string _customerName,
    string _residentialAddress, string _place, address _fpsAddress) onlyGovernment returns (uint) {
    uint cardNum;
    bool exists = flexiCardOf[_customerAddress].cardCreated;
    if (_customerAddress == _fpsAddress) { throw; }
    if (!exists) {
      // Check for these addresses seperately
      /*Check CustomerExists(_customerAddress);*/
      /*Check FPSExists(_fpsAddress);*/

      flexiCard memory newCard;
      newCard.customerAddress = _customerAddress;
      newCard.rationCardNumber = cardNumber;
      newCard.customerName = _customerName;
      newCard.residentialAddress = _residentialAddress;
      newCard.place = _place;
      newCard.fpsOwner = _fpsAddress;
      newCard.cardCreated = true;

      flexiCards.push(newCard);
      flexiCardOf[_customerAddress] = newCard;
      totalNumberOfFlexicards += 1;
      FlexiRationCardCreated(_customerAddress, cardNumber);
      cardNum = flexiCardNumber;
      flexiCardNumber += 1;

      // government should give points to customer for this card
    }
    return cardNum;
  }

  function checkFlexiRationCardExists(address _addr) constant onlyGovernment returns (bool) {
    return flexiCardOf[_addr].cardCreated;
  }

  function getFlexiRationCardInfo(uint _cardNum, address _customerAddress) constant returns (bool, uint, string, string, string, address) {
    uint cardNum;
    string memory cusName;
    string memory cusAddress;
    string memory place;
    address fpsAddr;
    bool exists;

    for (uint i = 0; i < rationCards.length; i++) {
      if (flexiCards[i].rationCardNumber == _cardNum || flexiCardOf[_customerAddress] != address(0)) {
        exists = true;
        cardNum = flexiCards[i].rationCardNumber;
        cusName = flexiCards[i].customerName;
        cusAddress = flexiCards[i].residentialAddress;
        place = flexiCards[i].place;
        fpsAddr = flexiCards[i].fpsOwner;
        break;
      }
    }
    return (exists, cardNum, cusName, cusAddress, place, fpsAddr);
  }

  // To prevent accidental sending of ether to this contract
  // so funds are not locked in the contract forever
  function destroy() onlyGovernment {
    suicide(government); // suicides the curret contract and sends the funds to the given address
  }

}
