// Import the page's CSS. Webpack will know what to do with it.
import "../../stylesheets/app.css";
import "../../stylesheets/sidebar.css";
import "../../stylesheets/central-government.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

import food_artifacts from '../../../build/contracts/Food.json';
import rupee_artifacts from '../../../build/contracts/Rupee.json';
import user_artifacts from '../../../build/contracts/User.json';
import approval_artifacts from '../../../build/contracts/Approval.json';
import rationCard_artifacts from '../../../build/contracts/RationCard.json';

var Food = contract(food_artifacts);
var Rupee = contract(rupee_artifacts);
var User = contract(user_artifacts);
var Approval = contract(approval_artifacts);
var RationCard = contract(rationCard_artifacts);

var accounts, centralGovernmentAddress, stateGovernmentAddress;
var foodGlobal, rupeeGlobal, userGlobal, approvalGlobal, rationCardGlobal;

// get all accounts and store whoever is registered
var userDb = {};

var i, loadUserInterval;
var foodItems = {};
var j, foodItemInterval;
var loggedIn = false;

window.centralFoodApp = {
    start: function() {
        var self = this;
        Food.setProvider(web3.currentProvider);
        Food.deployed().then(function(instance){
            foodGlobal = instance;
            console.log(foodGlobal);
        });

        Rupee.setProvider(web3.currentProvider);
        Rupee.deployed().then(function(instance){
            rupeeGlobal = instance;
            console.log(rupeeGlobal);
        });

        User.setProvider(web3.currentProvider);
        User.deployed().then(function(instance){
            userGlobal = instance;
            console.log(userGlobal);
        });

        Approval.setProvider(web3.currentProvider);
        Approval.deployed().then(function(instance){
            approvalGlobal = instance;
            console.log(approvalGlobal);
        });

        RationCard.setProvider(web3.currentProvider);
        RationCard.deployed().then(function(instance){
            rationCardGlobal = instance;
            console.log(rationCardGlobal);
        });

        web3.eth.getAccounts(function(err, accs){
            if (err) {
                alert("Error loading accounts");
                return;
            }
            if (accs.length == 0) {
                alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
                return;
            }
            accounts = accs;
            centralGovernmentAddress = accounts[0];
            stateGovernmentAddress = accounts[1];
            console.log("centralGovernmentAddress => " + centralGovernmentAddress);
            console.log("stateGovernmentAddress => " + stateGovernmentAddress);
            Food.deployed().then(function(instance){
                foodGlobal = instance;
                return foodGlobal.stateGovernment.call();
            }).then(function(addr){
                if (addr.valueOf() == "0x0000000000000000000000000000000000000000") {
                    return foodGlobal.setStateGovernmentAddress(stateGovernmentAddress, {from: centralGovernmentAddress});
                }
            }).then(function(res){
                console.log("food setStateGovernmentAddress => " + res);
                // self.loadUsers();
            }).catch(function(e){
                console.log(e);
            })
            Rupee.deployed().then(function(instance){
                rupeeGlobal = instance;
                return rupeeGlobal.stateGovernment.call();
            }).then(function(addr){
                if (addr.valueOf() == "0x0000000000000000000000000000000000000000") {
                    return rupeeGlobal.setStateGovernmentAddress(stateGovernmentAddress, {from: centralGovernmentAddress});
                }
            }).then(function(res){
                console.log("rupee setStateGovernmentAddress => " + res);
                self.loadUsers();
            }).catch(function(e){
                console.log(e);
            })
        });
    },

    loadUsers: function() {
        var self = this;
        $("#loading-content-text").html("Loading accounts from testrpc ...");
        i = 0;
        loadUserInterval = setInterval(self.checkUserRegistered, 150);
    },

    checkUserRegistered: function() {
        var self = this;
        userGlobal.checkUserRegistered.call(accounts[i]).then(function(res){
            console.log(accounts[i] + " => " + res);
            userDb[accounts[i]] = res;
            i++;
            if (i == accounts.length) {
              i = 0;
              clearInterval(loadUserInterval);
              console.log("Finished loading/checking user registrations");
              window.centralFoodApp.checkCookies();
            //   userDb[centralGovernmentAddress] = true;
            //   userDb[stateGovernmentAddress] = true;
            }
        }).catch(function(e){
            console.log(e);
            return;
        });
    },

    checkCookies: function() {
        var self = this;
        $("#loading-content-text").html("Checking cookies ...");
        var login = self.checkLoginSessionCookie();
        if (login) {
            // console.log(document.cookie);
            var cookies = document.cookie.split("; ");
            var cookieAddr;
            for (var a = 0; a < cookies.length; a++) {
                if (cookies[a].split("=")[0] == "central") {
                    cookieAddr = cookies[a].split("=")[1].split("*")[0];
                    break;
                }
            }
            if (cookieAddr) {
                User.deployed().then(function(instance) {
                    userGlobal = instance;
                    return userGlobal.getUserDetails.call(cookieAddr, {from: centralGovernmentAddress});
                }).then(function(userinfo) {
                    if (userinfo[0] == cookieAddr) {
                        $("#register-link").remove();
                        $("#login-link").remove();
                        $("#profile-link").show();
                        document.getElementById('profile-name').innerHTML = userinfo[1];
                        $("#not-logged-div-card").hide();
                        loggedIn = true;
                        window.centralFoodApp.getFoodItems();
                        // $("#loadingOverlay").hide();
                        return;
                    } else {
                        self.notLoggedIn();
                    }
                }).catch(function(e){
                    console.log(e);
                    return;
                });
            } else {
                self.notLoggedIn();
            }
        } else {
            self.notLoggedIn();
        }
    },

    getFoodItems: function() {
        var self= this;
        $("#loading-content-text").html("Loading Food Items List ...");

        j = 0;
        foodItemInterval = setInterval(self.getFood, 300);
    },

    getFood: function() {
        var self = this;

        Food.deployed().then(function(instance){
            foodGlobal = instance;
            return foodGlobal.getFoodItem.call(j);
        }).then(function(value){
            foodItems[j] = value;
            j++;
        }).catch(function(e){
            // console.log(e);
            j = 0;
            clearInterval(foodItemInterval);
            console.log("Finished getting food items");
            console.log(foodItems);
            window.centralFoodApp.populateFoodItems();
        });
    },

    populateFoodItems: function() {
        var self = this;
        $("#loading-content-text").html("Populating food items to DOM elements ...");

        var selectLi = document.getElementById("food-item-list");
        var selectLiSupply = document.getElementById("food-item-list-supply-state");
        // var selectLiSell = document.getElementById("food-item-list-sell");
        // var selectLiStockBalance = document.getElementById("food-item-list-for-stock-balance");
        for (var index in foodItems) {
            if (foodItems.hasOwnProperty(index)) {
                var opt1  = document.createElement("option");
                opt1.value = index;
                opt1.innerHTML = foodItems[index][0];
                selectLi.appendChild(opt1);

                var opt2  = document.createElement("option");
                opt2.value = index;
                opt2.innerHTML = foodItems[index][0];
                selectLiSupply.appendChild(opt2);

                // var opt3  = document.createElement("option");
                // opt3.value = index;
                // opt3.innerHTML = foodItems[index][0];
                // selectLiSell.appendChild(opt3);
                //
                // var opt4  = document.createElement("option");
                // opt4.value = index;
                // opt4.innerHTML = foodItems[index][0];
                // selectLiStockBalance.appendChild(opt4);
            }
        }
        setTimeout(self.hideOverlay, 1000);
    },

    hideOverlay: function() {
        $("#loadingOverlay").hide();
    },

    createFoodItem: function() {
        var self = this;

        var name = document.getElementById("item-name");
        var qty1 = document.getElementById("qty-sell-customer");
        var qty2 = document.getElementById("qty-supply-fps");
        var unit = document.getElementById("unit-measurement");
        var costP = document.getElementById("cost-price");
        var sellP = document.getElementById("selling-price");
        if (name.value == "" || qty1.value == "" || qty2.value == "" || unit.value == ""
            || costP.value == "" || sellP.value == "" || costP.value <= 0 || sellP.value <= 0) {
            return;
        }
        Food.deployed().then(function(instance){
            foodGlobal = instance;
            return foodGlobal.createFoodItem(name.value, qty1.value, qty2.value, unit.value, costP.value, sellP.value, {from: centralGovernmentAddress, gas: 250000});
        }).then(function(res){
            console.log(res);
            // notify.setAttribute("class", "alert alert-success col-md-6");
            // notify.innerHTML = "New food item <strong>" + name.value + "</strong> created";
            // notify.style.display = "block";
            alert("*** FoodItem ***\n" +
                    "Item: " + name.value + "\n" +
                    "fixedQuantityToSellToCustomer: " + qty1.value + "\n" +
                    "fixedQuantityToSupplyToFPS: " + qty2.value + "\n" +
                    "unitOfMeasurement: " + unit.value + "\n" +
                    "costPrice: " + costP.value + "\n" +
                    "sellingPrice: " + sellP.value + "\n\n" + "*** Created Successfully ***");
            name.value = "";
            qty1.value = "";
            qty2.value = "";
            unit.value = "";
            costP.value = "";
            sellP.value = "";
            // location.reload();
        }).catch(function(e){
            console.log(e);
            // notify.setAttribute("class", "alert alert-danger col-md-12");
            // notify.innerHTML = "New food item was not created. Error: " + e;
            // notify.style.display = "block";
        });
    },

    addFoodToStock: function() {
        var self = this;

        var li = document.getElementById("food-item-list");
        var foodindex = li.options[li.selectedIndex].value;
        if (foodindex == -1) {
            alert("Select a food item");
            // console.log("Select Food Item to add to Stock");
            return;
        }
        var qty = document.getElementById("add-item-qty");
        if (qty.value == "" || qty.value <= 0) {
            return;
        }
        Food.deployed().then(function(instance){
            foodGlobal = instance;
            return foodGlobal.addFoodItemToStock(foodindex, qty.value, {from: centralGovernmentAddress, gas: 100000});
        }).then(function(res){
            console.log(res);
            // notify.setAttribute("class", "alert alert-success col-md-6");
            // notify.innerHTML = "<strong>" + li.options[li.selectedIndex].text + " | Qty : " + qty.value + "</strong>, added to government's food stock";
            // notify.style.display = "block";
            alert("FoodItem: " + li.options[li.selectedIndex].text + " Qty: " + qty.value + "\n" + "Added to centralGovernment food stock");
            qty.value = "";
            li.selectedIndex = 0;
            // location.reload();
        }).catch(function(e){
            console.log(e);
            // notify.setAttribute("class", "alert alert-danger col-md-12");
            // notify.innerHTML = "Could not add to government's food stock. Error: " + e;
            // notify.style.display = "block";
        });
    },

    supplyToState: function() {
        var self = this;
        var fooditem = document.getElementById("food-item-list-supply-state");
        var itemqty = document.getElementById("supply-to-state-item-qty");
        var itemhash = document.getElementById("supply-to-state-item-hash");
        if (fooditem.selectedIndex == 0 || itemqty.value == "" || itemqty.value <= 0 || itemhash.value == "") {
            return;
        }
        Food.deployed().then(function(instance) {
            foodGlobal = instance;
            return foodGlobal.supplyCentralToStateGovernment_Hash(fooditem.options[fooditem.selectedIndex].value, itemqty.value, itemhash.value, {from: centralGovernmentAddress, gas: 200000});
        }).then(function(res){
            console.log(res);
            alert("FoodItem: " + fooditem.options[fooditem.selectedIndex].text + " Qty: " + itemqty.value + " sent to stateGovernment: " + stateGovernmentAddress);
            fooditem.selectedIndex = 0;
            itemqty.value = "";
            itemhash.value = "";
        }).catch(function(e){
            console.log(e);
        });
    },

    addBudgetToState: function() {
        var self = this;

        var budgetValue = document.getElementById("add-budget-value");
        var password = document.getElementById("central-government-password");
        if (budgetValue.value == "" || budgetValue.value == 0) {
            return;
        }
        if (password.value == "") {
            return;
        }
        User.deployed().then(function(instance){
            userGlobal = instance;
            return userGlobal.authenticateUserWithAddress.call(centralGovernmentAddress, password.value);
        }).then(function(res){
            if (!res) {
                alert("Failed to authenticate, password is in correct");
                budgetValue.value = "";
                password.value = "";
                return;
            }
            Rupee.deployed().then(function(instance){
                rupeeGlobal = instance;
                return rupeeGlobal.addBudget(budgetValue.value, {from: centralGovernmentAddress});
            }).then(function(res){
                console.log(res);
                alert("Budget added to state government successfully");
                budgetValue.value = "";
                password.value = "";
            }).catch(function(e){
                console.log(e);
            });
        }).catch(function(e){
            console.log(e);
        })
    },

    addMoneyToCustomer: function() {
        var self = this;

        var custaddr = document.getElementById("add-money-customer-addr");
        var moneyValue = document.getElementById("add-money-value");
        var password = document.getElementById("central-government-password-2");
        if (moneyValue.value == "" || moneyValue.value == 0 || custaddr.value == "") {
            return;
        }
        if (password.value == "") {
            return;
        }
        User.deployed().then(function(instance){
            userGlobal = instance;
            return userGlobal.authenticateUserWithAddress.call(centralGovernmentAddress, password.value);
        }).then(function(res){
            if (!res) {
                alert("Failed to authenticate, password is in correct");
                moneyValue.value = "";
                password.value = "";
                return;
            }
            Rupee.deployed().then(function(instance){
                rupeeGlobal = instance;
                return rupeeGlobal.addMoney(custaddr.value, moneyValue.value, {from: centralGovernmentAddress});
            }).then(function(res){
                console.log(res);
                alert("Money " + moneyValue.value + " added to customer: " + custaddr.value + " successfully");
                custaddr.value = ""
                moneyValue.value = "";
                password.value = "";
            }).catch(function(e){
                console.log(e);
            });
        }).catch(function(e){
            console.log(e);
        })
    },

    notLoggedIn: function() {
        var self = this;
        $("#profile-link").hide();
        $("#not-logged-div-card").show();
        $("#loadingOverlay").hide();
        $("#landing").show();
    },

    showHome: function() {
        var self = this;
        self.hideAll();
        var landing = document.getElementById('landing');
        landing.style.display = "block";
    },

    hideAll: function() {
        var all = document.getElementById('main');
        var nodes = all.childNodes;
        // console.log(nodes);
        for (var i = 1; i < nodes.length; i+=2) {
            nodes[i].style.display = "none";
        }
    },

    showCreateFoodItemdiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#create-food-item-div").show();
        }
    },

    showAddFoodToStockdiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#add-food-item-div").show();
        }
    },

    showSupplyToStateDiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#supply-to-state-div").show();
        }
    },

    showAddBudgetToStatediv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#add-budget-to-state-div").show();
        }
    },

    showAddMoneyToCustomerdiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#add-money-to-customer-div").show();
        }
    },

    checkLoginSessionCookie: function() {
        if (document.cookie.length == 0)
            return false;
        return true;
    },

    logout: function() {
        document.cookie = "central=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // document.cookie = "address=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // document.cookie = "name=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // document.cookie = "email=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // document.cookie = "usertype=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // document.cookie = "place=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        location.reload();
    },

};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    // console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    console.warn("No web3 detected. Falling back to http://localhost:8080. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    // window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8080"));
  }

  // cal start funtion
  centralFoodApp.start();
});
