pragma solidity ^0.4.0;

contract Transactions{
	address public government;
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

  event BudgetAddedToGovernment(address indexed _governmentAddress, uint _budget);
  event PaymentMadeToGPC(address indexed _governmentAddress , address indexed _gpc, uint _amount);
  event PaymentMadeToWager(address indexed _gpc, address indexed _wager, uint _hoursPaidFor, uint _amount);
	event WagerWorkedHours(address indexed _wager, uint _hours); // check/verify

	// Implement a functionality that uses hashes concept
	// (private/public key concept as used in food contract) to verify the hours worked by a wager
	// and also GPC has paid a wager for amount of time he/she has worked for

  function Transactions() {
    government = tx.origin;
    fixedWagerPaymentperhr = 100;
    fixedPaymentToGPC = 50000;
  }

  function addBudget(uint _budget) onlyGovernment returns (bool) {
		if (balances[government].receiver == address(0)) {
			paymentMade memory newGovernmentPay;
			newGovernmentPay.balance = _budget;
			newGovernmentPay._type = 0;
			newGovernmentPay.receiver = government;
			balances[government] = newGovernmentPay;
			BudgetAddedToGovernment(government, _budget);
		} else {
			balances[government] += _budget;
			BudgetAddedToGovernment(government, _budget);
		}
		return true;
	}

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
		uint totalPaymentToWager;
		uint hoursPaidFor;
		totalPaymentToWager = fixedWagerPaymentperhr * getTotalHoursWorked(_wager);
		if (totalPaymentToWager == 0) throw;
		if(balances[_wager].receiver == address(0)){
			if(balances[_gpc].balance < totalPaymentToWager) throw;
			paymentMade memory newUser;
			newUser._type = 2;
			newUser.balance = totalPaymentToWager;
			newUser.receiver = _wager;
			balances[_wager] = newUser;
			balances[_gpc].balance -= totalPaymentToWager;
			hoursPaidFor = totalPaymentToWager / fixedWagerPaymentperhr;
			PaymentMadeToWager(_gpc, _wager, hoursPaidFor, totalPaymentToWager);
		}
		else{
			// get previous balance of wager
			uint prevBal = balances[_wager].balance;
			// and then subtract it from the totalPaymentToWager to get the current due amount to be paid
			uint currentDueToPay = totalPaymentToWager - prevBal;
			if(balances[_gpc].balance < currentDueToPay) throw;
			balances[_wager].balance += currentDueToPay;
			balances[_gpc].balance -= currentDueToPay;
			hoursPaidFor = currentDueToPay / fixedWagerPaymentperhr;
			PaymentMadeToWager(_gpc, _wager, hoursPaidFor, currentDueToPay);
		}
		return true;
  }

  function hoursWorked(address _wager) returns (bool) {
    if(hourWorked[_wager].user == address(0)) {
			wagers1 memory newUser;
      newUser.hours1 = 1;
      newUser.flag = true;
      newUser.days1 = 0;
      newUser.user = _wager;
      hourWorked[_wager] = newUser;
			// also create paymentMade struct for the new user
			paymentMade memory newUserPayment;
			newUserPayment._type = 2;
			newUserPayment.balance = 0;
			newUserPayment.receiver = _wager;
			balances[_wager] = newUserPayment;
			WagerWorkedHours(_wager, 1);
			return true;
    }
		if(hourWorked[_wager].flag == false) throw;
		if(hourWorked[_wager].days1 == 120){
			hourWorked[_wager].flag = false;
			return false;
		}
  	if((hourWorked[_wager].hours1 < 7) && (hourWorked[_wager].days1 < 120)){
  		hourWorked[_wager].hours1 += 1;
			WagerWorkedHours(_wager, 1);
			return true;
  	}
    if(((hourWorked[_wager].hours1 + 1) == 8) && (hourWorked[_wager].days1 < 120)){
    	hourWorked[_wager].hours1 = 0;
    	hourWorked[_wager].days1 += 1;
			WagerWorkedHours(_wager, 1);
			return true;
    }
  }

  function timeWorked(address _wager, uint _days, uint _hours) returns (bool) {
		if(_days > 120) throw;
  	if(_hours >= 8) {
  		_days += (_hours / 8);
  		_hours = _hours % 8;
  	}
  	if(hourWorked[_wager].user == address(0)) {
			wagers1 memory newUser;
      newUser.hours1 = _hours;
      newUser.flag = true;
      newUser.days1 = _days;
      newUser.user = _wager;
      hourWorked[_wager] = newUser;
			// also create paymentMade struct for the new user
			paymentMade memory newUserPayment;
			newUserPayment._type = 2;
			newUserPayment.balance = 0;
			newUserPayment.receiver = _wager;
			balances[_wager] = newUserPayment;
			WagerWorkedHours(_wager, _hours + (_days * 8));
			return true;
  	}
		if((hourWorked[_wager].days1 + _days) > 120) throw;
   	if((hourWorked[_wager].hours1 + _hours) < 8) {
  		hourWorked[_wager].hours1 += _hours;
  		hourWorked[_wager].days1 += _days;
			WagerWorkedHours(_wager, _hours + (_days * 8));
			return true;
  	}
    if((hourWorked[_wager].hours1 + _hours) == 8) {
    	hourWorked[_wager].hours1 = 0;
    	hourWorked[_wager].days1 += 1;
			hourWorked[_wager].days1 += _days;
			WagerWorkedHours(_wager, _hours + (_days * 8));
			return true;
    }
		if((hourWorked[_wager].hours1 + _hours) > 8) {
    	hourWorked[_wager].hours1 = hourWorked[_wager].hours1 + _hours - 8;
    	hourWorked[_wager].days1 += 1;
			hourWorked[_wager].days1 += _days;
			WagerWorkedHours(_wager, _hours + (_days * 8));
			return true;
    }
  }

	// Implemented more functions to get more info
	// to get wager's :
	//		-> pending amount to be paid by gpc for hours/days worked
	//		-> pending hours for which to be paid
	//		-> days and hours worked (not total hours but separately)

	function getWagerWorkedTime(address _wager) constant returns (uint, uint) {
		uint workedHours;
		uint workedDays;
		if (hourWorked[_wager].user != address(0)) {
			workedHours = hourWorked[_wager].hours1;
			workedDays = hourWorked[_wager].days1;
		}
		return (workedDays, workedHours);
	}

	function getDueAmountOfWager(address _wager) constant returns (uint) {
		uint dueAmount;
		if (balances[_wager].receiver != address(0)) {
			dueAmount = fixedWagerPaymentperhr * getTotalHoursWorked(_wager) - balances[_wager].balance;
		}
		return dueAmount;
	}

	function getDueHoursNotPaid(address _wager) constant returns (uint) {
		return getDueAmountOfWager(_wager) / fixedWagerPaymentperhr;
	}

	function validWager(address _wager) constant returns (bool){
		return hourWorked[_wager].flag;
	}

	function getTotalHoursWorked(address _wager) constant returns (uint){
		return hourWorked[_wager].days1 * 8 + hourWorked[_wager].hours1;
	}

	function getTotalDaysWorked(address _cus) constant returns(uint){
		return hourWorked[_cus].days1;
	}

	function getBalance(address _userAddr) constant returns(uint){
		uint balance;
		if(balances[_userAddr].receiver != address(0)){
			balance = balances[_userAddr].balance;
		}
		return balance;
	}

}
