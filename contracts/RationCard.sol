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
    uint flexiCardNumber;
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
  event RationCardPointsAdded(address indexed _customerAddress, uint _point1, uint _point2, uint _point3);
  event FlexiRationCardPointsAdded(address indexed _customerAddress, uint _points);

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
    bool exists;
    uint cardNum;
    string memory cusName;
    string memory cusAddress;
    string memory place;
    address fpsAddr;

    for (uint i = 0; i < rationCards.length; i++) {
      if (rationCards[i].rationCardNumber == _cardNum || rationCards[i].customerAddress == _customerAddress) {
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

      flexiCard memory newFlexiCard;
      newFlexiCard.customerAddress = _customerAddress;
      newFlexiCard.flexiCardNumber = flexiCardNumber;
      newFlexiCard.customerName = _customerName;
      newFlexiCard.residentialAddress = _residentialAddress;
      newFlexiCard.place = _place;
      newFlexiCard.fpsOwner = _fpsAddress;
      newFlexiCard.cardCreated = true;

      flexiCards.push(newFlexiCard);
      flexiCardOf[_customerAddress] = newFlexiCard;
      totalNumberOfFlexicards += 1;
      FlexiRationCardCreated(_customerAddress, flexiCardNumber);
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
    bool exists;
    uint cardNum;
    string memory cusName;
    string memory cusAddress;
    string memory place;
    address fpsAddr;

    for (uint i = 0; i < flexiCards.length; i++) {
      if (flexiCards[i].flexiCardNumber == _cardNum || flexiCards[i].customerAddress == _customerAddress) {
        exists = true;
        cardNum = flexiCards[i].flexiCardNumber;
        cusName = flexiCards[i].customerName;
        cusAddress = flexiCards[i].residentialAddress;
        place = flexiCards[i].place;
        fpsAddr = flexiCards[i].fpsOwner;
        break;
      }
    }
    return (exists, cardNum, cusName, cusAddress, place, fpsAddr);
  }

  function addRationCardPoints(address _customerAddress, uint _point1, uint _point2, uint _point3) returns (bool) {
    bool success;
    if (rationCardOf[_customerAddress].customerAddress != address(0)) {
      if (_point1 >= 1 && _point2 >= 1 && _point3 >= 1) {
        rationCardOf[_customerAddress].foodItem1Points += _point1;
        rationCardOf[_customerAddress].foodItem2Points += _point2;
        rationCardOf[_customerAddress].foodItem3Points += _point3;
      }
    }

    if (rationCardOf[_customerAddress].foodItem1Points == _point1
      && rationCardOf[_customerAddress].foodItem2Points == _point2
      && rationCardOf[_customerAddress].foodItem3Points == _point3) {
      uint tmp;
      for (uint i = 0; i < rationCards.length; i++) {
        if (rationCards[i].customerAddress == _customerAddress) {
          rationCards[i].foodItem1Points += _point1;
          rationCards[i].foodItem2Points += _point2;
          rationCards[i].foodItem3Points += _point3;
          tmp = i;
          break;
        }
      }
      if (rationCards[tmp].foodItem1Points == _point1
        && rationCards[tmp].foodItem2Points == _point2
        && rationCards[tmp].foodItem3Points == _point3) {
        success = true;
        RationCardPointsAdded(_customerAddress, _point1, _point2, _point3);
      }
    }
    return success;
  }

  function getRationCardPoints(uint _cardNum, address _customerAddress) constant returns (bool, uint, uint, uint) {
    bool exists;
    uint point1;
    uint point2;
    uint point3;

    for (uint i = 0; i < rationCards.length; i++) {
      if (rationCards[i].rationCardNumber == _cardNum || rationCards[i].customerAddress == _customerAddress) {
        exists = true;
        point1 = rationCards[i].foodItem1Points;
        point2 = rationCards[i].foodItem2Points;
        point3 = rationCards[i].foodItem3Points;
        break;
      }
    }
    return (exists, point1, point2, point3);
  }

  function addFlexiRationCardPoints(address _customerAddress, uint _points) returns (bool) {
    bool success;
    if (flexiCardOf[_customerAddress].customerAddress != address(0)) {
      if (_points >= 3) {
        flexiCardOf[_customerAddress].creditPoints += _points;
      }
    }

    if (flexiCardOf[_customerAddress].creditPoints == _points) {
      uint tmp;
      for (uint i = 0; i < flexiCards.length; i++) {
        if (flexiCards[i].customerAddress == _customerAddress) {
          flexiCards[i].creditPoints += _points;
          tmp = i;
          break;
        }
      }
      if (flexiCards[tmp].creditPoints == _points) {
        success = true;
        FlexiRationCardPointsAdded(_customerAddress, _points);
      }
    }
    return success;
  }

  function getFlexiRationCardPoints(uint _cardNum, address _customerAddress) constant returns (bool, uint) {
    bool exists;
    uint points;

    for (uint i = 0; i < flexiCards.length; i++) {
      if (flexiCards[i].flexiCardNumber == _cardNum || flexiCards[i].customerAddress == _customerAddress) {
        exists = true;
        points = flexiCards[i].creditPoints;
        break;
      }
    }
    return (exists, points);
  }

  // To prevent accidental sending of ether to this contract
  // so funds are not locked in the contract forever
  function destroy() onlyGovernment {
    suicide(government); // suicides the curret contract and sends the funds to the given address
  }

}
