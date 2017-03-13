var Food = artifacts.require("./Food.sol");

contract('Food', function(accounts){
  it("should check the initializations", function(done){
    Food.deployed().then(function(food){
      food.foodName.call().then(function(name){
        assert.equal(name, "Rice", "foodName is not Rice, migration error");
        return food.foodSymbol.call();
      }).then(function(symbol){
        assert.equal(symbol, "@", "foodSymbol is not @, migration error");
        return food.totalSupply.call();
      }).then(function(supply){
        assert.equal(supply, 1000, "totalSupply is not 1000, migration error");
        return food.government.call();
      }).then(function(address){
        assert.equal(address, accounts[0], "government has been hacked, migration error");
        return food.fixedQuantityToSell.call();
      }).then(function(qty){
        assert.equal(qty, 5, "fixedQuantityToSell is not 5, migration error");
        return food.unit.call();
      }).then(function(unit){
        assert.equal(unit, "Kg", "unit is not Kg, migration error");
        return food.foodStocksOf.call(accounts[0]);
      }).then(function(stock){
        assert.equal(stock, 1000, "foodStocksOf government is not 1000, migration error");
        return food.fixedQuantityToSupply.call();
      }).then(function(qty1){
        assert.equal(qty1, 100, "fixedQuantityToSupply is not 100, migration error");
        done();
      }).catch(done);
    }).catch(done);
  });

  it("should add new food stocks to government", function(){
    var food;
    var government = accounts[0];
    var initial, newSuppy = 500;
    var totalNew;

    return Food.deployed().then(function(instance){
      food = instance;
      return food.getFoodStock.call(government);
    }).then(function(stock){
      assert.equal(stock, 1000, "initial foodStocksOf government is not 1000");
      initial = stock.toNumber();
      return food.addToStock(newSuppy);
    }).then(function(){
      return food.getFoodStock.call(government);
    }).then(function(newStock){
      totalNew = initial + newSuppy;
      assert.equal(newStock, totalNew, "new stock wasn't added to foodStocksOf government correctly");
    });
  });

  it("should not add new food stocks to government", function(){
    var food;
    var government = accounts[0];
    var initial, newSuppy = 500;
    var totalNew;

    return Food.deployed().then(function(instance){
      food = instance;
      return food.getFoodStock.call(government);
    }).then(function(stock){
      initial = stock;
      return food.addToStock(newSuppy, {from: accounts[1]});
    }).then(function(){
      return food.getFoodStock.call(government);
    }).then(function(newStock){
      assert.equal(newStock, initial, "foodStocksOf government was changed");
      assert(false, "addToStock was supposed to throw but didn't");
    }).catch(function(error) {
      if(error.toString().indexOf("invalid JUMP") != -1) {
        console.log("We were expecting a Solidity throw (aka an invalid JUMP), we got one. This test succeeded.");
      } else {
        // if the error is something else (e.g., the assert from previous promise), then we fail the test
        assert(false, error.toString());
      }
    });
  });

  it("send supply to a fps", function(){
    var food;
    var government = accounts[0], fps = accounts[1];
    var supply = 10, initialSupply, newStock;

    return Food.deployed().then(function(instance){
      food = instance;
      return food.getFoodStock.call(fps);
    }).then(function(sup){
      initialSupply = sup.valueOf();
      assert.equal(sup.valueOf(), 0, "fps seems to already have some food stocks");
      return food.sendToFPS();
    }).then(function(){
      return food.getFoodStock.call(fps);
    }).then(function(value){
      newStock = initialSupply + supply;
      assert.equal(value, newStock, "fps didn't receive the new stock");
    }).catch(function(error){
      if (error.toString().indexOf("invalid JUMP") != -1) {
        console.log("We were expecting a Solidity throw (aka an invalid JUMP), we got one. This test failed");
      } else {
        console.log("We were not expecting a Solidity throw (aka an invalid JUMP), we didn't get one. This test succeeded");
      }
    });
  });

  it("should supply food to customer", function(){
    var food;
    var government = accounts[0], fps = accounts[1], customer = accounts[2];
    var initialBalance, newBalance,  totalBalance;
    var supply, diff1, diff2;
    var initialStock, newStock, totalStock;

    return Food.deployed().then(function(instance){
      food = instance;
      return food.getFoodStock.call(customer);
    }).then(function(value){
      initialBalance = value;
      return food.fixedQuantityToSell.call();
    }).then(function(fixedQty){
      supply = fixedQty;
      return food.sendToFPS();
    }).then(function(){
      return food.getFoodStock.call(fps);
    }).then(function(initStock){
      initialStock = initStock;
      return food.sendToCustomer(fps, customer);
    }).then(function(){
      return food.getFoodStock.call(customer);
    }).then(function(newB){
      newBalance = newB;
      return food.getFoodStock.call(fps);
    }).then(function(newS){
      newStock = newS;

      totalBalance = initialBalance + supply;
      assert.equal(newBalance, totalBalance, "customer didn't get the food");

      totalStock = initialStock - supply;
      assert.equal(newStock, totalStock, "fps didn't send the food");
    }).catch(function(error){
      if (error.toString().indexOf("invalid JUMP") != -1) {
        console.log("We were expecting a Solidity throw (aka an invalid JUMP), we got one. This test failed");
      } else {
        console.log("We were not expecting a Solidity throw (aka an invalid JUMP), we didn't get one. This test succeeded");
      }
    });
  });

});
