// Import the page's CSS. Webpack will know what to do with it.
import "../../stylesheets/app.css";
import "../../stylesheets/sidebar.css";
import "../../stylesheets/state-government.css";

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
var k, foodStockToStateInterval;

var foodStockToStateEvents;
var foodStoredMap = {};
foodStoredMap[0] = false;
foodStoredMap[1] = false;
foodStoredMap[2] = false;

var l, foodStockToFpsInterval;

var foodStockToFpsEvents, fpsList = [];
var foodStoredMap2 = {};

window.stateFoodApp = {
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
              window.stateFoodApp.checkCookies();
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
                if (cookies[a].split("=")[0] == "state") {
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
                        window.stateFoodApp.getFoodItems();
                        $("#user-address").html(stateGovernmentAddress);
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
            window.stateFoodApp.populateFoodItems();
        });
    },

    populateFoodItems: function() {
        var self = this;
        $("#loading-content-text").html("Populating food items to DOM elements ...");

        // var selectLi = document.getElementById("food-item-list");
        // var selectLiSupply = document.getElementById("food-item-list-supply-state");
        var selectLiSupply = document.getElementById("food-item-list-supply-fps");
        var stockSelectLi = document.getElementById("food-stock-balance-select");
        // var selectLiSell = document.getElementById("food-item-list-sell");
        // var selectLiStockBalance = document.getElementById("food-item-list-for-stock-balance");
        for (var index in foodItems) {
            if (foodItems.hasOwnProperty(index)) {
                var opt1  = document.createElement("option");
                opt1.value = index;
                opt1.innerHTML = foodItems[index][0];
                selectLiSupply.appendChild(opt1);

                var opt3  = document.createElement("option");
                opt3.value = index;
                opt3.innerHTML = foodItems[index][0];
                stockSelectLi.appendChild(opt3);

                // var opt2  = document.createElement("option");
                // opt2.value = index;
                // opt2.innerHTML = foodItems[index][0];
                // selectLiSupply.appendChild(opt2);

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
        // setTimeout(self.hideOverlay, 1000);
        setTimeout(self.loadFoodSuppliedToStateEvents, 1000);
    },

    supplyToFps: function() {
        var self = this;
        var fooditem = document.getElementById("food-item-list-supply-fps");
        var fpsAddr = document.getElementById("supply-to-fps-item-address");
        var itemhash = document.getElementById("supply-to-fps-item-hash");
        var password = document.getElementById("state-government-supply-password");
        if (fooditem.selectedIndex == 0 || itemhash.value == "" || fpsAddr.value == "" || password.value == "") {
            return;
        }
        User.deployed().then(function(instance){
            userGlobal = instance;
            return userGlobal.authenticateUserWithAddress.call(stateGovernmentAddress, password.value);
        }).then(function(res){
            if (!res) {
                alert("Authentication failure, password is incorrect");
                password.value = "";
                return;
            }
            Food.deployed().then(function(instance) {
                foodGlobal = instance;
                return foodGlobal.supplyToFPS_Hash(fpsAddr.value, fooditem.options[fooditem.selectedIndex].value, itemhash.value, {from: centralGovernmentAddress, gas: 200000});
            }).then(function(res){
                console.log(res);
                alert("FoodItem: " + fooditem.options[fooditem.selectedIndex].text + " sent to FPS: " + fpsAddr.value);
                fooditem.selectedIndex = 0;
                fpsAddr.value = "";
                itemhash.value = "";
            }).catch(function(e){
                console.log(e);
                alert("Cannot execute this transaction, either food stock received from centralGovernment is not confirmed or state doesn't have enough food stock to supply");
            });
        })
    },

    loadFoodSuppliedToStateEvents: function() {
        var self = this;
        $("#loading-content-text").html("Loading food stock supplied to state events ...");

        var events;
        Food.deployed().then(function(instance){
            foodGlobal = instance;
            events = foodGlobal.SupplyCentralToStateGovernment_HashLog({}, {fromBlock: 0, toBlock: 'latest'});
            events.get(function(error, result){
                if (error) {
                    console.log(error);
                    $("#loadingOverlay").hide();
                    return;
                }
                foodStockToStateEvents = result;
                k = foodStockToStateEvents.length-1;
                $("#loading-content-text").html("Loading events status details ...");
                foodStockToStateInterval = setInterval(window.stateFoodApp.loadFoodStockToStateEventsStatus, 300);
            });
        }).catch(function(e){
            console.log(e);
            $("#loadingOverlay").hide();
        })
    },

    loadFoodStockToStateEventsStatus: function() {
        var self = this;

        if (foodStockToStateEvents.length == 0) {
            k = 0;
            clearInterval(foodStockToStateInterval);
            console.log("Finished loading food supplied to fps events");
            window.stateFoodApp.loadFoodSuppliedToFpsEvents();
            // $("#loadingOverlay").hide();
            return;
        }
        var foodSuppliedToStateEventsTable = document.getElementById("food-supplied-to-state-events-table");
        Food.deployed().then(function(instance){
            foodGlobal = instance;
            return foodGlobal.getFoodStockHashOf.call(stateGovernmentAddress, foodStockToStateEvents[k].args._foodIndex);
        }).then(function(res){
            var tr = document.createElement("tr");
            var td1 = document.createElement("td");
            var td2 = document.createElement("td");
            var td3 = document.createElement("td");
            var td4 = document.createElement("td");
            td1.appendChild(document.createTextNode(foodItems[foodStockToStateEvents[k].args._foodIndex][0]));
            td2.appendChild(document.createTextNode(foodStockToStateEvents[k].args._quantity));
            td3.appendChild(document.createTextNode(foodStockToStateEvents[k].args._expense));
            var b;
            if (res.valueOf() == "0x0000000000000000000000000000000000000000000000000000000000000000" || foodStoredMap[foodStockToStateEvents[k].args._foodIndex]) {
                b = document.createElement("input");
                b.type = "button";
                b.setAttribute("class", "btn btn-success btn-sm");
                b.value = "Paid";
            } else if (res.valueOf() != "0x0000000000000000000000000000000000000000000000000000000000000000"){
                foodStoredMap[foodStockToStateEvents[k].args._foodIndex] = true;
                b = document.createElement("input");
                b.type = "button";
                b.setAttribute("class", "btn btn-primary btn-sm");
                b.setAttribute("data-toggle", "modal");
                b.setAttribute("data-target", "#myModal1");
                b.setAttribute("data-foodname", foodItems[foodStockToStateEvents[k].args._foodIndex][0]);
                b.setAttribute("data-fooditem", foodStockToStateEvents[k].args._foodIndex);
                b.setAttribute("data-foodcost", foodStockToStateEvents[k].args._expense);
                b.value = "Pay Now";
                b.onclick = function(e) {
                    $("#state-confirm-pay-btn").click(function(){
                        window.stateFoodApp.confirmAndPay();
                        $("#state-confirm-pay-btn").off();
                    });
                }
            }
            td4.appendChild(b);
            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tr.appendChild(td4);
            foodSuppliedToStateEventsTable.appendChild(tr);
            k--;
            if (k < 0) {
                k = 0;
                clearInterval(foodStockToStateInterval);
                console.log("Finished loading food supplied to state events");
                window.stateFoodApp.loadFoodSuppliedToFpsEvents();
                // $("#loadingOverlay").hide();
            }
        }).catch(function(e){
            console.log(e);
            $("#loadingOverlay").hide();
        })
    },

    loadFoodSuppliedToFpsEvents: function() {
        var self = this;
        $("#loading-content-text").html("Loading food stock supplied to fps events ...");

        var events;
        Food.deployed().then(function(instance){
            foodGlobal = instance;
            events = foodGlobal.SupplyToFPS_HashLog({}, {fromBlock: 0, toBlock: 'latest'});
            events.get(function(error, result){
                if (error) {
                    console.log(error);
                    $("#loadingOverlay").hide();
                    return;
                }
                foodStockToFpsEvents = result;
                for (var i = 0; i < result.length; i++)
                    fpsList.push(result[i].args._fpsAddress);
                console.log(fpsList);
                for (var i = 0; i < fpsList.length; i++) {
                    foodStoredMap2[fpsList[i]] = {};
                    foodStoredMap2[fpsList[i]][0] = false;
                    foodStoredMap2[fpsList[i]][1] = false;
                    foodStoredMap2[fpsList[i]][2] = false;
                }
                console.log(foodStoredMap2);
                l = foodStockToFpsEvents.length-1;

                $("#loading-content-text").html("Loading events status details ...");
                foodStockToFpsInterval = setInterval(window.stateFoodApp.loadFoodStockToFpsEventsStatus, 300);
            });
        }).catch(function(e){
            console.log(e);
            $("#loadingOverlay").hide();
        })
    },

    loadFoodStockToFpsEventsStatus: function() {
        var self = this;

        if (foodStockToFpsEvents.length == 0) {
            l = 0;
            clearInterval(foodStockToFpsInterval);
            console.log("Finished loading food supplied to fps events");
            $("#loadingOverlay").hide();
            return;
        }
        var foodSuppliedToFpsEventsTable = document.getElementById("food-supplied-to-fps-events-table");
        Food.deployed().then(function(instance){
            foodGlobal = instance;
            return foodGlobal.getFoodStockHashOf.call(foodStockToFpsEvents[l].args._fpsAddress, foodStockToFpsEvents[l].args._foodIndex);
        }).then(function(res){
            var tr = document.createElement("tr");
            var td1 = document.createElement("td");
            var td2 = document.createElement("td");
            var td3 = document.createElement("td");
            var td4 = document.createElement("td");
            td1.appendChild(document.createTextNode(foodStockToFpsEvents[l].args._fpsAddress));
            td2.appendChild(document.createTextNode(foodItems[foodStockToFpsEvents[l].args._foodIndex][0]));
            td3.appendChild(document.createTextNode(foodStockToFpsEvents[l].args._quantity));
            var b;
            if (res.valueOf() == "0x0000000000000000000000000000000000000000000000000000000000000000" || foodStoredMap2[foodStockToFpsEvents[l].args._fpsAddress][foodStockToFpsEvents[l].args._foodIndex]) {
                b = document.createElement("input");
                b.type = "button";
                b.setAttribute("class", "btn btn-success btn-sm");
                b.value = "Confirmed";
            } else if (res.valueOf() != "0x0000000000000000000000000000000000000000000000000000000000000000") {
                foodStoredMap2[foodStockToFpsEvents[l].args._fpsAddress][foodStockToFpsEvents[l].args._foodIndex] = true;
                b = document.createElement("input");
                b.type = "button";
                b.setAttribute("class", "btn btn-danger btn-sm");
                b.value = "Not confirmed";
            }
            td4.appendChild(b);
            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tr.appendChild(td4);
            foodSuppliedToFpsEventsTable.appendChild(tr);
            l--;
            if (l < 0) {
                l = 0;
                clearInterval(foodStockToFpsInterval);
                console.log("Finished loading food supplied to fps events");
                $("#loadingOverlay").hide();
            }
        }).catch(function(e){
            console.log(e);
            $("#loadingOverlay").hide();
        })
    },

    confirmAndPay: function() {
        var self = this;

        var fooditem = document.getElementById("state-government-pay-food-item");
        var cost = document.getElementById("state-government-pay-expense");
        var secret = document.getElementById("state-government-pay-secret");
        var password = document.getElementById("state-government-pay-password");
        // console.log(fooditem.value + " - " + cost.value + " - " + secret.value + " - " + password.value);
        if (secret.value == "" || password.value == "") {
            return;
        }
        // first authenticate
        User.deployed().then(function(instance){
            userGlobal = instance;
            return userGlobal.authenticateUserWithAddress.call(stateGovernmentAddress, password.value);
        }).then(function(res){
            if (!res) {
                alert("Authentication failed, password is incorrect, please try again")
                secret.value = "";
                password.value = "";
                return;
            }
            // check if state has enough balance to pay for this cost
            var budgetBal;
            Rupee.deployed().then(function(instance){
                rupeeGlobal = instance;
                return rupeeGlobal.getBudgetBalance.call();
            }).then(function(res){
                budgetBal = res.valueOf();
                // console.log("budgetBal => " + budgetBal);
                if (parseInt(budgetBal) >= parseInt(cost.value)) {
                    console.log("state has enough balance");
                    // second confirm food supply
                    Food.deployed().then(function(instance){
                        foodGlobal = instance;
                        return foodGlobal.confirm_supplyCentralToStateGovernment_Hash.call(fooditem.value, secret.value, {from: centralGovernmentAddress, gas: 200000});
                    }).then(function(res){
                        console.log(res);
                        if (res) {
                            Food.deployed().then(function(instance){
                                foodGlobal = instance;
                                return foodGlobal.confirm_supplyCentralToStateGovernment_Hash(fooditem.value, secret.value, {from: centralGovernmentAddress, gas: 200000});
                            }).then(function(res){
                                console.log(res);
                                console.log("food supply confirmed");
                                // third transfer money
                                Rupee.deployed().then(function(instance){
                                    rupeeGlobal = instance;
                                    return rupeeGlobal.stateTransferToCentral(cost.value, fooditem.value, {from: centralGovernmentAddress, gas: 150000});
                                }).then(function(res){
                                    console.log(res);
                                    alert("Food Supplied to state confirmed and state paid successfully");
                                    location.reload();
                                }).catch(function(e){
                                    console.log(e);
                                    alert("Couldn't transfer money");
                                    return;
                                });
                            })
                        } else {
                            alert("secretKey is incorrect, please try again");
                            secret.value = "";
                            password.value = "";
                            return;
                        }
                    }).catch(function(e){
                        console.log(e);
                        alert("food supply not confirmed, aborting transaction now");
                        secret.value = "";
                        password.value = "";
                        return;
                    });
                } else {
                    alert("stateGovernment doesn't have enough balance");
                    secret.value = "";
                    password.value = "";
                    return;
                }
            }).catch(function(e){
                console.log(e);
                alert("Error getting stateGovernment balance");
                secret.value = "";
                password.value = "";
                return;
            });
        }).catch(function(e){
            console.log(e);
            secret.value = "";
            password.value = "";
            return;
        });

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

    showSupplyToFpsDiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#supply-to-fps-div").show();
        }
    },

    showFoodSuppliedtoStateEventsdiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#food-supplied-to-state-events-div").show();
        }
    },

    showFoodSuppliedtoFpsEventsdiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#food-supplied-to-fps-events-div").show();
        }
    },

    checkLoginSessionCookie: function() {
        if (document.cookie.length == 0)
            return false;
        return true;
    },

    logout: function() {
        document.cookie = "state=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // document.cookie = "address=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // document.cookie = "name=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // document.cookie = "email=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // document.cookie = "usertype=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // document.cookie = "place=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        location.reload();
    },

    checkFoodStock: function() {
        var self = this;

        if (loggedIn) {
            var stockSelectLi = document.getElementById("food-stock-balance-select");
            if (stockSelectLi.selectedIndex == 0) {
                return;
            }
            console.log("checkFoodStock here");
            var fooditem = stockSelectLi.options[stockSelectLi.selectedIndex].value;
            Food.deployed().then(function(instance){
                foodGlobal = instance;
                return foodGlobal.getFoodStock.call(stateGovernmentAddress, fooditem);
            }).then(function(res){
                console.log(res.valueOf());
                $("#balance-result").show();
                $("#balance-result").html("FoodStock Balance: " + res.valueOf());
            }).catch(function(e){
                console.log(e);
                return;
            })
        }
    },

    checkRupeeBalance: function() {
        var self = this;

        if (loggedIn) {
            Rupee.deployed().then(function(instance){
                rupeeGlobal = instance;
                if ($('input:radio[id="radio1"]').is(':checked')) {
                    return rupeeGlobal.getBudgetBalance.call(stateGovernmentAddress);
                }
                if ($('input:radio[id="radio2"]').is(':checked')) {
                    return rupeeGlobal.getBalance.call(stateGovernmentAddress);
                }
            }).then(function(res){
                console.log(res.valueOf());
                $("#rupee-balance-result").show();
                $("#rupee-balance-result").html("Wallet Balance: " + res.valueOf());
            }).catch(function(e){
                console.log(e);
                return;
            })
        }
    },

    copyToClipboard: function() {
        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val($("#user-address").html()).select();
        document.execCommand("copy");
        $temp.remove();
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
  stateFoodApp.start();
});
