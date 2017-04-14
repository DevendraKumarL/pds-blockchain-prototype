// Import the page's CSS. Webpack will know what to do with it.
import "../../stylesheets/app.css";
import "../../stylesheets/sidebar.css";
import "../../stylesheets/customer.css";

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
var loggedIn = false, customerData, customerApproved = false;
var k, foodStockToCustomerInterval;

var foodStockToCustomerEvents;
var foodStoredMap = {};
foodStoredMap[0] = false;
foodStoredMap[1] = false;
foodStoredMap[2] = false;

window.customerFoodApp = {
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
            self.loadUsers();
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
              window.customerFoodApp.checkCookies();
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
                if (cookies[a].split("=")[0] == "customer") {
                    cookieAddr = cookies[a].split("=")[1].split("*")[0];
                    break;
                }
            }
            if (cookieAddr) {
                User.deployed().then(function(instance) {
                    userGlobal = instance;
                    return userGlobal.getUserDetails.call(cookieAddr);
                }).then(function(userinfo) {
                    if (userinfo[0] == cookieAddr) {
                        $("#register-link").remove();
                        $("#login-link").remove();
                        $("#profile-link").show();
                        document.getElementById('profile-name').innerHTML = userinfo[1];
                        $("#not-logged-div-card").hide();
                        loggedIn = true;
                        customerData = userinfo;
                        console.log("customerData => " + customerData[0]);
                        window.customerFoodApp.getCustomerApprovalStatus()
                        // window.customerFoodApp.getFoodItems();
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

    getCustomerApprovalStatus: function() {
        var self = this;
        $("#loading-content-text").html("Checking Customer approval status ...");
        Approval.deployed().then(function(instance) {
            approvalGlobal = instance;
            return approvalGlobal.getUserApproval.call(customerData[0], 2);
        }).then(function(res){
            console.log(res);
            if (res[1] && res[0] == customerData[0]) {
                customerApproved = true;
                $("not-approved-div-card").hide();
                window.customerFoodApp.getFoodItems();
                return;
            }
            if (!res[1]) {
                $("#loadingOverlay").hide();
                $("#not-approved-div-card").show();
                return;
            }
        })
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
            // window.customerFoodApp.hideOverlay();
            // window.customerFoodApp.populateFoodItems();
            window.customerFoodApp.loadFoodSuppliedToCustomerEvents();
        });
    },

    loadFoodSuppliedToCustomerEvents: function() {
        var self = this;
        $("#loading-content-text").html("Loading food stock supplied to customer events ...");

        var events;
        Food.deployed().then(function(instance){
            foodGlobal = instance;
            events = foodGlobal.SellToCustomer_HashLog({}, {fromBlock: 0, toBlock: 'latest'});
            events.get(function(error, result){
                if (error) {
                    console.log(error);
                    $("#loadingOverlay").hide();
                    return;
                }
                foodStockToCustomerEvents = result;
                k = foodStockToCustomerEvents.length-1;
                $("#loading-content-text").html("Loading events status details ...");
                foodStockToCustomerInterval = setInterval(window.customerFoodApp.loadFoodStockToCustomerEventsStatus, 300);
            });
        }).catch(function(e){
            console.log(e);
            $("#loadingOverlay").hide();
        })
    },

    loadFoodStockToCustomerEventsStatus: function() {
        var self = this;

        var foodSuppliedToCustomerEventsTable = document.getElementById("food-supplied-to-customer-events-table");
        Food.deployed().then(function(instance){
            foodGlobal = instance;
            return foodGlobal.getFoodStockHashOf.call(customerData[0], foodStockToCustomerEvents[k].args._foodIndex);
        }).then(function(res){
            var tr = document.createElement("tr");
            var td1 = document.createElement("td");
            var td2 = document.createElement("td");
            var td3 = document.createElement("td");
            var td4 = document.createElement("td");
            var td5 = document.createElement("td");
            var td6 = document.createElement("td");
            td1.appendChild(document.createTextNode(foodItems[foodStockToCustomerEvents[k].args._foodIndex][0]));
            td2.appendChild(document.createTextNode(foodStockToCustomerEvents[k].args._fpsAddress));
            td3.appendChild(document.createTextNode(foodStockToCustomerEvents[k].args._quantity));
            td4.appendChild(document.createTextNode(foodStockToCustomerEvents[k].args._totalCost));
            if (foodStockToCustomerEvents[k].args._rationCard == 0)
                td5.appendChild(document.createTextNode("Fixed Scheme"));
            else
                td5.appendChild(document.createTextNode("Flexi Scheme"));
            var b;
            if (res.valueOf() == "0x0000000000000000000000000000000000000000000000000000000000000000" || foodStoredMap[foodStockToCustomerEvents[k].args._foodIndex]) {
                b = document.createElement("input");
                b.type = "button";
                b.setAttribute("class", "btn btn-success btn-sm");
                b.value = "Paid";
            } else if (res.valueOf() != "0x0000000000000000000000000000000000000000000000000000000000000000") {
                foodStoredMap[foodStockToCustomerEvents[k].args._foodIndex] = true;
                b = document.createElement("input");
                b.type = "button";
                b.setAttribute("class", "btn btn-primary btn-sm");
                b.setAttribute("data-toggle", "modal");
                b.setAttribute("data-target", "#myModal1");
                b.setAttribute("data-foodname", foodItems[foodStockToCustomerEvents[k].args._foodIndex][0]);
                b.setAttribute("data-fooditem", foodStockToCustomerEvents[k].args._foodIndex);
                b.setAttribute("data-foodcost", foodStockToCustomerEvents[k].args._totalCost);
                b.setAttribute("data-foodfps", foodStockToCustomerEvents[k].args._fpsAddress);
                b.setAttribute("data-foodration", foodStockToCustomerEvents[k].args._rationCard);
                b.setAttribute("data-foodqty", foodStockToCustomerEvents[k].args._quantity);
                b.value = "Confirm Now";
                b.onclick = function(e) {
                    $("#customer-confirm-pay-btn").click(function(){
                        window.customerFoodApp.confirmCustomerFoodSuppliedandPay();
                        $("#customer-confirm-pay-btn").off();
                    });
                }
            }
            td6.appendChild(b);
            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tr.appendChild(td4);
            tr.appendChild(td5);
            tr.appendChild(td6);
            foodSuppliedToCustomerEventsTable.appendChild(tr);
            k--;
            if (k < 0) {
                k = 0;
                clearInterval(foodStockToCustomerInterval);
                console.log("Finished loading food supplied to fps events");
                $("#loadingOverlay").hide();
            }
        }).catch(function(e){
            console.log(e);
            $("#loadingOverlay").hide();
        })
    },

    confirmCustomerFoodSuppliedandPay: function() {
        var self = this;

        var fooditem = document.getElementById("customer-pay-food-item");
        var secret = document.getElementById("customer-pay-secret");
        var password = document.getElementById("customer-pay-password");
        var fpsaddr = document.getElementById("customer-pay-fps-addr");
        var cost = document.getElementById("customer-pay-expense");
        var ration = document.getElementById("customer-pay-ration-number");
        ration = parseInt(ration.value);
        var qty = document.getElementById("customer-pay-quantity");
        qty = parseInt(qty.value);
        // console.log(fooditem.value + " - " + fpsaddr.value + " - " + cost.value + " - " + secret.value + " - " + password.value);
        if (secret.value == "" || password.value == "") {
            return;
        }

        // how will you know from which ration card points to deduct from ??
        // change backend ??

        // first authenticate
        User.deployed().then(function(instance){
            userGlobal = instance;
            return userGlobal.authenticateUserWithAddress.call(customerData[0], password.value);
        }).then(function(res){
            if (!res) {
                alert("Authentication failed, password is incorrect, please try again");
                secret.value = "";
                password.value = "";
                return;
            }
            // second check if customer has ennough money to pay for cost
            Rupee.deployed().then(function(instance){
                rupeeGlobal = instance;
                return rupeeGlobal.getBalance.call(customerData[0]);
            }).then(function(balance){
                console.log(balance.valueOf());
                if (parseInt(balance.valueOf()) < parseInt(cost.value)) {
                    alert("Customer doesn't have enough money to pay for this food item");
                    secret.value = "";
                    password.value = "";
                    return;
                }
                if (parseInt(balance.valueOf()) >= parseInt(cost.value)) {
                    console.log("customer has enough balance");
                    // third confirm the food supply
                    Food.deployed().then(function(instance){
                        foodGlobal = instance;
                        return foodGlobal.confirm_fpsSupplyToCustomer_Hash.call(customerData[0], fooditem.value, secret.value, {from: centralGovernmentAddress, gas: 200000});
                    }).then(function(res){
                        console.log(res);
                        if (!res) {
                            alert("secretKey is invalid, please try again");
                            secret.value = "";
                            password.value = "";
                            return;
                        }
                        Food.deployed().then(function(instance){
                            foodGlobal = instance;
                            return foodGlobal.confirm_fpsSupplyToCustomer_Hash(customerData[0], fooditem.value, secret.value, {from: centralGovernmentAddress, gas: 200000})
                        }).then(function(res){
                            console.log(res);
                            alert("Food supply confirmed");
                            // fourth customer pay to stateGovernment
                            Rupee.deployed().then(function(instance){
                                rupeeGlobal = instance;
                                return rupeeGlobal.customerTransferToState(customerData[0], cost.value, fooditem.value, fpsaddr.value, {from: centralGovernmentAddress, gas: 200000});
                            }).then(function(res){
                                console.log(res);
                                alert("Customer paid money to stateGovernment successfully");
                                // now deduct points from rationcard, which ??
                                if (ration == 0) {
                                    RationCard.deployed().then(function(instance){
                                        rationCardGlobal = instance;
                                        if (parseInt(fooditem.value) == 0)
                                            return rationCardGlobal.deductRationCardPoints(customerData[0], qty, 0, 0, {from: centralGovernmentAddress, gas: 200000});
                                        else if (parseInt(fooditem.value) == 1)
                                            return rationCardGlobal.deductRationCardPoints(customerData[0], 0, qty, 0, {from: centralGovernmentAddress, gas: 200000});
                                        else if (parseInt(fooditem.value) == 2)
                                            return rationCardGlobal.deductRationCardPoints(customerData[0], 0, 0, qty, {from: centralGovernmentAddress, gas: 200000});
                                        console.log("something is wrong here");
                                    }).then(function(res){
                                        console.log(res);
                                        alert("Fixed scheme ration card points deducted : " + qty + " for food item : " + foodItems[parseInt(fooditem.value)][0]);
                                        location.reload();
                                    }).catch(function(e){
                                        console.log(e);
                                    })
                                    return;
                                }
                                if (ration == 1) {
                                    RationCard.deployed().then(function(instance){
                                        rationCardGlobal = instance;
                                        return rationCardGlobal.deductFlexiRationCardPoints(customerData[0], qty, {from: centralGovernmentAddress, gas: 200000});
                                    }).then(function(res){
                                        console.log(res);
                                        alert("Flexi scheme ration card points deducted : " + qty + " for food item : " + foodItems[parseInt(fooditem.value)][0]);
                                        location.reload();
                                    }).catch(function(e){
                                        console.log(e);
                                    })
                                    return;
                                }
                                // location.reload();
                            }).catch(function(e){
                                console.log(e);
                            })
                        }).catch(function(e){
                            console.log(e);
                        })
                    }).catch(function(e){
                        console.log(e);
                    })
                }
            }).catch(function(e){
                console.log(e);
            })
        }).catch(function(e){
            console.log(e);
        })
    },

    hideOverlay: function() {
        $("#loadingOverlay").hide();
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

    showFoodSuppliedtoCustomerEventsdiv: function() {
        var self = this;
        if (loggedIn && customerApproved) {
            self.hideAll();
            $("#food-supplied-to-customer-events-div").show();
        }
    },

    checkLoginSessionCookie: function() {
        if (document.cookie.length == 0)
            return false;
        return true;
    },

    logout: function() {
        document.cookie = "customer=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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
  customerFoodApp.start();
});
