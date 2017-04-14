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

window.centralEventsApp = {
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
              window.centralEventsApp.checkCookies();
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
                    return userGlobal.getUserDetails.call(cookieAddr);
                }).then(function(userinfo) {
                    if (userinfo[0] == cookieAddr) {
                        $("#register-link").remove();
                        $("#login-link").remove();
                        $("#profile-link").show();
                        document.getElementById('profile-name').innerHTML = userinfo[1];
                        $("#not-logged-div-card").hide();
                        loggedIn = true;
                        window.centralEventsApp.getFoodItems();
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
            // $("#loadingOverlay").hide();
            window.centralEventsApp.loadUserAddedEvents();
            // window.centralEventsApp.populateFoodItems();
        });
    },

    loadUserAddedEvents: function() {
        var self = this;
        $("#loading-content-text").html("Loading UserAdded Events ...");

        var userAddedEventsTable = document.getElementById("user-added-events-table");
        var event1;
        User.deployed().then(function(instance){
            userGlobal = instance;
            event1 = userGlobal.UserAdded({}, {fromBlock: 0, toBlock: 'latest'});
            event1.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                console.log("UserAdded Events = >");
                for (var i = result.length-1; i > -1; i--) {
                    // console.log(result[i].args._userAddress + " : " + result[i].args._userName);
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    var td3 = document.createElement("td");
                    td1.appendChild(document.createTextNode(result[i].args._userAddress));
                    td2.appendChild(document.createTextNode(result[i].args._userName));
                    var b = document.createElement("input");
                    b.type = "button";
                    b.setAttribute("class", "btn btn-primary btn-sm");
                    b.id = result[i].args._userAddress;
                    b.value = "Copy";
                    b.onclick = function(e) {
                        console.log("copy btn => " + e.target.id);
                        window.centralEventsApp.copyToClipboard(e.target.id);
                    }
                    td3.appendChild(b);
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    tr.appendChild(td3);
                    userAddedEventsTable.appendChild(tr);
                }
                self.loadApprovalEvents();
            });
        }).catch(function(e){
            console.log(e);
            $("#loadingOverlay").hide();
        });
    },

    loadApprovalEvents: function() {
        var self = this;
        $("#loading-content-text").html("Loading Approval Events ...");

        var custApproEventsTable = document.getElementById("approval-customer-events-table");
        var fpsApproEventsTable = document.getElementById("approval-fps-events-table");
        var event1, event2;
        Approval.deployed().then(function(instance){
            approvalGlobal = instance;
            event1 = approvalGlobal.CustomerApproved({}, {fromBlock: 0, toBlock: 'latest'});
            event1.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                console.log("CustomerApproved Events = >");
                for (var i = result.length-1; i > -1; i--) {
                // for (var i = 0; i < result.length; i++) {
                    // console.log(result[i].args._customerAddress);
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    td1.appendChild(document.createTextNode(result[i].args._customerAddress));
                    var b = document.createElement("input");
                    b.type = "button";
                    b.setAttribute("class", "btn btn-primary btn-sm");
                    b.id = result[i].args._customerAddress;
                    b.value = "Copy";
                    b.onclick = function(e) {
                        console.log("copy btn => " + e.target.id);
                        window.centralEventsApp.copyToClipboard(e.target.id);
                    }
                    td2.appendChild(b);
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    custApproEventsTable.appendChild(tr);
                }
            });
            event2 = approvalGlobal.FPSApproved({}, {fromBlock: 0, toBlock: 'latest'});
            event2.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                console.log("FPSApproved Events = >");
                for (var i = result.length-1; i > -1; i--) {
                // for (var i = 0; i < result.length; i++) {
                    // console.log(result[i].args._customerAddress);
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    td1.appendChild(document.createTextNode(result[i].args._fpsAddress));
                    var b = document.createElement("input");
                    b.type = "button";
                    b.setAttribute("class", "btn btn-primary btn-sm");
                    b.id = result[i].args._fpsAddress;
                    b.value = "Copy";
                    b.onclick = function(e) {
                        console.log("copy btn => " + e.target.id);
                        window.centralEventsApp.copyToClipboard(e.target.id);
                    }
                    td2.appendChild(b);
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    fpsApproEventsTable.appendChild(tr);
                }
            });
            // window.centralEventsApp.loadRationCardEvents();
            setTimeout(window.centralEventsApp.loadRationCardEvents, 2000);
        }).catch(function(e){
            console.log(e);
            $("#loadingOverlay").hide();
        });
    },

    loadRationCardEvents: function() {
        var self = this;
        $("#loading-content-text").html("Loading all ration card events ...");

        var r1 = document.getElementById("ration-card-created-events-table");
        var r2 = document.getElementById("flexi-ration-card-created-events-table");
        var r3 = document.getElementById("ration-card-points-added-events-table");
        var r4 = document.getElementById("flexi-ration-card-points-added-events-table");
        var r5 = document.getElementById("ration-card-points-deducted-events-table");
        var r6 = document.getElementById("flexi-ration-card-points-deducted-events-table");

        var e1, e2, e3, e4, e5, e6;
        RationCard.deployed().then(function(instance){
            rationCardGlobal = instance;
            e1 = rationCardGlobal.RationCardCreated({}, {fromBlock: 0, toBlock: 'latest'});
            e1.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                console.log("RationCardCreated Events = >");
                for (var i = result.length-1; i > -1; i--) {
                // for (var i = 0; i < result.length; i++) {
                    // console.log(result[i].args._customerAddress);
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    var td3 = document.createElement("td");
                    td1.appendChild(document.createTextNode(result[i].args._customerAddress));
                    td2.appendChild(document.createTextNode(result[i].args._rationCardNumber))
                    var b = document.createElement("input");
                    b.type = "button";
                    b.setAttribute("class", "btn btn-primary btn-sm");
                    b.id = result[i].args._customerAddress;
                    b.value = "Copy";
                    b.onclick = function(e) {
                        console.log("copy btn => " + e.target.id);
                        window.centralEventsApp.copyToClipboard(e.target.id);
                    }
                    td3.appendChild(b);
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    tr.appendChild(td3);
                    r1.appendChild(tr);
                }
            });
            e2 = rationCardGlobal.FlexiRationCardCreated({}, {fromBlock: 0, toBlock: 'latest'});
            e2.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                console.log("FlexiRationCardCreated Events = >");
                for (var i = result.length-1; i > -1; i--) {
                // for (var i = 0; i < result.length; i++) {
                    // console.log(result[i].args._customerAddress);
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    var td3 = document.createElement("td");
                    td1.appendChild(document.createTextNode(result[i].args._customerAddress));
                    td2.appendChild(document.createTextNode(result[i].args._rationCardNumber))
                    var b = document.createElement("input");
                    b.type = "button";
                    b.setAttribute("class", "btn btn-primary btn-sm");
                    b.id = result[i].args._customerAddress;
                    b.value = "Copy";
                    b.onclick = function(e) {
                        console.log("copy btn => " + e.target.id);
                        window.centralEventsApp.copyToClipboard(e.target.id);
                    }
                    td3.appendChild(b);
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    tr.appendChild(td3);
                    r2.appendChild(tr);
                }
            });
            e3 = rationCardGlobal.RationCardPointsAdded({}, {fromBlock: 0, toBlock: 'latest'});
            e3.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                console.log("RationCardPointsAdded Events = >");
                for (var i = result.length-1; i > -1; i--) {
                // for (var i = 0; i < result.length; i++) {
                    // console.log(result[i].args._customerAddress);
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    var td3 = document.createElement("td");
                    var td4 = document.createElement("td");
                    td1.appendChild(document.createTextNode(result[i].args._customerAddress));
                    td2.appendChild(document.createTextNode(result[i].args._point1));
                    td3.appendChild(document.createTextNode(result[i].args._point2));
                    td4.appendChild(document.createTextNode(result[i].args._point3));
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    tr.appendChild(td3);
                    tr.appendChild(td4);
                    r3.appendChild(tr);
                }
            });
            e4 = rationCardGlobal.FlexiRationCardPointsAdded({}, {fromBlock: 0, toBlock: 'latest'});
            e4.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                console.log("FlexiRationCardPointsAdded Events = >");
                for (var i = result.length-1; i > -1; i--) {
                // for (var i = 0; i < result.length; i++) {
                    // console.log(result[i].args._customerAddress);
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    td1.appendChild(document.createTextNode(result[i].args._customerAddress));
                    td2.appendChild(document.createTextNode(result[i].args._points));
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    r4.appendChild(tr);
                }
            });
            e5 = rationCardGlobal.RationCardPointsDeducted({}, {fromBlock: 0, toBlock: 'latest'});
            e5.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                console.log("RationCardPointsDeducted Events = >");
                for (var i = result.length-1; i > -1; i--) {
                // for (var i = 0; i < result.length; i++) {
                    // console.log(result[i].args._customerAddress);
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    var td3 = document.createElement("td");
                    var td4 = document.createElement("td");
                    td1.appendChild(document.createTextNode(result[i].args._customerAddress));
                    td2.appendChild(document.createTextNode(result[i].args._point1));
                    td3.appendChild(document.createTextNode(result[i].args._point2));
                    td4.appendChild(document.createTextNode(result[i].args._point3));
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    tr.appendChild(td3);
                    tr.appendChild(td4);
                    r5.appendChild(tr);
                }
            });
            e6 = rationCardGlobal.FlexiRationCardPointsDeducted({}, {fromBlock: 0, toBlock: 'latest'});
            e6.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                console.log("FlexiRationCardPointsDeducted Events = >");
                for (var i = result.length-1; i > -1; i--) {
                // for (var i = 0; i < result.length; i++) {
                    // console.log(result[i].args._customerAddress);
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    td1.appendChild(document.createTextNode(result[i].args._customerAddress));
                    td2.appendChild(document.createTextNode(result[i].args._points));
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    r6.appendChild(tr);
                }
            });

            // $("#loadingOverlay").hide();
            setTimeout(window.centralEventsApp.loadFoodTransferEvents, 2000);
        }).catch(function(e){
            console.log(e);
            $("#loadingOverlay").hide();
        });
    },

    loadFoodTransferEvents: function() {
        var self = this;
        $("#loading-content-text").html("Loading all food transfer events ...");

        var r1 = document.getElementById("food-transfer-to-state-events-table");
        var r2 = document.getElementById("food-transfer-to-fps-events-table");
        var r3 = document.getElementById("food-transfer-to-customer-events-table");
        var r4 = document.getElementById("food-added-to-central-events-table");

        var e1, e2, e3, e4;
        Food.deployed().then(function(instance){
            foodGlobal = instance;
            e1 = foodGlobal.SupplyCentralToStateGovernment_HashLog({}, {fromBlock: 0, toBlock: 'latest'});
            e1.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                console.log("SupplyCentralToStateGovernment_HashLog => ");
                for (var i = result.length-1; i > -1; i--) {
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    var td3 = document.createElement("td");
                    td1.appendChild(document.createTextNode(foodItems[result[i].args._foodIndex][0]));
                    td2.appendChild(document.createTextNode(result[i].args._quantity));
                    td3.appendChild(document.createTextNode(result[i].args._expense));
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    tr.appendChild(td3);
                    r1.appendChild(tr);
                }
            });
            e2 = foodGlobal.SupplyToFPS_HashLog({}, {fromBlock: 0, toBlock: 'latest'});
            e2.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                console.log("SupplyToFPS_HashLog => ");
                for (var i = result.length-1; i > -1; i--) {
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    var td3 = document.createElement("td");
                    td1.appendChild(document.createTextNode(result[i].args._fpsAddress));
                    td2.appendChild(document.createTextNode(foodItems[result[i].args._foodIndex][0]));
                    td3.appendChild(document.createTextNode(result[i].args._quantity));
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    tr.appendChild(td3);
                    r2.appendChild(tr);
                }
            });
            e3 = foodGlobal.SellToCustomer_HashLog({}, {fromBlock: 0, toBlock: 'latest'});
            e3.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                var rationMap = { 0: "Fixed Scheme", 1: "Flexi Scheme"};
                console.log("SellToCustomer_HashLog => ");
                for (var i = result.length-1; i > -1; i--) {
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    var td3 = document.createElement("td");
                    var td4 = document.createElement("td");
                    var td5 = document.createElement("td");
                    var td6 = document.createElement("td");
                    td1.appendChild(document.createTextNode(result[i].args._fpsAddress));
                    td2.appendChild(document.createTextNode(result[i].args._customerAddress));
                    td3.appendChild(document.createTextNode(foodItems[result[i].args._foodIndex][0]));
                    td4.appendChild(document.createTextNode(result[i].args._quantity));
                    td5.appendChild(document.createTextNode(result[i].args._totalCost));
                    td6.appendChild(document.createTextNode(rationMap[result[i].args._rationCard]));
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    tr.appendChild(td3);
                    tr.appendChild(td4);
                    tr.appendChild(td5);
                    tr.appendChild(td6);
                    r3.appendChild(tr);
                }
            });
            e4 = foodGlobal.AddedFoodItemToStockLog({}, {fromBlock: 0, toBlock: 'latest'});
            e4.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                console.log("AddedFoodItemToStockLog => ");
                for (var i = result.length-1; i > -1; i--) {
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    td1.appendChild(document.createTextNode(foodItems[result[i].args._foodIndex][0]));
                    td2.appendChild(document.createTextNode(result[i].args._quantity));
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    r4.appendChild(tr);
                }
            });
            setTimeout(window.centralEventsApp.loadRupeeTransferEvents, 2000);
        }).catch(function(e){
            console.log(e);
        })
    },

    loadRupeeTransferEvents: function() {
        var self = this;
        $("#loading-content-text").html("Loading all rupee transfer events ...");

        var r1 = document.getElementById("rupee-transfer-to-state-events-table");
        var r2 = document.getElementById("rupee-transfer-to-customer-events-table");
        var r3 = document.getElementById("rupee-transfer-from-state-to-central-events-table");
        var r4 = document.getElementById("rupee-transfer-from-customer-to-state-events-table");

        var e1, e2, e3, e4;
        Rupee.deployed().then(function(instance){
            rupeeGlobal = instance;
            e1 = rupeeGlobal.BudgetAddedLog({}, {fromBlock: 0, toBlock: 'latest'});
            e1.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                console.log("BudgetAddedLog => ");
                for (var i = result.length-1; i > -1; i--) {
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    td1.appendChild(document.createTextNode(result[i].args._budget));
                    tr.appendChild(td1);
                    r1.appendChild(tr);
                }
            });
            e2 = rupeeGlobal.MoneyAddedLog({}, {fromBlock: 0, toBlock: 'latest'});
            e2.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                console.log("MoneyAddedLog => ");
                for (var i = result.length-1; i > -1; i--) {
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    td1.appendChild(document.createTextNode(result[i].args._userAddress));
                    td2.appendChild(document.createTextNode(result[i].args._amount));
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    r2.appendChild(tr);
                }
            });
            e3 = rupeeGlobal.StateToCentralRupeeTransferLog({}, {fromBlock: 0, toBlock: 'latest'});
            e3.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                var rationMap = { 0: "Fixed Scheme", 1: "Flexi Scheme"};
                console.log("StateToCentralRupeeTransferLog => ");
                for (var i = result.length-1; i > -1; i--) {
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    td1.appendChild(document.createTextNode(foodItems[result[i].args._foodIndex][0]));
                    td2.appendChild(document.createTextNode(result[i].args._amount));
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    r3.appendChild(tr);
                }
            });
            e4 = rupeeGlobal.CustomerToStateRupeeTransferLog({}, {fromBlock: 0, toBlock: 'latest'});
            e4.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                console.log("CustomerToStateRupeeTransferLog => ");
                for (var i = result.length-1; i > -1; i--) {
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    var td3 = document.createElement("td");
                    var td4 = document.createElement("td");
                    td1.appendChild(document.createTextNode(result[i].args._customerAddress));
                    td2.appendChild(document.createTextNode(foodItems[result[i].args._foodIndex][0]));
                    td3.appendChild(document.createTextNode(result[i].args._amount));
                    td4.appendChild(document.createTextNode(result[i].args._fpsAddress));
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    tr.appendChild(td3);
                    tr.appendChild(td4);
                    r4.appendChild(tr);
                }
            });
            setTimeout(window.centralEventsApp.hideOverlay, 2000);
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

    showUserAddedEventsdiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#user-added-events-div").show();
        }
    },

    showApprovalEventsdiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#approval-events-div").show();
        }
    },

    showRationCardEventsdiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#ration-card-events-div").show();
        }
    },

    showFoodTransferEventsdiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#food-transfer-events-div").show();
        }
    },

    showRupeeTransferEvensdiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#rupee-transfer-events-div").show();
        }
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

    copyToClipboard: function (element) {
        console.log(element);
        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val(element).select();
        document.execCommand("copy");
        $temp.remove();
    }

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
  centralEventsApp.start();
});
