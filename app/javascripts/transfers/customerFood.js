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
var loggedIn = false, customerData, customerApproved = false;

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
            window.customerFoodApp.hideOverlay();
            // window.customerFoodApp.populateFoodItems();
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
