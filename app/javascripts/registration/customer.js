// Import the page's CSS. Webpack will know what to do with it.
import "../../stylesheets/sidebar.css";
import "../../stylesheets/app.css";
import "../../stylesheets/customer.css";

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

var governDiv, custDiv, fpsDiv;
var loadAcctsEle, selectPlaceEle;
var i, loadUserInterval;
var notifiy1, notifiy2;


window.customerApp = {
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

        var login = self.checkLoginSessionCookie();
        if (login) {
            console.log(document.cookie);
            var cookies = document.cookie.split("; ");
            for (var a = 0; a < cookies.length; a++) {
                if (cookies[a].split("=")[0] == "customer") {
                    $("#register-link").remove();
                    $("#login-link").remove();
                    $("#profile-link").show();
                    document.getElementById('profile-name').innerHTML = cookies[a].split("=")[1].split("*")[1];
                    return;
                }
            }
        }

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
            self.loadPlaces();
            self.loadUsers();
        });
    },

    loadPlaces: function() {
        var self = this;
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
            });
        }).catch(function(e){
            console.log(e);
            return;
        });
    },

    loadUsers: function() {
        var self = this;

        // loadAcctsEle.style.display = "block";
        i = 0;
        loadUserInterval = setInterval(self.checkUserRegistered, 130);
    },

    checkUserRegistered: function() {
        var self = this;
        userGlobal.checkUserRegistered.call(accounts[i]).then(function(res){
            console.log(accounts[i] + " => " + res);
            userDb[accounts[i]] = res;
            i++;
            if (i == 10) {
                i = 0;
                clearInterval(loadUserInterval);
                // loadAcctsEle.style.display = "none";
                console.log("Finished loading/checking user registrations");
                // userDb[centralGovernmentAddress] = true;
                // userDb[stateGovernmentAddress] = true;
            }
        }).catch(function(e){
            console.log(e);
            return;
        });
    },

    showRegister: function() {
        var self = this;
        self.hideAll();
        var registerDiv = document.getElementById('customer-register');
        registerDiv.style.display = "block";
    },

    registerCustomer: function() {
        var self = this;
        var name = document.getElementById("c-name");
        var email = document.getElementById("c-email");
        var pass = document.getElementById("c-password");
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
        var userAddr = self.getNewAddress();
        userGlobal.addUser(userAddr, name.value, email.value, 0, pass.value, uplace, {from: centralGovernmentAddress, gas: 200000}).then(function(res){
            console.log(res);
            userDb[userAddr] = true;
            name.value = "";
            email.value = "";
            pass.value = "";
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

    getNewAddress: function() {
        var self = this;
        for (var key in userDb) {
            if (userDb.hasOwnProperty(key)){
                if (! userDb[key])
                    return key;
            }
        }
    },

    showLogin: function() {
        var self = this;
        self.hideAll();
        var loginDiv = document.getElementById("customer-login");
        loginDiv.style.display = "block";
    },

    login: function() {
        var self = this;

        var pass = document.getElementById('c-password-login');
        var addr = document.getElementById('c-address-login');
        if ($('input:radio[id="radio1"]').is(':checked')) {
            if (addr.value == "" || pass.value == "") {
                alert("address and password cannot empty");
                return;
            }
            userGlobal.authenticateUserWithAddress.call(addr.value, pass.value, {from: centralGovernmentAddress})
            .then(function(res) {
                if (res) {
                    // alert("FPS Authenticated using address");
                    // store cookies
                    self.getUserDetails(addr.value, 0, 5);
                    return;
                }
                alert("FPS not Authenticated");
                return;
            });
        }
        else if ($('input:radio[id="radio2"]').is(':checked')) {
            var email = document.getElementById('c-email-login');
            if (email.value == "" || pass.value == "") {
                alert("email and password cannot empty");
                return;
            }
            userGlobal.authenticateUserWithEmail.call(email.value, pass.value, {from: centralGovernmentAddress})
            .then(function(res) {
                if (res) {
                    // alert("centralGovernment Authenticated using email");
                    // store cookies
                    self.getUserDetails(addr.value, 1, 5);
                    return;
                }
                alert("FPS not Authenticated");
                return;
            });
        }
    },

    getUserDetails: function(userId, type, expDays) {
        var self = this;
        if (type == 0) {
            userGlobal.getUserDetails.call(userId, {from: centralGovernmentAddress, gas: 150000})
            .then(function(userinfo){
                console.log(userinfo);
                self.storeLoginSessionCookie(userId, expDays, userinfo);
            });
        } else if (type == 1) {
            userGlobal.getUserDetailsUsingEmail.call(userId, {from: centralGovernmentAddress, gas: 150000})
            .then(function(userinfo){
                console.log(userinfo);
                self.storeLoginSessionCookie(userId, expDays, userinfo);
            });
        }
    },

    storeLoginSessionCookie: function(userId, expDays, userinfo) {
        var d = new Date();
        d.setTime(d.getTime() + (expDays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        var userDetails = userinfo.join("*");
        document.cookie = "customer=" + userDetails + ";expires=" + expires + ";path=/";
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
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    customerApp.start();
});
