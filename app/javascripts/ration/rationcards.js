import "../../stylesheets/app.css";
import "../../stylesheets/sidebar.css"
import "../../stylesheets/central-government.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';

// Import our contract artifacts and turn them into usable abstractions.
import rationCard_artifacts from '../../../build/contracts/RationCard.json';
import user_artifacts from '../../../build/contracts/User.json';

var User = contract(user_artifacts);
var RationCard = contract(rationCard_artifacts);

var accounts, centralGovernmentAddress;
var rationCardGlobal, userGlobal;
var latestFixedCardNumber, latestFlexiCardNumber;
var alert1, alert2, fixedRationCardDiv, flexiRationCardDiv;
var loggedIn = false;

window.RationCardsApp = {
    start: function() {
        var self = this;
        User.setProvider(web3.currentProvider);
        User.deployed().then(function(instance){
            userGlobal = instance;
            console.log(userGlobal);
        });

        RationCard.setProvider(web3.currentProvider);
        RationCard.deployed().then(function(instance){
            rationCardGlobal = instance;
            console.log(rationCardGlobal);
        });

        alert1 = document.getElementById("alert-message-fixed");
        alert2 = document.getElementById("alert-message-flexi");

        web3.eth.getAccounts(function(err, accs) {
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
            console.log("centralGovernmentAddress => " + centralGovernmentAddress);
            self.checkCookies();
        });
    },

    checkCookies: function() {
        var self = this;
        var login = self.checkLoginSessionCookie();
        var flag = false;
        if (login) {
            // console.log(document.cookie);
            var cookies = document.cookie.split("; ");
            var cookieAddr;
            for (var a = 0; a < cookies.length; a++) {
                if (cookies[a].split("=")[0] == "central") {
                    cookieAddr = cookies[a].split("=")[1].split("*")[0];
                    flag = true;
                    break;
                }
            }
            if (cookieAddr && flag) {
                User.deployed().then(function(instance) {
                    userGlobal = instance;
                    return userGlobal.getUserDetails.call(cookieAddr, {from: centralGovernmentAddress});
                }).then(function(userinfo) {
                    if (userinfo[0] == cookieAddr) {
                        $("#register-link").remove();
                        $("#login-link").remove();
                        $("#profile-link").show();
                        $("#not-logged-div-card").hide();
                        document.getElementById('profile-name').innerHTML = userinfo[1];
                        loggedIn = true;
                        self.getListElements();
                        // return;
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
        }  else {
            self.notLoggedIn();
        }
    },

    notLoggedIn: function() {
        var self = this;
        $("#profile-link").hide();
        $("#not-logged-div-card").show();
        $("#ration-home-div").hide();
    },

    getListElements: function() {
        var self = this;
        fixedRationCardDiv = document.getElementById('fixed-ration-card-div');
        flexiRationCardDiv = document.getElementById('flexi-ration-card-div');
        self.getLatestCardNumber();
    },

    getLatestCardNumber: function() {
        var self = this;

        RationCard.deployed().then(function(instance){
            rationCardGlobal = instance;
            return rationCardGlobal.cardNumber.call();
        }).then(function(num){
            console.log("Latest Fixed Rationcard number => " + num.valueOf());
            latestFixedCardNumber = parseInt(num.valueOf());
            return rationCardGlobal.flexiCardNumber.call();
        }).then(function(num){
            console.log("Latest Flexi Rationcard number => " + num.valueOf());
            latestFlexiCardNumber = parseInt(num.valueOf());
        }).catch(function(e){
            console.log(e);
            // alert.setAttribute("class", "alert alert-danger col-md-10");
            // alert.innerHTML = "Couldn't fetch the latest ration card number. Error: " + e;
            // alert.style.display = "block";
        });
    },

    viewFixedRatioCardDetais: function() {
        var self = this;

        var number = document.getElementById("fixed-ration-card-number");
        if (number.value < 1001 && number.value >= latestFixedCardNumber) {
            alert1.setAttribute("class", "alert alert-danger col-md-10");
            alert1.innerHTML = "Fixed RationCard number must between 1001 and  " + latestFixedCardNumber;
            alert1.style.display = "block";
            return;
        }

        RationCard.deployed().then(function(instance){
            rationCardGlobal = instance;
            return rationCardGlobal.getRationCardInfo.call(number.value, '');
        }).then(function(info){
            console.log("RationCard => " + info);
            if (!info[0]) {
                alert1.setAttribute("class", "alert alert-danger col-md-10");
                alert1.innerHTML = "That ration card number is invalid";
                alert1.style.display = "block";
                document.getElementById("fixed-card-details-div").style.display = "none";
                return;
            }
            alert1.setAttribute("class", "alert alert-success col-md-10");
            alert1.innerHTML = "Fixed Scheme Rationcard details fetched successfully";
            alert1.style.display = "block";
            var details = document.getElementById("fixed-card-details-div");
            document.getElementById("fixed-card-number").innerHTML = info[1].valueOf();
            document.getElementById("fixed-card-custname").innerHTML = info[2];
            document.getElementById("fixed-card-street").innerHTML = info[3];
            document.getElementById("fixed-card-fps").innerHTML = info[5];
            details.style.display = "block";

        }).catch(function(e){
            console.log(e);
            alert1.setAttribute("class", "alert alert-danger col-md-10");
            alert1.innerHTML = "Couldn't fetch ration card details.";
            alert1.style.display = "block";
        });
    },

    viewFlexiRatioCardDetais: function() {
        var self = this;

        var number = document.getElementById("flexi-ration-card-number");
        if (number.value < 5001 && number.value >= latestFlexiCardNumber) {
            alert2.setAttribute("class", "alert alert-danger col-md-10");
            alert2.innerHTML = "Flexi Scheme RationCard number must between 1001 and  " + latestFixedCardNumber;
            alert2.style.display = "block";
            return;
        }

        RationCard.deployed().then(function(instance){
            rationCardGlobal = instance;
            return rationCardGlobal.getFlexiRationCardInfo.call(number.value, '');
        }).then(function(info){
            console.log(info);
            if (!info[0]) {
                alert2.setAttribute("class", "alert alert-danger col-md-10");
                alert2.innerHTML = "That ration card number is invalid";
                alert2.style.display = "block";
                document.getElementById("flexi-card-details-div").style.display = "none";
                return;
            }
            alert2.setAttribute("class", "alert alert-success col-md-10");
            alert2.innerHTML = "Flexi Scheme Rationcard details fetched successfully";
            alert2.style.display = "block";
            var details = document.getElementById("flexi-card-details-div");
            document.getElementById("flexi-card-number").innerHTML = info[1].valueOf();
            document.getElementById("flexi-card-custname").innerHTML = info[2];
            document.getElementById("flexi-card-street").innerHTML = info[3];
            document.getElementById("flexi-card-fps").innerHTML = info[5];
            details.style.display = "block";

        }).catch(function(e){
            console.log(e);
            alert2.setAttribute("class", "alert alert-danger col-md-10");
            alert2.innerHTML = "Couldn't fetch ration card details. Error: " + e;
            alert2.style.display = "block";
        });
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

    showHome: function() {
        if (loggedIn) {
            fixedRationCardDiv.style.display = "none";
            flexiRationCardDiv.style.display = "none";
        }
        $("#ration-home-div").show();
    },

    showFixedRationCard: function() {
        if (loggedIn) {
            fixedRationCardDiv.style.display = "block";
            flexiRationCardDiv.style.display = "none";
            $("#alert-message-fixed").hide();
            $("#fixed-card-details-div").hide();
            $("#ration-home-div").hide();
        }
    },

    showFlexiRationCard: function() {
        if (loggedIn) {
            fixedRationCardDiv.style.display = "none";
            flexiRationCardDiv.style.display = "block";
            $("#alert-message-flexi").hide();
            $("#flexi-card-details-div").hide();
            $("#ration-home-div").hide();
        }
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
    RationCardsApp.start();
});
