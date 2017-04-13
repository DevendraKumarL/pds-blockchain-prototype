// Import the page's CSS. Webpack will know what to do with it.
import "../../stylesheets/sidebar.css";
import "../../stylesheets/app.css";
import "../../stylesheets/central-government.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';

import user_artifacts from '../../../build/contracts/User.json';
import approval_artifacts from '../../../build/contracts/Approval.json';
import rationCard_artifacts from '../../../build/contracts/RationCard.json';

var User = contract(user_artifacts);
var Approval = contract(approval_artifacts);
var RationCard = contract(rationCard_artifacts);

var accounts, centralGovernmentAddress, stateGovernmentAddress;
var userGlobal, approvalGlobal, rationCardGlobal;

// get all accounts and store whoever is registered
var userDb = {};

var selectPlaceEle;
var i, loadUserInterval;
var notifiy1, notifiy2;


window.centralApp = {
    start: function() {
        var self = this;
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
            // self.loadPlaces();
            // self.checkCookies();
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
                        $("#loadingOverlay").hide();
                        return;
                    } else {
                        $("#loadingOverlay").hide();
                        self.showHome();
                    }
                }).catch(function(e){
                    console.log(e);
                    return;
                });
            } else {
                $("#loadingOverlay").hide();
                self.showHome();
            }
        } else {
            $("#loadingOverlay").hide();
            self.showHome();
        }
    },

    loadPlaces: function() {
        var self = this;
        $("#loading-content-text").html("Loading places ...");
        var selectPlaceEle = document.getElementById('place-list')
        User.deployed().then(function(instance){
            userGlobal = instance;
            userGlobal.getPlaces.call().then(function(list){
                for (var i = 0; i < list.length; i++) {
                    var opt = document.createElement("option");
                    opt.value = i;
                    opt.innerHTML = list[i];
                    selectPlaceEle.appendChild(opt);
                }
                window.centralApp.checkCookies();
            });
        }).catch(function(e){
            console.log(e);
            return;
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
              window.centralApp.loadPlaces();
            //   userDb[centralGovernmentAddress] = true;
            //   userDb[stateGovernmentAddress] = true;
            }
        }).catch(function(e){
            console.log(e);
            return;
        });
    },

    showRegister: function() {
        var self = this;
        self.hideAll();
        var registerDiv = document.getElementById('central-goverment-register');
        registerDiv.style.display = "block";
    },

    registerCentralGovernment: function() {
        var self = this;
        var name = document.getElementById("c-g-name");
        var email = document.getElementById("c-g-email");
        var pass = document.getElementById("c-g-password");
        if (name.value == "" || email.value == "" || pass.value == "") {
            alert("name, email, password cannot empty");
            return;
        }
        var selectPlaceEle = document.getElementById('place-list');
        var uplace = selectPlaceEle.options[selectPlaceEle.selectedIndex].value;
        if (uplace == -1) {
            alert("Select a valid place");
            return;
        }
        userGlobal.addUser(centralGovernmentAddress, name.value, email.value, 0, pass.value, uplace, {from: centralGovernmentAddress, gas: 200000}).then(function(res){
            console.log(res);
            userDb[centralGovernmentAddress] = true;
            name.value = "";
            email.value = "";
            pass.value = "";
            location.reload();
            // self.showHome();
            // alert("Government registered succesfully");
            // notifiy1.setAttribute("class", "alert alert-success col-md-12");
            // notifiy1.innerHTML = "Government registered succesfully. Address: <strong>" + centralGovernmentAddress + "</strong>";
            // notifiy1.style.display = "block";
            // self.hideDivs();
        }).catch(function(e){
            console.log(e);
            // notifiy1.setAttribute("class", "alert alert-danger col-md-12");
            // notifiy1.innerHTML = "Government registeration failed. <strong>" + e + "</strong>";
            // notifiy1.style.display = "block";
            // notifiy2.style.display = "none";
            // self.hideDivs();
            return;
        });
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

    showLogin: function() {
        var self = this;
        self.hideAll();
        var loginDiv = document.getElementById("central-goverment-login");
        loginDiv.style.display = "block";
    },

    login: function() {
        var self = this;

        var pass = document.getElementById('c-g-password-login');
        if ($('input:radio[id="radio1"]').is(':checked')) {
            var addr = document.getElementById('c-g-address-login');
            if (addr.value == "" || pass.value == "") {
                alert("address and password cannot empty");
                return;
            }
            userGlobal.authenticateUserWithAddress.call(addr.value, pass.value, {from: centralGovernmentAddress})
            .then(function(res) {
                if (res) {
                    // alert("centralGovernment Authenticated using address");
                    // store cookies
                    self.getUserDetails(addr, 5);
                    return;
                }
                alert("centralGovernment not Authenticated");
                return;
            });
        }
        else if ($('input:radio[id="radio2"]').is(':checked')) {
            var email = document.getElementById('c-g-email-login');
            if (email.value == "" || pass.value == "") {
                alert("email and password cannot empty");
                return;
            }
            userGlobal.authenticateUserWithEmail.call(email.value, pass.value, {from: centralGovernmentAddress})
            .then(function(res) {
                if (res) {
                    // alert("centralGovernment Authenticated using email");
                    // store cookies
                    self.getUserDetails(email, 5);
                    return;
                }
                alert("centralGovernment not Authenticated");
                return;
            });
        }
    },

    getUserDetails: function(userId, expDays) {
        var self = this;
        userGlobal.getUserDetails.call(centralGovernmentAddress, {from: centralGovernmentAddress, gas: 150000})
        .then(function(userinfo){
            console.log(userinfo);
            self.storeLoginSessionCookie(userId, expDays, userinfo);
        });
    },

    storeLoginSessionCookie: function(userId, expDays, userinfo) {
        var d = new Date();
        d.setTime(d.getTime() + (expDays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        var userDetails = userinfo.join("*");
        document.cookie = "central=" + userDetails + ";expires=" + expires + ";path=/";
        // document.cookie = "address=" + userinfo[0] + ";expires=" + expires + ";path=/";
        // document.cookie = "name=" + userinfo[1] + ";expires=" + expires + ";path=/";
        // document.cookie = "email=" + userinfo[2] + ";expires=" + expires + ";path=/";
        // document.cookie = "usertype=" + userinfo[3] + ";expires=" + expires + ";path=/";
        // document.cookie = "place=" + userinfo[4] + ";expires=" + expires + ";path=/";

        // document.cookie = "address=" + userId.value + ";expires=" + expires + ";path=/";
        console.log(document.cookie);
        location.reload();
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
      console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
    centralApp.start();
});
