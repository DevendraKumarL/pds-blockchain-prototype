pragma solidity ^0.4.2;

////////////////////////////////////////////////////////////////////////////////
/*-> government buys a kg of rice for 26/- and sells it to customer at 1/-
    -> so the contract has to keep track of the foodflow and money from customers
    -> thus track the **BENEFIT FLOW**
    -> make analysis/graph depicting flow of food/benegfit versus amount spent
    -> i.e., is/visualization the amount spent benefitting the customers ??*/
////////////////////////////////////////////////////////////////////////////////
contract Food {
    address public centralGovernment;
    address public stateGovernment;
    uint public numberOFFoodItems;
    foodItem[] foodItemsList;
    mapping (address => mapping (uint => foodStock)) foodStocksOf;

    struct foodItem {
        string foodName;
        uint fixedQuantityToSellToCustomer;
        uint fixedQuantityToSupplyToFPS;
        string unitOfMeasurement;
        uint costPrice; // In Rupees
        uint sellingPrice;
    }

    struct foodStock {
        address userAddress;
        uint foodItemIndex;
        uint balanceSupply;
        bytes32 transferHash;
    }

    modifier onlyGovernment{
        if (msg.sender != centralGovernment) throw;
        _;
    }

    event NewFoodItemCreatedLog(address indexed _centralGovernmentAddress, uint _foodIndex, string _foodName);
    event AddedFoodItemToStockLog(address indexed _centralGovernmentAddress, uint _foodIndex, uint _quantity);

    event SupplyCentralToStateGovernmentLog(address indexed _centralGovernmentAddress, address indexed _stateGovernmentAddress, uint _foodIndex, uint _quantity, uint _expense);
    event SupplyCentralToStateGovernment_HashLog(address indexed _centralGovernmentAddress, address indexed _stateGovernmentAddress, uint _foodIndex, uint _quantity, uint _expense);

    event SupplyToFPSLog(address indexed _stateGovernmentAddress, address indexed _fpsAddress, uint _foodIndex, uint _quantity);
    event SupplyToFPS_HashLog(address indexed _stateGovernmentAddress, address indexed _fpsAddress, uint _foodIndex, uint _quantity);

    event SellToCustomerLog(address indexed _fpsAddress, address indexed _customerAddress, uint _foodIndex, uint _quantity, uint _totalCost);
    event SellToCustomer_HashLog(address indexed _fpsAddress, address indexed _customerAddress, uint _foodIndex, uint _quantity, uint _totalCost);

    function Food() {
        centralGovernment = tx.origin;
        numberOFFoodItems = 0;
    }

    function setStateGovernmentAddress(address _governAddr) onlyGovernment {
        stateGovernment = _governAddr;
    }

    function createFoodItem(
        string _foodname, uint _qtySellToCustomer, uint _qtySupplyToFPS, string _unit, uint _cprice, uint _sprice) onlyGovernment {
        foodItem memory item;
        item.foodName = _foodname;
        item.fixedQuantityToSellToCustomer = _qtySellToCustomer;
        item.fixedQuantityToSupplyToFPS = _qtySupplyToFPS;
        item.unitOfMeasurement = _unit;
        item.costPrice = _cprice;
        item.sellingPrice = _sprice;
        foodItemsList.push(item);
        NewFoodItemCreatedLog(centralGovernment, numberOFFoodItems, _foodname);
        numberOFFoodItems += 1;
    }

    function addFoodItemToStock(uint _foodIndex, uint _quantity) onlyGovernment {
        if (_foodIndex >= numberOFFoodItems) throw;
        if (foodStocksOf[centralGovernment][_foodIndex].userAddress == address(0)) {
            foodStock memory stock;
            stock.userAddress = centralGovernment;
            stock.foodItemIndex = _foodIndex;
            stock.balanceSupply = _quantity;
            foodStocksOf[centralGovernment][_foodIndex] = stock;
            AddedFoodItemToStockLog(centralGovernment, _foodIndex, _quantity);
        } else {
            foodStock stk = foodStocksOf[centralGovernment][_foodIndex];
            if (stk.balanceSupply + _quantity < stk.balanceSupply) throw;
            stk.balanceSupply += _quantity;
            AddedFoodItemToStockLog(centralGovernment, _foodIndex, _quantity);
        }
    }

            // Use food item price with Rupee contract to make transfer
    function supplyCentralToStateGovernment(uint _foodIndex, uint _quantity) onlyGovernment {
        if (_foodIndex >= numberOFFoodItems) throw;
        if (stateGovernment == address(0)) throw;
        if (foodStocksOf[centralGovernment][_foodIndex].userAddress == centralGovernment)
            if (foodStocksOf[centralGovernment][_foodIndex].balanceSupply < _quantity) throw;
        else
            throw;
        uint expense = _quantity * foodItemsList[_foodIndex].costPrice;
        if (foodStocksOf[stateGovernment][_foodIndex].userAddress == address(0)) {
            foodStock memory stock;
            stock.userAddress = stateGovernment;
            stock.foodItemIndex = _foodIndex;
            stock.balanceSupply = _quantity;
            foodStocksOf[stateGovernment][_foodIndex] = stock;
            foodStocksOf[centralGovernment][_foodIndex].balanceSupply -= _quantity;
            SupplyCentralToStateGovernmentLog(centralGovernment, stateGovernment, _foodIndex, _quantity, expense);
        } else {
            foodStock stk = foodStocksOf[stateGovernment][_foodIndex];
            if (stk.balanceSupply + _quantity < stk.balanceSupply) throw;
            stk.balanceSupply += _quantity;
            foodStocksOf[centralGovernment][_foodIndex].balanceSupply -= _quantity;
            SupplyCentralToStateGovernmentLog(centralGovernment, stateGovernment, _foodIndex, _quantity, expense);
        }
    }

    // -> stateGovernment can confirm the food transfered from centralGovernment and pay for it to centralGovernment by looking at the transaction event
    // -> Call stateTransferToCentral after success of supplyCentralToStateGovernment_Hash
    // -> Accept a secret key fro stateGovernment and finds its sha3, then compare with the transferHash of this
    //    fooditem of the stateGovernment's foodStock to confirm the transfer
    function supplyCentralToStateGovernment_Hash(uint _foodIndex, uint _quantity, bytes32 _hash) onlyGovernment {
        if (_foodIndex >= numberOFFoodItems) throw;
        if (stateGovernment == address(0)) throw;
        if (foodStocksOf[stateGovernment][_foodIndex].transferHash != bytes32(0)) throw;
        if (foodStocksOf[centralGovernment][_foodIndex].balanceSupply < _quantity) throw;
        uint expense = _quantity * foodItemsList[_foodIndex].costPrice;
        if (foodStocksOf[stateGovernment][_foodIndex].userAddress == address(0)) {
            foodStock memory stock;
            stock.userAddress = stateGovernment;
            stock.foodItemIndex = _foodIndex;
            stock.balanceSupply = _quantity;
            stock.transferHash = _hash;
            foodStocksOf[stateGovernment][_foodIndex] = stock;
            foodStocksOf[centralGovernment][_foodIndex].balanceSupply -= _quantity;
            SupplyCentralToStateGovernment_HashLog(centralGovernment, stateGovernment, _foodIndex, _quantity, expense);
        } else {
            foodStock stk = foodStocksOf[stateGovernment][_foodIndex];
            if (stk.balanceSupply + _quantity < stk.balanceSupply) throw;
            stk.balanceSupply += _quantity;
            stk.transferHash = _hash;
            foodStocksOf[centralGovernment][_foodIndex].balanceSupply -= _quantity;
            SupplyCentralToStateGovernment_HashLog(centralGovernment, stateGovernment, _foodIndex, _quantity, expense);
        }
        // The next function must reset the transferHash after confirmed or cancelled
    }

    // stateGovernment can confirm the food transfered from centralGovernment and pay for it to centralGovernment
    // by looking at the transaction event and providing the secretKey
    function confirm_supplyCentralToStateGovernment_Hash(uint _foodIndex, string _secretKey) returns (bool) {
        if (_foodIndex >= numberOFFoodItems) throw;
        if (foodStocksOf[stateGovernment][_foodIndex].userAddress == address(0)) throw;
        if (foodStocksOf[stateGovernment][_foodIndex].transferHash == bytes32(0)) throw;
        bytes32 newHashCalculated = sha3(_secretKey);
        bytes32 transferHash = foodStocksOf[stateGovernment][_foodIndex].transferHash;
        if (newHashCalculated != transferHash)
            return false;
        // lands here only when newHashCalculated == transferHash
        foodStocksOf[stateGovernment][_foodIndex].transferHash = bytes32(0);
        return true;
    }

    // centralGovernment can cancel the food transfered to stateGovernment if the stateGovernment hasn't confirmed it after sometime
    // by looking at the transaction event
    function cancel_supplyCentralToStateGovernment_Hash(uint _foodIndex, uint _quantity) returns (bool) {
        if (_quantity == 0) throw;
        if (_foodIndex >= numberOFFoodItems) throw;
        if (foodStocksOf[stateGovernment][_foodIndex].userAddress == address(0) || foodStocksOf[centralGovernment][_foodIndex].userAddress == address(0)) throw;
        if (foodStocksOf[stateGovernment][_foodIndex].transferHash == bytes32(0)) throw; // cannot cancel when already confirmed / transfer doesn't exits
        foodStocksOf[stateGovernment][_foodIndex].balanceSupply -= _quantity;
        foodStocksOf[centralGovernment][_foodIndex].balanceSupply += _quantity;
        foodStocksOf[stateGovernment][_foodIndex].transferHash = bytes32(0);
        return true;
    }

    // Use food item price with Rupee contract to make transfer
    function supplyToFPS(address _fps, uint _foodIndex) {
        if (_foodIndex >= numberOFFoodItems) throw;
        uint _fixed;
        _fixed = foodItemsList[_foodIndex].fixedQuantityToSupplyToFPS;
        if (foodStocksOf[stateGovernment][_foodIndex].balanceSupply < _fixed) throw;
        if (foodStocksOf[_fps][_foodIndex].userAddress == address(0)) {
            foodStock memory stock;
            stock.userAddress = _fps;
            stock.foodItemIndex = _foodIndex;
            stock.balanceSupply = _fixed;
            foodStocksOf[_fps][_foodIndex] = stock;
            foodStocksOf[stateGovernment][_foodIndex].balanceSupply -= _fixed;
            SupplyToFPSLog(stateGovernment, _fps, _foodIndex, _fixed);
        } else {
            foodStock stk = foodStocksOf[_fps][_foodIndex];
            if (stk.balanceSupply + _fixed < stk.balanceSupply) throw;
            stk.balanceSupply += _fixed;
            foodStocksOf[stateGovernment][_foodIndex].balanceSupply -= _fixed;
            SupplyToFPSLog(stateGovernment, _fps, _foodIndex, _fixed);
        }
    }

    function supplyToFPS_Hash(address _fps, uint _foodIndex, bytes32 _hash) {
        if (_foodIndex >= numberOFFoodItems) throw;
        if (stateGovernment == address(0)) throw;
        uint _fixed;
        _fixed = foodItemsList[_foodIndex].fixedQuantityToSupplyToFPS;
        // Previous transfer not completed by stateGovernment
        if (foodStocksOf[stateGovernment][_foodIndex].transferHash != bytes32(0)) throw;
        // Previous transfer not completed by fps
        if (foodStocksOf[_fps][_foodIndex].transferHash != bytes32(0)) throw;
        if (foodStocksOf[stateGovernment][_foodIndex].balanceSupply < _fixed) throw;
        if (foodStocksOf[_fps][_foodIndex].userAddress == address(0)) {
            foodStock memory stock;
            stock.userAddress = _fps;
            stock.foodItemIndex = _foodIndex;
            stock.balanceSupply = _fixed;
            stock.transferHash = _hash;
            foodStocksOf[_fps][_foodIndex] = stock;
            foodStocksOf[stateGovernment][_foodIndex].balanceSupply -= _fixed;
            SupplyToFPS_HashLog(stateGovernment, _fps, _foodIndex, _fixed);
        } else {
            foodStock stk = foodStocksOf[_fps][_foodIndex];
            if (stk.balanceSupply + _fixed < stk.balanceSupply) throw;
            stk.balanceSupply += _fixed;
            stk.transferHash = _hash;
            foodStocksOf[stateGovernment][_foodIndex].balanceSupply -= _fixed;
            SupplyToFPS_HashLog(stateGovernment, _fps, _foodIndex, _fixed);
        }
        // The next function must reset the transferHash after confirmed or cancelled
    }

    // fps can confirm the food transfered from stateGovernment
    // by looking at the transaction event and providing the secretKey
    function confirm_supplyToFPS_Hash(address _fps, uint _foodIndex, string _secretKey) returns (bool) {
        if (_foodIndex >= numberOFFoodItems) throw;
        if (foodStocksOf[_fps][_foodIndex].userAddress == address(0)) throw;
        if (foodStocksOf[_fps][_foodIndex].transferHash == bytes32(0)) throw;
        bytes32 newHashCalculated = sha3(_secretKey);
        bytes32 transferHash = foodStocksOf[_fps][_foodIndex].transferHash;
        if (newHashCalculated != transferHash)
            return false;
        // lands here only when newHashCalculated == transferHash
        foodStocksOf[_fps][_foodIndex].transferHash = bytes32(0);
        return true;
    }

    // stateGovernment can cancel the food transfered to fps if the fps hasn't confirmed it after sometime
    // by looking at the transaction event
    function cancel_supplyToFPS_Hash(address _fps, uint _foodIndex, uint _quantity) returns (bool) {
        if (_foodIndex >= numberOFFoodItems) throw;
        if (_quantity == 0) throw;
        if (foodStocksOf[_fps][_foodIndex].userAddress == address(0) || foodStocksOf[stateGovernment][_foodIndex].userAddress == address(0)) throw;
        if (foodStocksOf[_fps][_foodIndex].transferHash == bytes32(0)) throw; // cannot cancel when already confirmed / transfer doesn't exits
        foodStocksOf[_fps][_foodIndex].balanceSupply -= _quantity;
        foodStocksOf[stateGovernment][_foodIndex].balanceSupply += _quantity;
        foodStocksOf[_fps][_foodIndex].transferHash = bytes32(0);
        return true;
    }

    // Use food item price with Rupee contract to make transfer
    // _qty is fixedQuantityToSellToCustomer when using the Fixed Scheme and
    // _qty is _quantity provided by customer when using the Flexible Scheme
    function fpsSupplyToCustomer(address _fps, address _customer, uint _foodIndex, uint _quantity) {
        if (_foodIndex >= numberOFFoodItems) throw;
        uint _qty;
        if (_quantity == 0)
            _qty = foodItemsList[_foodIndex].fixedQuantityToSellToCustomer;
        else
            _qty = _quantity;
        if (foodStocksOf[_fps][_foodIndex].balanceSupply < _qty) throw;
        uint _cost = foodItemsList[_foodIndex].sellingPrice * _qty;
        if (foodStocksOf[_customer][_foodIndex].userAddress == address(0)) {
            foodStock memory stock;
            stock.userAddress = _customer;
            stock.foodItemIndex = _foodIndex;
            stock.balanceSupply = _qty;
            foodStocksOf[_customer][_foodIndex] = stock;
            foodStocksOf[_fps][_foodIndex].balanceSupply -= _qty;
            SellToCustomerLog(_fps, _customer, _foodIndex, _qty, _cost);
        } else {
            foodStock stk = foodStocksOf[_customer][_foodIndex];
            if (stk.balanceSupply + _qty < stk.balanceSupply) throw;
            stk.balanceSupply += _qty;
            foodStocksOf[_fps][_foodIndex].balanceSupply -= _qty;
            SellToCustomerLog(_fps, _customer, _foodIndex, _qty, _cost);
        }
    }

    // -> Accept a secret key and finds its sha3, then compare with the transferHash of this
    //    fooditem of this customer's foodStock to confirm the transfer
    function fpsSupplyToCustomer_Hash(address _fps, address _customer, uint _foodIndex, uint _quantity, bytes32 _hash) {
        if (_foodIndex >= numberOFFoodItems) throw;
        // Previous transfer not completed by fps
        if (foodStocksOf[_fps][_foodIndex].transferHash != bytes32(0)) throw;
        // Previous transfer not completed by customer
        if (foodStocksOf[_customer][_foodIndex].transferHash != bytes32(0)) throw;
        uint _fixed;
        if (_quantity == 0)
            _fixed = foodItemsList[_foodIndex].fixedQuantityToSellToCustomer;
        else
            _fixed = _quantity;
        if (foodStocksOf[_fps][_foodIndex].balanceSupply < _fixed) throw;
        var amount = foodItemsList[_foodIndex].sellingPrice * _fixed;
        if (foodStocksOf[_customer][_foodIndex].userAddress == address(0)) {
            foodStock memory stock;
            stock.userAddress = _customer;
            stock.foodItemIndex = _foodIndex;
            stock.balanceSupply = _fixed;
            stock.transferHash = _hash;
            foodStocksOf[_customer][_foodIndex] = stock;
            foodStocksOf[_fps][_foodIndex].balanceSupply -= _fixed;
            SellToCustomer_HashLog(_fps, _customer, _foodIndex, _fixed, amount);
        } else {
            foodStock stk = foodStocksOf[_customer][_foodIndex];
            if (stk.balanceSupply + _quantity < stk.balanceSupply) throw;
            stk.balanceSupply += _fixed;
            stk.transferHash = _hash;
            foodStocksOf[_fps][_foodIndex].balanceSupply -= _fixed;
            SellToCustomer_HashLog(_fps, _customer, _foodIndex, _fixed, amount);
        }
        // The next function must reset the transferHash after confirmed or cancelled
    }

    // Customer can confirm the food transfered from fps and pay for it to stateGovernment
    // by looking at the transaction event
    function confirm_fpsSupplyToCustomer_Hash(address _customer, uint _foodIndex, string _secretKey) returns (bool) {
        if (_foodIndex >= numberOFFoodItems) throw;
        if (foodStocksOf[_customer][_foodIndex].userAddress == address(0)) throw;
        if (foodStocksOf[_customer][_foodIndex].transferHash == bytes32(0)) throw;
        bytes32 newHashCalculated = sha3(_secretKey);
        bytes32 transferHash = foodStocksOf[_customer][_foodIndex].transferHash;
        if (newHashCalculated != transferHash)
            return false;
        // lands here only when newHashCalculated == transferHash
        foodStocksOf[_customer][_foodIndex].transferHash = bytes32(0);
        return true;
    }

    // FPS can cancel the food transfered to customer if the customer hasn't confirmed it after sometime
    // by looking at the transaction event
    function cancel_fpsSupplyToCustomer_Hash(address _fps, address _customer, uint _foodIndex, uint _quantity) returns (bool) {
        if (_quantity == 0) throw;
        if (_foodIndex >= numberOFFoodItems) throw;
        if (foodStocksOf[_customer][_foodIndex].userAddress == address(0) || foodStocksOf[_fps][_foodIndex].userAddress == address(0)) throw;
        if (foodStocksOf[_customer][_foodIndex].transferHash == bytes32(0)) throw; // cannot cancel when already confirmed
        foodStocksOf[_customer][_foodIndex].balanceSupply -= _quantity;
        foodStocksOf[_fps][_foodIndex].balanceSupply += _quantity;
        foodStocksOf[_customer][_foodIndex].transferHash = bytes32(0);
        return true;
    }

    function getFoodStockHashOf(address _customer, uint _foodIndex) constant returns (bytes32) {
        return foodStocksOf[_customer][_foodIndex].transferHash;
    }

    function getFoodStock(address _userAddr, uint _foodIndex) constant returns (uint)  {
        uint balance;
        if (foodStocksOf[_userAddr][_foodIndex].userAddress != address(0)) {
            balance = foodStocksOf[_userAddr][_foodIndex].balanceSupply;
        }
        return balance;
    }

    function getFoodItem(uint _index) constant returns (string, uint, uint, string, uint, uint) {
        if (_index >= numberOFFoodItems) throw;
        string memory food;
        uint qty1;
        uint qty2;
        string memory unit;
        uint cPrice;
        uint sPrice;
        bytes storage foodName = bytes(foodItemsList[_index].foodName);
        if (foodName.length > 0) {
            food = foodItemsList[_index].foodName;
            qty1 = foodItemsList[_index].fixedQuantityToSellToCustomer;
            qty2 = foodItemsList[_index].fixedQuantityToSupplyToFPS;
            unit = foodItemsList[_index].unitOfMeasurement;
            cPrice = foodItemsList[_index].costPrice;
            sPrice = foodItemsList[_index].sellingPrice;
        }
        return (food, qty1, qty2, unit, cPrice, sPrice);
    }



    /* Implement Universla Cash Card ~ Offline & Online Sync ups */
    /* Use of a Hashed value and a Private Key to get the Hashed value */
    /* in order to confirm food and money transfer between the 2 parties */

    // To prevent accidental sending of ether to this contract
    // so funds are not locked in the contract forever
    function destroy() onlyGovernment {
        suicide(centralGovernment); // suicides the curret contract and sends the funds to the given address
    }

}
