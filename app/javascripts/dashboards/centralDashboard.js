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
var users = [];

var i, loadUserInterval;
var foodItems = {};
var j, foodItemInterval;
var loggedIn = false;

var totalNumberOfUsers;
var totalNumberOfApprovedFps, totalNumberOfApprovedCustomers, totalNumberOfUnApprovedFps, totalNumberOfUnApprovedCustomers;
var totalNumberFixedRationCards, totalNumberFlexiRationCards;
var totalTimesFoodAddedToStock, totalTimesSuppliedToState, totalTimesSuppliedToFPS, totalTimesSuppliedToCustomers;
var totalFPSFoodTransfers = {};

var totalTimesBudgetAddedToState, totalTimesMoneySentToCustomers, totalTimesMoneySentFromStateToCentral, totalTimesMoneySentFromCustomersToState;
var totalCustomersRupeeTransfers = {};

var k, foodStocksInterval;
var l, rupeeBalancesInterval;

var totalStateBudget = 0, totalCentralReceived = 0, totalStateReceived = 0;

window.centralDashboardApp = {
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
            if (res) {
                users.push(accounts[i]);
            }
            i++;
            if (i == accounts.length) {
              i = 0;
              clearInterval(loadUserInterval);
              console.log("Finished loading/checking user registrations");
              window.centralDashboardApp.checkCookies();
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
                        window.centralDashboardApp.getFoodItems();
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
            window.centralDashboardApp.loadContract1Stats();
            // window.centralEventsApp.populateFoodItems();
            // $("#loadingOverlay").hide();
        });
    },

    loadContract1Stats: function() {
        var self = this;
        $("#loading-content-text").html("Loading smart contract stats ...");

        var contractTable1 = document.getElementById("user-approval-ration-contract-table");
        var event1;
        User.deployed().then(function(instance){
            userGlobal = instance;
            event1 = userGlobal.UserAdded({}, {fromBlock: 0, toBlock: 'latest'});
            event1.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralDashboardApp.hideOverlay();
                    return;
                }
                var tr_1 = document.createElement("tr");
                var td_1 = document.createElement("td");
                tr_1.setAttribute("class", "table-info");
                td_1.appendChild(document.createTextNode("User Smart Contract Stats"));
                td_1.setAttribute("colspan", "2");
                tr_1.appendChild(td_1);
                contractTable1.appendChild(tr_1);

                totalNumberOfUsers = result.length;
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                td1.appendChild(document.createTextNode("Total No. of Users Registered"));
                td2.appendChild(document.createTextNode(totalNumberOfUsers));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable1.appendChild(tr);
            });
        }).catch(function(e){
            console.log(e);
            $("#loadingOverlay").hide();
        });
        var event2, event3, event4, event5;
        Approval.deployed().then(function(instance){
            approvalGlobal = instance;
            event2 = approvalGlobal.CustomerApproved({}, {fromBlock: 0, toBlock: 'latest'});
            event2.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralDashboardApp.hideOverlay();
                    return;
                }
                var tr_1 = document.createElement("tr");
                var td_1 = document.createElement("td");
                tr_1.setAttribute("class", "table-info");
                td_1.appendChild(document.createTextNode("Approval Smart Contract Stats"));
                td_1.setAttribute("colspan", "2");
                tr_1.appendChild(td_1);
                contractTable1.appendChild(tr_1);

                totalNumberOfApprovedCustomers = result.length;
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                td1.appendChild(document.createTextNode("Total No. of Approved Customers"));
                td2.appendChild(document.createTextNode(totalNumberOfApprovedCustomers));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable1.appendChild(tr);
            });
            event3 = approvalGlobal.FPSApproved({}, {fromBlock: 0, toBlock: 'latest'});
            event3.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralDashboardApp.hideOverlay();
                    return;
                }
                totalNumberOfApprovedFps = result.length;
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                td1.appendChild(document.createTextNode("Total No. of Approved FPS"));
                td2.appendChild(document.createTextNode(totalNumberOfApprovedFps));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable1.appendChild(tr);
            });
            event4 = approvalGlobal.CustomerAddedToApprovalList({}, {fromBlock: 0, toBlock: 'latest'});
            event4.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralDashboardApp.hideOverlay();
                    return;
                }
                totalNumberOfUnApprovedCustomers = result.length - totalNumberOfApprovedCustomers;
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                td1.appendChild(document.createTextNode("Total No. of UnApproved Customers"));
                td2.appendChild(document.createTextNode(totalNumberOfUnApprovedCustomers));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable1.appendChild(tr);
            });
            event5 = approvalGlobal.FPSAddedToApprovalList({}, {fromBlock: 0, toBlock: 'latest'});
            event5.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralDashboardApp.hideOverlay();
                    return;
                }
                totalNumberOfUnApprovedFps = result.length - totalNumberOfApprovedFps;
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                td1.appendChild(document.createTextNode("Total No. of UnApproved FPS"));
                td2.appendChild(document.createTextNode(totalNumberOfUnApprovedFps));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable1.appendChild(tr);
            });
        }).catch(function(e){
            console.log(e);
            $("#loadingOverlay").hide();
        });
        var event6, event7;
        RationCard.deployed().then(function(instance){
            rationCardGlobal = instance;
            event6 = rationCardGlobal.RationCardCreated({}, {fromBlock: 0, toBlock: 'latest'});
            event6.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                var tr_1 = document.createElement("tr");
                var td_1 = document.createElement("td");
                tr_1.setAttribute("class", "table-info");
                td_1.appendChild(document.createTextNode("RationCard Smart Contract Stats"));
                td_1.setAttribute("colspan", "2");
                tr_1.appendChild(td_1);
                contractTable1.appendChild(tr_1);

                totalNumberFixedRationCards = result.length;
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                td1.appendChild(document.createTextNode("Total No. of Fixed Cards"));
                td2.appendChild(document.createTextNode(totalNumberFixedRationCards));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable1.appendChild(tr);
            });
            event7 = rationCardGlobal.FlexiRationCardCreated({}, {fromBlock: 0, toBlock: 'latest'});
            event7.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                totalNumberFlexiRationCards = result.length;
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                td1.appendChild(document.createTextNode("Total No. of Flexi Cards"));
                td2.appendChild(document.createTextNode(totalNumberFlexiRationCards));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable1.appendChild(tr);
            });
            setTimeout(window.centralDashboardApp.loadFoodTransferEvents, 800);
        }).catch(function(e){
            console.log(e);
        })
        // points ??

    },

    loadFoodTransferEvents: function() {
        var self = this;
        $("#loading-content-text").html("Loading food transfer stats ...");

        var contractTable2 = document.getElementById("food-contract-table")
        var e1, e2, e3, e4;
        Food.deployed().then(function(instance){
            foodGlobal = instance;
            e1 = foodGlobal.AddedFoodItemToStockLog({}, {fromBlock: 0, toBlock: 'latest'});
            e1.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                var tr_1 = document.createElement("tr");
                var td_1 = document.createElement("td");
                tr_1.setAttribute("class", "table-info");
                td_1.appendChild(document.createTextNode("Food Smart Contract Stats"));
                td_1.setAttribute("colspan", "2");
                tr_1.appendChild(td_1);
                contractTable2.appendChild(tr_1);

                totalTimesFoodAddedToStock = result.length;
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                td1.appendChild(document.createTextNode("TotalNo. Food AddedToStock "));
                td2.appendChild(document.createTextNode(totalTimesFoodAddedToStock));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable2.appendChild(tr);
            });
            e2 = foodGlobal.SupplyCentralToStateGovernment_HashLog({}, {fromBlock: 0, toBlock: 'latest'});
            e2.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                totalTimesSuppliedToState = result.length;
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                td1.appendChild(document.createTextNode("TotalNo. Transfers Central"));
                td2.appendChild(document.createTextNode(totalTimesSuppliedToState));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable2.appendChild(tr);
            });
            e3 = foodGlobal.SupplyToFPS_HashLog({}, {fromBlock: 0, toBlock: 'latest'});
            e3.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                totalTimesSuppliedToFPS = result.length;
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                td1.appendChild(document.createTextNode("TotalNo. Transfers State"));
                td2.appendChild(document.createTextNode(totalTimesSuppliedToFPS));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable2.appendChild(tr);
            });
            e4 = foodGlobal.SellToCustomer_HashLog({}, {fromBlock: 0, toBlock: 'latest'});
            e4.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralEventsApp.hideOverlay();
                    return;
                }
                // var rationMap = { 0: "Fixed Scheme", 1: "Flexi Scheme"};
                totalTimesSuppliedToCustomers = result.length;
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                td1.appendChild(document.createTextNode("TotalNo. Transfers FPS"));
                td2.appendChild(document.createTextNode(totalTimesSuppliedToCustomers));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable2.appendChild(tr);

                for(var i = 0; i < result.length; i++) {
                    if (totalFPSFoodTransfers[result[i].args._fpsAddress]) {
                        totalFPSFoodTransfers[result[i].args._fpsAddress] += 1;
                    } else {
                        totalFPSFoodTransfers[result[i].args._fpsAddress] = 1;
                    }
                }
                var tr_1 = document.createElement("tr");
                var td_1 = document.createElement("td");
                tr_1.setAttribute("class", "table-info");
                td_1.appendChild(document.createTextNode("FPS Food Transfers"));
                td_1.setAttribute("colspan", "2");
                tr_1.appendChild(td_1);
                contractTable2.appendChild(tr_1);

                for(var f in totalFPSFoodTransfers) {
                    var tr_2 = document.createElement("tr");
                    var td_2 = document.createElement("td");
                    var td_3 = document.createElement("td");

                    td_2.appendChild(document.createTextNode(f));
                    td_3.appendChild(document.createTextNode(totalFPSFoodTransfers[f]));
                    tr_2.appendChild(td_2);
                    tr_2.appendChild(td_3);
                    contractTable2.appendChild(tr_2);
                }
            });
            setTimeout(window.centralDashboardApp.loadRupeeTransferEvents, 800);
        }).catch(function(e){
            console.log(e);
        })
    },

    loadRupeeTransferEvents: function() {
        var self = this;
        $("#loading-content-text").html("Loading rupee transfer stats ...");

        var contractTable3 = document.getElementById("rupee-contract-table")

        var e1, e2, e3, e4;
        Rupee.deployed().then(function(instance){
            rupeeGlobal = instance;
            e1 = rupeeGlobal.BudgetAddedLog({}, {fromBlock: 0, toBlock: 'latest'});
            e1.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralDashboardApp.hideOverlay();
                    return;
                }
                var tr_1 = document.createElement("tr");
                var td_1 = document.createElement("td");
                tr_1.setAttribute("class", "table-info");
                td_1.appendChild(document.createTextNode("Rupee Smart Contract Stats"));
                td_1.setAttribute("colspan", "2");
                tr_1.appendChild(td_1);
                contractTable3.appendChild(tr_1);

                totalTimesBudgetAddedToState = result.length;
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                td1.appendChild(document.createTextNode("TotalNo. Budget AddedToState"));
                td2.appendChild(document.createTextNode(totalTimesBudgetAddedToState));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable3.appendChild(tr);
                for (var i = 0; i < result.length; i++) {
                    totalStateBudget += parseInt(result[i].args._budget);
                }
            });
            e2 = rupeeGlobal.MoneyAddedLog({}, {fromBlock: 0, toBlock: 'latest'});
            e2.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralDashboardApp.hideOverlay();
                    return;
                }
                totalTimesMoneySentToCustomers = result.length;
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                td1.appendChild(document.createTextNode("TotalNo. Transfers to Customers"));
                td2.appendChild(document.createTextNode(totalTimesMoneySentToCustomers));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable3.appendChild(tr);
            });
            e3 = rupeeGlobal.StateToCentralRupeeTransferLog({}, {fromBlock: 0, toBlock: 'latest'});
            e3.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralDashboardApp.hideOverlay();
                    return;
                }
                // var rationMap = { 0: "Fixed Scheme", 1: "Flexi Scheme"};
                totalTimesMoneySentFromStateToCentral = result.length;
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                td1.appendChild(document.createTextNode("TotalNo. Transfers to Central from State"));
                td2.appendChild(document.createTextNode(totalTimesMoneySentFromStateToCentral));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable3.appendChild(tr);
                for (var i = 0; i < result.length; i++) {
                    totalCentralReceived += parseInt(result[i].args._amount);
                }
            });
            e4 = rupeeGlobal.CustomerToStateRupeeTransferLog({}, {fromBlock: 0, toBlock: 'latest'});
            e4.get(function(error, result){
                if (error) {
                    console.log(error);
                    window.centralDashboardApp.hideOverlay();
                    return;
                }
                totalTimesMoneySentFromCustomersToState = result.length;
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                td1.appendChild(document.createTextNode("TotalNo. Transfers to State from Customers"));
                td2.appendChild(document.createTextNode(totalTimesMoneySentFromCustomersToState));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable3.appendChild(tr);

                for(var i = 0; i < result.length; i++) {
                    totalStateReceived += parseInt(result[i].args._amount);
                    if (totalCustomersRupeeTransfers[result[i].args._customerAddress]) {
                        totalCustomersRupeeTransfers[result[i].args._customerAddress] += 1;
                    } else {
                        totalCustomersRupeeTransfers[result[i].args._customerAddress] = 1;
                    }
                }
                var tr_1 = document.createElement("tr");
                var td_1 = document.createElement("td");
                tr_1.setAttribute("class", "table-info");
                td_1.appendChild(document.createTextNode("Customers Rupee Transfers"));
                td_1.setAttribute("colspan", "2");
                tr_1.appendChild(td_1);
                contractTable3.appendChild(tr_1);

                for(var f in totalCustomersRupeeTransfers) {
                    var tr_2 = document.createElement("tr");
                    var td_2 = document.createElement("td");
                    var td_3 = document.createElement("td");

                    td_2.appendChild(document.createTextNode(f));
                    td_3.appendChild(document.createTextNode(totalCustomersRupeeTransfers[f]));
                    tr_2.appendChild(td_2);
                    tr_2.appendChild(td_3);
                    contractTable3.appendChild(tr_2);
                }
            });
            setTimeout(window.centralDashboardApp.loadFoodStocksInterval, 300);
        }).catch(function(e){
            console.log(e);
        })
    },

    loadFoodStocksInterval: function() {
        var self = this;
        $("#loading-content-text").html("Loading food stocks stats ...");

        k = 0;
        foodStocksInterval = setInterval(window.centralDashboardApp.loadStocks, 500);
    },

    loadStocks: function() {
        var self = this;
        var contractTable4 = document.getElementById("food2-contract-table");
        var addr, f1 = 0, f2 = 0, f3 = 0;
        Food.deployed().then(function(instance){
            foodGlobal = instance;
            // console.log("here");
            return foodGlobal.getFoodStock.call(users[k], 0);
        }).then(function(stock1){
            addr = users[k];
            if (parseInt(stock1.valueOf()) != 0) {
                f1 = stock1.valueOf();
            }
            // console.log("here");
            return foodGlobal.getFoodStock.call(users[k], 1);
        }).then(function(stock2){
            if (parseInt(stock2.valueOf()) != 0) {
                f2 = stock2.valueOf();
            }
            // console.log("here");
            return foodGlobal.getFoodStock.call(users[k], 2);
        }).then(function(stock3){
            if (parseInt(stock3.valueOf()) != 0) {
                f3 = stock3.valueOf();
            }
            var tr = document.createElement("tr");
            var td1 = document.createElement("td");
            var td2 = document.createElement("td");
            var td3 = document.createElement("td");
            var td4 = document.createElement("td");
            if (k == 0) {
                td1.appendChild(document.createTextNode(addr + " (Central)"));
            } else if (k == 1) {
                td1.appendChild(document.createTextNode(addr + " (State)"));
            } else {
                td1.appendChild(document.createTextNode(addr));
            }
            td2.appendChild(document.createTextNode(f1));
            td3.appendChild(document.createTextNode(f2));
            td4.appendChild(document.createTextNode(f3));
            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tr.appendChild(td4);
            contractTable4.appendChild(tr);
            k++;
            // console.log("here");
            if (k == users.length) {
                k = 0;
                clearInterval(foodStocksInterval);
                console.log("Finished loading food stock stats");
                setTimeout(window.centralDashboardApp.loadRupeeTransferInterval, 300);
                // $("#loadingOverlay").hide();
            }
        }).catch(function(e){
            console.log(e);
        })
    },

    loadRupeeTransferInterval: function() {
        var self = this;
        $("#loading-content-text").html("Loading rupee balances stats ...");

        l = 0;
        rupeeBalancesInterval =  setInterval(window.centralDashboardApp.loadBalances, 500);
    },

    loadBalances: function() {
        var self = this;
        var contractTable5 = document.getElementById("rupee2-contract-table");
        var addr;
        Rupee.deployed().then(function(instance){
            rupeeGlobal = instance;
            return rupeeGlobal.getBalance.call(users[l]);
        }).then(function(bal){
            if (parseInt(bal.valueOf()) != 0) {
                addr = users[l];
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");
                if (l == 0) {
                    td1.appendChild(document.createTextNode(addr + " (Central)"));
                } else if (l == 1) {
                    td1.appendChild(document.createTextNode(addr + " (State)"));
                } else {
                    td1.appendChild(document.createTextNode(addr));
                }
                td2.appendChild(document.createTextNode(bal.valueOf()));
                tr.appendChild(td1);
                tr.appendChild(td2);
                contractTable5.appendChild(tr);
            }
            l++;
            if (l == users.length) {
                l = 0;
                clearInterval(rupeeBalancesInterval);
                Rupee.deployed().then(function(instance){
                    rupeeGlobal = instance;
                    return rupeeGlobal.getBudgetBalance.call();
                }).then(function(balstate){
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    var td2 = document.createElement("td");
                    td1.appendChild(document.createTextNode(stateGovernmentAddress + " (State Budget)"));
                    td2.appendChild(document.createTextNode(balstate.valueOf()));
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    contractTable5.appendChild(tr);
                    setTimeout(window.centralDashboardApp.loadTotalFinalStats, 100);
                    // $("#loadingOverlay").hide();
                });
            }
        }).catch(function(e){
            console.log(e);
        })
    },

    loadTotalFinalStats: function() {
        var self = this;
        $("#loading-content-text").html("Loading total final stats ...");
        var contractTable6 = document.getElementById("rupee3-contract-table");
        var tr1 = document.createElement("tr");
        var td1 = document.createElement("td");
        var td2 = document.createElement("td");
        td1.appendChild(document.createTextNode("Total Budget Spent to State"));
        td2.appendChild(document.createTextNode(totalStateBudget));
        tr1.appendChild(td1);
        tr1.appendChild(td2);
        contractTable6.appendChild(tr1);
        var tr2 = document.createElement("tr");
        var td3 = document.createElement("td");
        var td4 = document.createElement("td");
        td3.appendChild(document.createTextNode("Total Central Received"));
        td4.appendChild(document.createTextNode(totalCentralReceived));
        tr2.appendChild(td3);
        tr2.appendChild(td4);
        contractTable6.appendChild(tr2);
        var tr3 = document.createElement("tr");
        var td5 = document.createElement("td");
        var td6 = document.createElement("td");
        td5.appendChild(document.createTextNode("Total State Received"));
        td6.appendChild(document.createTextNode(totalStateReceived));
        tr3.appendChild(td5);
        tr3.appendChild(td6);
        contractTable6.appendChild(tr3);
        setTimeout(window.centralDashboardApp.hideOverlay, 200);
    },

    hideOverlay: function() {
        $("#loadingOverlay").hide();
    },

    hideAll: function() {
        var all = document.getElementById('main');
        var nodes = all.childNodes;
        // console.log(nodes);
        for (var i = 1; i < nodes.length; i+=2) {
            nodes[i].style.display = "none";
        }
    },

    showHome: function() {
        var self = this;
        self.hideAll();
        var landing = document.getElementById('landing');
        landing.style.display = "block";
    },

    notLoggedIn: function() {
        var self = this;
        $("#profile-link").hide();
        $("#not-logged-div-card").show();
        $("#loadingOverlay").hide();
        $("#landing").hide();
    },

    showDashboardStatsdiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#dashboard-stats-div").show();
        }
    },

    showDashboard2Statsdiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#dashboard2-stats-div").show();
        }
    },

    showDashboard3Statsdiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#dashboard3-stats-div").show();
        }
    },

    showDashboard4Statsdiv: function() {
        var self = this;
        if (loggedIn) {
            self.hideAll();
            $("#dashboard4-stats-div").show();
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
  centralDashboardApp.start();
});
