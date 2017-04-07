pragma solidity ^0.4.0;

////////////////////////////////////////////////////////////////////////////////
// TODO: change code/ optimize/ fix/ validations
////////////////////////////////////////////////////////////////////////////////

contract Transactions{
	address public government;
	/*uint public noOfTransactions;*/ // remove this, unnecessary
  uint fixedWagerPaymentperhr;
  uint fixedPaymentToGPC;

  mapping (address => paymentMade) balances;
  mapping (address => wagers1) hourWorked;

  struct paymentMade{
    uint _type;
    uint balance;
		//address sender;
    address receiver;
  }

  struct wagers1{
    uint hours1;
    uint days1;
    bool flag;
    address user;
  }

  modifier onlyGovernment{
    if (msg.sender != government) throw;
    _;
	}

	//////////////////////////////////////////////////////////////////////////////
	// fix these events asap
	//////////////////////////////////////////////////////////////////////////////
  event GovernmentInitialized(address indexed _governmentAddress, uint _balance);
  event PaymentMadeToGPC(address indexed _governmentAddress , address indexed _gpc, uint _gpcBal);
  event PaymentMadeToWager(address indexed _gpc, address indexed _wager, uint _hours1, uint _wagerBal);

  function Transactions() {
		// fix
    government = tx.origin;
    /*noOfTransactions = 0;*/
    fixedWagerPaymentperhr = 100;
    fixedPaymentToGPC = 50000;
    //balances[government].balance = 1000000;

  }

	// Wrong way
	// move this to constructor of the contract
	////////////////////////////////////////////////////////////////////////////
	// provide a way to add more budget rather than a hardcoded value ??
	////////////////////////////////////////////////////////////////////////////
  function initializeGov() returns (uint) {
		uint bal;
		paymentMade memory govbal;
  	govbal.balance = 10000000;
    govbal._type = 0;
    govbal.receiver = government;
    balances[government] = govbal;
		/*noOfTransactions +=1;*/
		bal = balances[government].balance;
		GovernmentInitialized(government, bal);
  	return bal;
	}

	// remove this, unnecessary
  /*function getNoOfTransactions() constant returns (uint) {
  	return noOfTransactions;
  }*/

  function supplyToGPC(address _gpc) onlyGovernment returns (bool) {
		if (balances[government].balance < fixedPaymentToGPC) throw;
    if(balances[_gpc].receiver == address(0)) {
			paymentMade memory newUser;
			newUser._type = 1;
			newUser.balance = fixedPaymentToGPC;
			newUser.receiver = _gpc;
			balances[_gpc] = newUser;
			balances[government].balance -= fixedPaymentToGPC;
			PaymentMadeToGPC(government, _gpc, fixedPaymentToGPC);
    }
    else{
			balances[_gpc]._type = 1;
			balances[_gpc].balance += fixedPaymentToGPC;
			balances[government].balance -= fixedPaymentToGPC;
			PaymentMadeToGPC(government, _gpc, fixedPaymentToGPC);
    }
  	return true;
  }

  function payToWager(address _wager, address _gpc) returns (bool) {
		if(balances[_gpc].receiver == address(0)) throw;
		if(balances[_gpc].balance < paymentToWager) throw;
		uint paymentToWager = fixedWagerPaymentperhr * hourWorked[_wager].days1 * 8 + fixedWagerPaymentperhr * hourWorked[_wager].hours1;
		if (paymentToWager == 0) throw;
		if(balances[_wager].receiver == address(0)){
			paymentMade memory newUser;
			newUser._type = 2;
			newUser.balance = paymentToWager;
			newUser.receiver = _wager;
			balances[_wager] = newUser;
			balances[_gpc].balance -= paymentToWager;
			PaymentMadeToWager(_gpc, _wager, hourWorked[_wager].hours1, paymentToWager);
		}
		else{
			balances[_wager].balance += paymentToWager;
			balances[_gpc].balance -= paymentToWager;
			PaymentMadeToWager(_gpc, _wager, hourWorked[_wager].hours1, paymentToWager);
		}
		return true;
  }

	// create an event for this
  function hoursWorked(address _wager) returns (bool) {
    if(hourWorked[_wager].user == address(0)) {
			wagers1 memory newUser;
      newUser.hours1 = 1;
      newUser.flag = true;
      newUser.days1 = 0;
      newUser.user = _wager;
      hourWorked[_wager] = newUser;
			return true;
    }
		if(hourWorked[_wager].flag == false) throw;
  	if(hourWorked[_wager].hours1 < 8 && hourWorked[_wager].days1 < 120){
  		hourWorked[_wager].hours1 += 1;
			return true;
  	}
    if(hourWorked[_wager].hours1 == 8){
    	hourWorked[_wager].hours1 = 0;
    	hourWorked[_wager].days1 += 1;
			return true;
    }
    if(hourWorked[_wager].days1 == 120){
      hourWorked[_wager].flag = false;
			return false;
    }
  }

	// create an event for this
  function timeWorked(address _wager, uint _days, uint _hours) returns (bool) {
		// fix this asap, handle all cases here
		if(_days > 120) throw;
		if(hourWorked[_wager].days1 + _days >= 120) {
			hourWorked[_wager].flag = false;
			return false;
		}
  	if(_hours >= 8) {
  		_days += (_hours/8);
  		_hours = _hours%8;
  	}
  	if(hourWorked[_wager].user == address(0)) {
			wagers1 memory newUser;
      newUser.hours1 = _hours;
      newUser.flag = true;
      newUser.days1 = _days;
      newUser.user = _wager;
      hourWorked[_wager] = newUser;
			return true;
  	}
   	if((hourWorked[_wager].hours1 + _hours) < 8) {
  		hourWorked[_wager].hours1 += _hours;
  		hourWorked[_wager].days1 += _days;
			return true;
  	}
    if((hourWorked[_wager].hours1 + _hours) == 8) {
    	hourWorked[_wager].hours1 = 0;
    	hourWorked[_wager].days1 += 1;
			hourWorked[_wager].days1 += _days;
			return true;
    }
		if((hourWorked[_wager].hours1 + _hours) > 8) {
    	hourWorked[_wager].hours1 = hourWorked[_wager].hours1 + _hours - 8;
    	hourWorked[_wager].days1 += 1;
			hourWorked[_wager].days1 += _days;
			return true;
    }
  }

  function validWager(address _wager) constant returns (bool){
		return hourWorked[_wager].flag;
  }

 	function getHoursWorked(address _wager) constant returns (uint){
		return hourWorked[_wager].days1 * 8 + hourWorked[_wager].hours1;
	}

	function getDaysWorked(address _cus) constant returns(uint){
		return hourWorked[_cus].days1;
	}

  function getBalance(address _userAddr) constant returns(uint){
    uint balance1;
    if(balances[_userAddr].receiver != address(0)){
    	balance1 = balances[_userAddr].balance;
    }
    return balance1;
  }

}
