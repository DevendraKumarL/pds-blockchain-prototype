// Import the page's CSS. Webpack will know what to do with it.
import "../../stylesheets/app.css";
import "../../stylesheets/sidebar.css";
import "../../stylesheets/fps.css";

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
var loggedIn = false, fpsData, fpsApproved = false;
var k, foodStockToFpsInterval;

var foodStockToFpsEvents;
var foodStoredMap = {};
foodStoredMap[0] = false;
foodStoredMap[1] = false;
foodStoredMap[2] = false;

var l, foodStockToCustomerInterval;
var foodStockToCustomerEvents, customersList = [];
var foodStoredMap2 = {};

window.fpsFoodApp = {
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
              window.fpsFoodApp.checkCookies();
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
                if (cookies[a].split("=")[0] == "fps") {
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
                        fpsData = userinfo;
                        console.log("fps => " + fpsData[0]);
                        window.fpsFoodApp.getFpsApprovalStatus();
                        $("#user-address").html(fpsData[0]);
                        // window.fpsFoodApp.getFoodItems();
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

    getFpsApprovalStatus: function() {
        var self = this;
        $("#loading-content-text").html("Checking FPS approval status ...");
        Approval.deployed().then(function(instance) {
            approvalGlobal = instance;
            return approvalGlobal.getUserApproval.call(fpsData[0], 1);
        }).then(function(res){
            console.log(res);
            if (res[1] && res[0] == fpsData[0]) {
                fpsApproved = true;
                $("not-approved-div-card").hide();
                window.fpsFoodApp.getFoodItems();
                return;
            }
            if (!res[1]) {
                $("#loadingOverlay").hide();
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
            window.fpsFoodApp.populateFoodItems();
        });
    },

    populateFoodItems: function() {
        var self = this;
        $("#loading-content-text").html("Populating food items to DOM elements ...");

        // var selectLi = document.getElementById("food-item-list");
        // var selectLiSupply = document.getElementById("food-item-list-supply-state");
        // var selectLiSupply = document.getElementById("food-item-list-supply-fps");
        var selectLiSell = document.getElementById("food-item-list-supply-customer");
        var stockSelectLi = document.getElementById("food-stock-balance-select");
        // var selectLiStockBalance = document.getElementById("food-item-list-for-stock-balance");
        for (var index in foodItems) {
            if (foodItems.hasOwnProperty(index)) {
                var opt1  = document.createElement("option");
                opt1.value = index;
                opt1.innerHTML = foodItems[index][0];
                selectLiSell.appendChild(opt1);

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
        setTimeout(self.loadFoodSuppliedToFpsEvents, 1000);
    },

    supplyToCustomer: function() {
        var self = this;
        // first authenticate fps
        var fooditem = document.getElementById("food-item-list-supply-customer");
        var custaddr = document.getElementById("supply-to-customer-item-address");
        var itemhash = document.getElementById("supply-to-customer-item-hash");
        var qty = document.getElementById("supply-to-customer-item-qty");
        var password = document.getElementById("fps-supply-password");
        var fixed = true;
        if($('input:radio[id="radio1"]').is(':checked')) {
            fixed = true;
        }
        if($('input:radio[id="radio2"]').is(':checked')) {
            fixed = false;
        }
        if (fooditem.selectedIndex == 0 || itemhash.value == "" || custaddr.value == "" || qty == "" || password.value == "") {
            return;
        }
        var foodindex = fooditem.options[fooditem.selectedIndex].value;
        console.log("foodindex => " + foodindex);
        console.log("foodindex details => ");
        console.log(foodItems[foodindex][0]);
        console.log(foodItems[foodindex][1].valueOf());
        console.log(foodItems[foodindex][2].valueOf());
        console.log(foodItems[foodindex][3]);
        console.log(foodItems[foodindex][4].valueOf());
        console.log(foodItems[foodindex][5].valueOf());
        // before suppling
        // check if the receipient customer is approved
        // then check if the customer has enough fixed/flexi ration card points to allow the transfer

        User.deployed().then(function(instance){
            userGlobal = instance;
            return userGlobal.authenticateUserWithAddress.call(fpsData[0], password.value);
        }).then(function(res){
            if (!res) {
                alert("Authentication failure, password is incorrect");
                password.value = "";
                return;
            }
            Approval.deployed().then(function(instance){
                approvalGlobal = instance;
                return approvalGlobal.getUserApproval.call(custaddr.value, 2);
            }).then(function(res){
                console.log(res);
                if (res[0] != custaddr.value || !res[1]) {
                    alert("Customer: " + custaddr.value + " is not approved by centralGovernment");
                    password.value = "";
                    return;
                }
                if (res[0] == custaddr.value && res[1]) {
                    console.log("Customer: " + custaddr.value + " is approved by centralGovernment");
                    RationCard.deployed().then(function(instance){
                        rationCardGlobal = instance;
                        if (fixed) {
                            return rationCardGlobal.getRationCardInfo.call(0, custaddr.value);
                        }
                        if (!fixed) {
                            return rationCardGlobal.getFlexiRationCardInfo.call(0, custaddr.value);
                        }
                    }).then(function(cardinfo){
                        console.log(cardinfo);
                        if (!cardinfo[0]) {
                            if (fixed) {
                                alert("Customer: " + custaddr.value + " has no fixed scheme ration card");
                            }
                            else {
                                alert("Customer: " + custaddr.value + " has no flexi scheme ration card");
                            }
                            password.value = "";
                            return;
                        }
                        if (cardinfo[5] != fpsData[0]) {
                            alert("Customer: " + custaddr.value + " is not registered to this fps: " + fpsData[0]);
                            password.value = "";
                            return;
                        }
                        if (fixed) {
                            RationCard.deployed().then(function(instance){
                                rationCardGlobal = instance;
                                return rationCardGlobal.getRationCardPoints.call(0, custaddr.value);
                            }).then(function(points){
                                console.log(points);
                                if ( parseInt(points[parseInt(foodindex) + 1].valueOf()) < parseInt(foodItems[parseInt(foodindex)][1].valueOf()) ) {
                                    alert("Customer: " + custaddr.value + " doesn't have enough fixed points for foodItem: " + foodItems[parseInt(foodindex)][0]);
                                    password.value = "";
                                    return;
                                }
                                if ( points[0] && parseInt(points[parseInt(foodindex) + 1].valueOf()) >= parseInt(foodItems[parseInt(foodindex)][1].valueOf()) ) {
                                    Food.deployed().then(function(instance) {
                                        foodGlobal = instance;
                                        // add another parameter to store which ration card was used ??
                                        return foodGlobal.fpsSupplyToCustomer_Hash(fpsData[0], custaddr.value, parseInt(foodindex), 0, itemhash.value, 0, {from: centralGovernmentAddress, gas: 200000});
                                    }).then(function(res){
                                        console.log(res);
                                        alert("FoodItem: " + fooditem.options[fooditem.selectedIndex].text + " sent to customer: " + custaddr.value);
                                        fooditem.selectedIndex = 0;
                                        custaddr.value = "";
                                        itemhash.value = "";
                                        document.getElementById("supply-to-customer-item-qty").value = "";
                                    }).catch(function(e){
                                        console.log(e);
                                        alert("Food supply not confirmed, either fps has not confirmed the food supplied from state or customer as not confirmed food supplied to it, or fps doesn't enough supply");
                                        password.value = "";
                                    });
                                }
                            }).catch(function(e){
                                console.log(e);
                            });
                            return;
                        }
                        if (!fixed) {
                            RationCard.deployed().then(function(instance){
                                rationCardGlobal = instance;
                                return rationCardGlobal.getFlexiRationCardPoints.call(0, custaddr.value);
                            }).then(function(points){
                                console.log(points);
                                if (parseInt(points[1].valueOf()) < parseInt(qty.value)) {
                                    alert("Customer: " + custaddr.value + " doesn't have enough flexi points for foodItem: " + foodItems[parseInt(foodindex)][0]);
                                    password.value = "";
                                    return;
                                }
                                if (points[0] && parseInt(points[1].valueOf()) >= parseInt(qty.value)) {
                                    Food.deployed().then(function(instance) {
                                        foodGlobal = instance;
                                        return foodGlobal.fpsSupplyToCustomer_Hash(fpsData[0], custaddr.value, parseInt(foodindex), qty.value, itemhash.value, 1, {from: centralGovernmentAddress, gas: 200000});
                                    }).then(function(res){
                                        console.log(res);
                                        alert("FoodItem: " + fooditem.options[fooditem.selectedIndex].text + " sent to customer: " + custaddr.value);
                                        fooditem.selectedIndex = 0;
                                        custaddr.value = "";
                                        itemhash.value = "";
                                        document.getElementById("supply-to-customer-item-qty").value = "";
                                    }).catch(function(e){
                                        console.log(e);
                                        alert("Food supply not confirmed, either fps has not confirmed the food supplied from state or customer as not confirmed food supplied to it, or fps doesn't enough supply");
                                        password.value = "";
                                    });
                                }
                            }).catch(function(e){
                                console.log(e);
                            });
                            return;
                        }
                    }).catch(function(e){
                        console.log(e);
                    });
                    return;
                }
            }).catch(function(e){
                console.log(e);
            });
        }).catch(function(e){
            console.log(e);
        });

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
                k = foodStockToFpsEvents.length-1;
                $("#loading-content-text").html("Loading events status details ...");
                foodStockToFpsInterval = setInterval(window.fpsFoodApp.loadFoodStockToFpsEventsStatus, 300);
            });
        }).catch(function(e){
            console.log(e);
            $("#loadingOverlay").hide();
        })
    },

    loadFoodStockToFpsEventsStatus: function() {
        var self = this;

        if (foodStockToFpsEvents.length == 0) {
            k = 0;
            clearInterval(foodStockToFpsInterval);
            console.log("Finished loading food supplied to fps events");
            // $("#loadingOverlay").hide();
            window.fpsFoodApp.loadFoodSuppliedToCustomerEvents();
            return;
        }
        var foodSuppliedToFpsEventsTable = document.getElementById("food-supplied-to-fps-events-table");
        Food.deployed().then(function(instance){
            foodGlobal = instance;
            return foodGlobal.getFoodStockHashOf.call(fpsData[0], foodStockToFpsEvents[k].args._foodIndex);
        }).then(function(res){
            // filter events of only current loggedIn fps only
            if (foodStockToFpsEvents[k].args._fpsAddress == fpsData[0]) {
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");
                var td3 = document.createElement("td");
                td1.appendChild(document.createTextNode(foodItems[foodStockToFpsEvents[k].args._foodIndex][0]));
                td2.appendChild(document.createTextNode(foodStockToFpsEvents[k].args._quantity));
                var b;
                if (res.valueOf() == "0x0000000000000000000000000000000000000000000000000000000000000000" || foodStoredMap[foodStockToFpsEvents[k].args._foodIndex]) {
                    b = document.createElement("input");
                    b.type = "button";
                    b.setAttribute("class", "btn btn-success btn-sm");
                    b.value = "Confirmed";
                } else if (res.valueOf() != "0x0000000000000000000000000000000000000000000000000000000000000000") {
                    foodStoredMap[foodStockToFpsEvents[k].args._foodIndex] = true;
                    b = document.createElement("input");
                    b.type = "button";
                    b.setAttribute("class", "btn btn-primary btn-sm");
                    b.setAttribute("data-toggle", "modal");
                    b.setAttribute("data-target", "#myModal1");
                    b.setAttribute("data-foodname", foodItems[foodStockToFpsEvents[k].args._foodIndex][0]);
                    b.setAttribute("data-fooditem", foodStockToFpsEvents[k].args._foodIndex);
                    b.value = "Confirm Now";
                    b.onclick = function(e) {
                        $("#fps-confirm-pay-btn").click(function(){
                            window.fpsFoodApp.confirmFpsFoodSupplied();
                            $("#fps-confirm-pay-btn").off();
                        });
                    }
                }
                td3.appendChild(b);
                tr.appendChild(td1);
                tr.appendChild(td2);
                tr.appendChild(td3);
                foodSuppliedToFpsEventsTable.appendChild(tr);
            }
            k--;
            if (k < 0) {
                k = 0;
                clearInterval(foodStockToFpsInterval);
                console.log("Finished loading food supplied to fps events");
                // $("#loadingOverlay").hide();
                window.fpsFoodApp.loadFoodSuppliedToCustomerEvents();
            }
        }).catch(function(e){
            console.log(e);
            $("#loadingOverlay").hide();
        })
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
                l = foodStockToCustomerEvents.length-1;
                for (var i = 0; i < result.length; i++) {
                    if (result[i].args._fpsAddress == fpsData[0])
                        customersList.push(result[i].args._customerAddress);
                }
                console.log(customersList);
                for (var i = 0; i < customersList.length; i++) {
                    foodStoredMap2[customersList[i]] = {};
                    foodStoredMap2[customersList[i]][0] = false;
                    foodStoredMap2[customersList[i]][1] = false;
                    foodStoredMap2[customersList[i]][2] = false;
                }
                console.log(foodStoredMap2);

                $("#loading-content-text").html("Loading events status details ...");
                foodStockToCustomerInterval = setInterval(window.fpsFoodApp.loadFoodStockToCustomerEventsStatus, 300);
            });
        }).catch(function(e){
            console.log(e);
            $("#loadingOverlay").hide();
        })
    },

    loadFoodStockToCustomerEventsStatus: function() {
        var self = this;

        if (foodStockToCustomerEvents.length == 0) {
            l = 0;
            clearInterval(foodStockToCustomerInterval);
            console.log("Finished loading food supplied to fps events");
            $("#loadingOverlay").hide();
            return;
        }
        var foodSuppliedToCustomerEventsTable = document.getElementById("food-supplied-to-customer-events-table");
        Food.deployed().then(function(instance){
            foodGlobal = instance;
            return foodGlobal.getFoodStockHashOf.call(foodStockToCustomerEvents[l].args._customerAddress, foodStockToCustomerEvents[l].args._foodIndex);
        }).then(function(res){
            if (foodStockToCustomerEvents[l].args._fpsAddress == fpsData[0]) {
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");
                var td3 = document.createElement("td");
                var td4 = document.createElement("td");
                var td5 = document.createElement("td");
                var td6 = document.createElement("td");
                td1.appendChild(document.createTextNode(foodStockToCustomerEvents[l].args._customerAddress));
                td2.appendChild(document.createTextNode(foodItems[foodStockToCustomerEvents[l].args._foodIndex][0]));
                td3.appendChild(document.createTextNode(foodStockToCustomerEvents[l].args._quantity));
                td4.appendChild(document.createTextNode(foodStockToCustomerEvents[l].args._totalCost));
                if (foodStockToCustomerEvents[l].args._rationCard == 0)
                    td5.appendChild(document.createTextNode("Fixed Scheme"));
                else
                    td5.appendChild(document.createTextNode("Flexi Scheme"));
                var b;
                if (res.valueOf() == "0x0000000000000000000000000000000000000000000000000000000000000000" || foodStoredMap2[foodStockToCustomerEvents[l].args._customerAddress][foodStockToCustomerEvents[l].args._foodIndex]) {
                    b = document.createElement("input");
                    b.type = "button";
                    b.setAttribute("class", "btn btn-success btn-sm");
                    b.value = "Confirmed";
                } else if (res.valueOf() != "0x0000000000000000000000000000000000000000000000000000000000000000") {
                    foodStoredMap2[foodStockToCustomerEvents[l].args._customerAddress][foodStockToCustomerEvents[l].args._foodIndex] = true;
                    b = document.createElement("input");
                    b.type = "button";
                    b.setAttribute("class", "btn btn-danger btn-sm");
                    b.value = "Not confirmed";
                }
                td6.appendChild(b);
                tr.appendChild(td1);
                tr.appendChild(td2);
                tr.appendChild(td3);
                tr.appendChild(td4);
                tr.appendChild(td5);
                tr.appendChild(td6);
                foodSuppliedToCustomerEventsTable.appendChild(tr);
            }
            l--;
            if (l < 0) {
                l = 0;
                clearInterval(foodStockToCustomerInterval);
                console.log("Finished loading food supplied to fps events");
                $("#loadingOverlay").hide();
            }
        }).catch(function(e){
            console.log(e);
            $("#loadingOverlay").hide();
        })
    },

    confirmFpsFoodSupplied: function() {
        var self = this;

        var fooditem = document.getElementById("fps-pay-food-item");
        var secret = document.getElementById("fps-pay-secret");
        var password = document.getElementById("fps-pay-password");
        // console.log(fooditem.value + " - " + " - " + secret.value + " - " + password.value);
        if (secret.value == "" || password.value == "") {
            return;
        }
        // first authenticate
        User.deployed().then(function(instance){
            userGlobal = instance;
            return userGlobal.authenticateUserWithAddress.call(fpsData[0], password.value);
        }).then(function(res){
            if (!res) {
                alert("Authentication failed, password is incorrect, please try again")
                secret.value = "";
                password.value = "";
                return;
            }
            Food.deployed().then(function(instance){
                foodGlobal = instance;
                return foodGlobal.confirm_supplyToFPS_Hash.call(fpsData[0], fooditem.value, secret.value, {from: centralGovernmentAddress, gas: 200000});
            }).then(function(res){
                console.log(res);
                if (res) {
                    Food.deployed().then(function(instance){
                        foodGlobal = instance;
                        return foodGlobal.confirm_supplyToFPS_Hash(fpsData[0], fooditem.value, secret.value, {from: centralGovernmentAddress, gas: 200000});
                    }).then(function(res){
                        console.log(res);
                        alert("Food supplied to fps confirmed");
                        location.reload();
                    }).catch(function(e){
                        console.log(e);
                        secret.value = "";
                        password.value = "";
                        return;
                    })
                } else {
                    alert("secretKey is incorrect, please try again");
                    secret.value = "";
                    password.value = "";
                    return;
                }
            }).catch(function(e){
                console.log(e);
                alert("Food supply not confirmed, aborting transaction now");
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

    showSupplyToCustomerDiv: function() {
        var self = this;
        if (loggedIn && fpsApproved) {
            self.hideAll();
            $("#supply-to-customer-div").show();
        }
        if (!fpsApproved) {
            self.hideAll();
            $("#not-approved-div-card").show();
        }
    },

    showFoodSuppliedtoFpsEventsdiv: function() {
        var self = this;
        if (loggedIn && fpsApproved) {
            self.hideAll();
            $("#food-supplied-to-fps-events-div").show();
        }
    },

    showFoodSuppliedtoCustomerEventsdiv: function() {
        var self = this;
        if (loggedIn && fpsApproved) {
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
        document.cookie = "fps=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // document.cookie = "address=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // document.cookie = "name=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // document.cookie = "email=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // document.cookie = "usertype=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // document.cookie = "place=" + ";expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        location.reload();
    },

    checkFoodStock: function() {
        var self = this;

        if (loggedIn && fpsApproved) {
            var stockSelectLi = document.getElementById("food-stock-balance-select");
            if (stockSelectLi.selectedIndex == 0) {
                return;
            }
            console.log("checkFoodStock here");
            var fooditem = stockSelectLi.options[stockSelectLi.selectedIndex].value;
            Food.deployed().then(function(instance){
                foodGlobal = instance;
                return foodGlobal.getFoodStock.call(fpsData[0], fooditem);
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
  fpsFoodApp.start();
});
