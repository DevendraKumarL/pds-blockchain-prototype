pragma solidity ^0.4.2;

contract Food {
  address public government;
  foodItem[] foodItemsList;
  mapping (address => mapping (uint => foodStock)) foodStocksOf;
  uint public numberOFFoodItems;

  struct foodItem {
    string foodName;
    uint fixedQuantityToSellToCustomer;
    uint fixedQuantityToSupplyToFPS;
    string unitOfMeasurement;
  }

  struct foodStock {
    address userAddress;
    uint foodItemIndex;
    uint balanceSupply;
  }

  modifier onlyGovernment{
    if (msg.sender != government) throw;
    _;
  }

  event NewFoodItemCreatedLog(address indexed _governmentAddress, string _foodName);
  event AddedFoodItemToStockLog(address indexed _governmentAddress, uint _foodIndex, uint _quantity);
  event SupplyToFPSLog(address indexed _governmentAddress, address indexed _fpsAddress, uint _quantity);
  event SellToCustomerLog(address indexed _fpsAddress, address indexed _customerAddress, uint _quantity);

  function Food() {
    government = tx.origin;
    numberOFFoodItems = 0;
  }

  function createFoodItem(string _foodname, uint _qtySellToCustomer, uint _qtySupplyToFPS, string _unit) onlyGovernment {
    foodItem memory item;
    item.foodName = _foodname;
    item.fixedQuantityToSellToCustomer = _qtySellToCustomer;
    item.fixedQuantityToSupplyToFPS = _qtySupplyToFPS;
    item.unitOfMeasurement = _unit;
    foodItemsList.push(item);
    numberOFFoodItems += 1;
    NewFoodItemCreatedLog(government, _foodname);
  }

  function addFoodItemToStock(uint _foodIndex, uint _quantity) onlyGovernment {
    if (_foodIndex >= numberOFFoodItems) throw;
    if (foodStocksOf[government][_foodIndex].userAddress == address(0)) {
      foodStock memory stock;
      stock.userAddress = government;
      stock.foodItemIndex = _foodIndex;
      stock.balanceSupply = _quantity;
      foodStocksOf[government][_foodIndex] = stock;
      AddedFoodItemToStockLog(government, _foodIndex, _quantity);
    } else {
      foodStock stk = foodStocksOf[government][_foodIndex];
      if (stk.balanceSupply + _quantity < stk.balanceSupply) throw;
      stk.balanceSupply += _quantity;
      AddedFoodItemToStockLog(government, _foodIndex, _quantity);
    }
  }

  function supplyToFPS(address _fps, uint _foodIndex) onlyGovernment {
    if (_foodIndex >= numberOFFoodItems) throw;
    uint _fixed;
    _fixed = foodItemsList[_foodIndex].fixedQuantityToSupplyToFPS;
    if (foodStocksOf[_fps][_foodIndex].userAddress == address(0)) {
      /*if ( (foodStocksOf[government][_foodIndex].balanceSupply - _fixed) < foodStocksOf[government][_foodIndex].balanceSupply) throw;*/
      foodStock memory stock;
      stock.userAddress = _fps;
      stock.foodItemIndex = _foodIndex;
      stock.balanceSupply = _fixed;
      foodStocksOf[_fps][_foodIndex] = stock;
      foodStocksOf[government][_foodIndex].balanceSupply -= _fixed;
      SupplyToFPSLog(government, _fps, _fixed);
    } else {
      /*if ( (foodStocksOf[government][_foodIndex].balanceSupply - _fixed) < foodStocksOf[government][_foodIndex].balanceSupply) throw;*/
      /*if (foodStocksOf[_fps][_foodIndex].balanceSupply + _fixed < foodStocksOf[_fps][_foodIndex].balanceSupply) throw;*/
      foodStocksOf[_fps][_foodIndex].balanceSupply += _fixed;
      foodStocksOf[government][_foodIndex].balanceSupply -= _fixed;
      SupplyToFPSLog(government, _fps, _fixed);
    }
  }

  function fpsSupplyToCustomer(address _fps, address _customer, uint _foodIndex) {
    if (_foodIndex >= numberOFFoodItems) throw;
    uint _fixed;
    _fixed = foodItemsList[_foodIndex].fixedQuantityToSellToCustomer;
    if (foodStocksOf[_fps][_foodIndex].userAddress == address(0)) throw;
    if (foodStocksOf[_customer][_foodIndex].userAddress == address(0)) {
      /*if ( (foodStocksOf[_fps][_foodIndex].balanceSupply - _fixed) < foodStocksOf[_fps][_foodIndex].balanceSupply) throw;*/
      foodStock memory stock;
      stock.userAddress = _customer;
      stock.foodItemIndex = _foodIndex;
      stock.balanceSupply = _fixed;
      foodStocksOf[_customer][_foodIndex] = stock;
      foodStocksOf[_fps][_foodIndex].balanceSupply -= _fixed;
      SellToCustomerLog(_fps, _customer, _fixed);
    } else {
      /*if ( (foodStocksOf[_fps][_foodIndex].balanceSupply - _fixed) < foodStocksOf[_fps][_foodIndex].balanceSupply) throw;*/
      /*if ( (foodStocksOf[_customer][_foodIndex].balanceSupply + _fixed) < foodStocksOf[_customer][_foodIndex].balanceSupply) throw;*/
      foodStocksOf[_customer][_foodIndex].balanceSupply += _fixed;
      foodStocksOf[_fps][_foodIndex].balanceSupply -= _fixed;
      SellToCustomerLog(_fps, _customer, _fixed);
    }
  }

  function getFoodStock(address _userAddr, uint _foodIndex) constant returns (uint)  {
    uint balance;
    if (foodStocksOf[_userAddr][_foodIndex].userAddress != address(0)) {
      balance = foodStocksOf[_userAddr][_foodIndex].balanceSupply;
    }
    return balance;
  }

  // To prevent accidental sending of ether to this contract
  // so funds are not locked in the contract forever
  function destroy() onlyGovernment {
    suicide(government); // suicides the curret contract and sends the funds to the given address
  }

}
