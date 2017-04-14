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
        $("#loading-content-text").html("Checking cookies ...");
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
                    return userGlobal.getUserDetails.call(cookieAddr);
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
        $("#loadingOverlay").hide();
    },

    getListElements: function() {
        var self = this;
        $("#loading-content-text").html("Loading DOM elements ...");
        fixedRationCardDiv = document.getElementById('fixed-ration-card-div');
        flexiRationCardDiv = document.getElementById('flexi-ration-card-div');
        self.getLatestCardNumber();
    },

    getLatestCardNumber: function() {
        var self = this;
        $("#loading-content-text").html("Loading latest rationcard numbers ...");

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
            $("#loadingOverlay").hide();
        }).catch(function(e){
            console.log(e);
            // alert.setAttribute("class", "alert alert-danger col-md-6");
            // alert.innerHTML = "Couldn't fetch the latest ration card number. Error: " + e;
            // alert.style.display = "block";
        });
    },

    viewFixedRatioCardDetais: function() {
        var self = this;

        var number = document.getElementById("fixed-ration-card-number");
        var addr = document.getElementById("fixed-ration-card-addr");

        var useNumber = false;
        if ($('input:radio[id="radio1"]').is(':checked')) {
            useNumber = true;
        }
        else if ($('input:radio[id="radio2"]').is(':checked')) {
            useNumber = false;
        }
        console.log("useNumber => " + useNumber);

        if (useNumber && (number.value == "" || number.value < 1001 || number.value >= latestFixedCardNumber)) {
            alert1.setAttribute("class", "alert alert-danger col-md-6");
            alert1.innerHTML = "Fixed Scheme RationCard number must between 1001 and  " + (latestFixedCardNumber - 1);
            alert1.style.display = "block";
            $("#fixed-card-give-points-div").hide();
            return;
        }

        if (!useNumber && (addr.value == "")) {
            alert1.setAttribute("class", "alert alert-danger col-md-6");
            alert1.innerHTML = "Please give the addres of the customer/ RationCard";
            alert1.style.display = "block";
            $("#fixed-card-give-points-div").hide();
            return;
        }

        var fixedRationCustomerTable = document.getElementById("fixed-ration-customer-table");
        var fixedRationPointsCustomerTable = document.getElementById("fixed-ration-points-customer-table");
        fixedRationCustomerTable.innerHTML = "";
        fixedRationPointsCustomerTable.innerHTML = "";
        var tr1 = document.createElement("tr");
        var tr2 = document.createElement("tr");
        var tr3 = document.createElement("tr");
        var tr4 = document.createElement("tr");
        var tr5 = document.createElement("tr");
        var td1 = document.createElement("td");
        var td2 = document.createElement("td");
        var td3 = document.createElement("td");
        var td4 = document.createElement("td");
        var td5 = document.createElement("td");
        var td6 = document.createElement("td");
        var td7 = document.createElement("td");
        var td8 = document.createElement("td");
        var td9 = document.createElement("td");
        var td10 = document.createElement("td");

        RationCard.deployed().then(function(instance){
            rationCardGlobal = instance;
            if (useNumber)
                return rationCardGlobal.getRationCardInfo.call(number.value, '');
            else
                return rationCardGlobal.getRationCardInfo.call(0, addr.value);
        }).then(function(info){
            console.log("RationCard => " + info);
            if (!info[0]) {
                alert1.setAttribute("class", "alert alert-danger col-md-6");
                alert1.innerHTML = "That ration card number is invalid";
                alert1.style.display = "block";
                document.getElementById("fixed-card-details-div").style.display = "none";
                $("#fixed-card-give-points-div").hide();
                return;
            }
            alert1.setAttribute("class", "alert alert-success col-md-6");
            alert1.innerHTML = "Fixed Scheme Rationcard details fetched successfully";
            alert1.style.display = "block";
            alert1.style.display = "none";
            var details = document.getElementById("fixed-card-details-div");
            // document.getElementById("fixed-card-number").innerHTML = info[1].valueOf();
            // document.getElementById("fixed-card-custname").innerHTML = info[2];
            // document.getElementById("fixed-card-street").innerHTML = info[3];
            // document.getElementById("fixed-card-fps").innerHTML = info[5];
            details.style.display = "block";

            td3.appendChild(document.createTextNode("RationCard Number"));
            td4.appendChild(document.createTextNode(info[1].valueOf()));
            tr2.appendChild(td3);
            tr2.appendChild(td4);
            td5.appendChild(document.createTextNode("Customer Name"));
            td6.appendChild(document.createTextNode(info[2]));
            tr3.appendChild(td5);
            tr3.appendChild(td6);
            td7.appendChild(document.createTextNode("Street address"));
            td8.appendChild(document.createTextNode(info[3]));
            tr4.appendChild(td7);
            tr4.appendChild(td8);
            td9.appendChild(document.createTextNode("FPS Address(Id)"));
            td10.appendChild(document.createTextNode(info[5]));
            tr5.appendChild(td9);
            tr5.appendChild(td10);

            return rationCardGlobal.getRationCardPoints.call(info[1], '');
        }).then(function(points){
            if (points) {
                // $("#fixed-card-item1-points").html(points[1].valueOf());
                // $("#fixed-card-item2-points").html(points[2].valueOf());
                // $("#fixed-card-item3-points").html(points[3].valueOf());
                // $("#fixed-card-custaddr").html(points[4]);
                $("#fixed-card-give-points-div").show();

                var tr6 = document.createElement("tr");
                var tr7 = document.createElement("tr");
                var tr8 = document.createElement("tr");

                var td11 = document.createElement("td");
                var td12 = document.createElement("td");
                var td13 = document.createElement("td");
                var td14 = document.createElement("td");
                var td15 = document.createElement("td");
                var td16 = document.createElement("td");

                td11.appendChild(document.createTextNode("Rice"));
                td12.appendChild(document.createTextNode(points[1].valueOf()));
                tr6.appendChild(td11);
                tr6.appendChild(td12);
                td13.appendChild(document.createTextNode("Wheat"));
                td14.appendChild(document.createTextNode(points[2].valueOf()));
                tr7.appendChild(td13);
                tr7.appendChild(td14);
                td15.appendChild(document.createTextNode("Sugar"));
                td16.appendChild(document.createTextNode(points[3].valueOf()));
                tr8.appendChild(td15);
                tr8.appendChild(td16);

                fixedRationPointsCustomerTable.appendChild(tr6);
                fixedRationPointsCustomerTable.appendChild(tr7);
                fixedRationPointsCustomerTable.appendChild(tr8);

                td1.appendChild(document.createTextNode("Customer Address(Id)"));
                td2.appendChild(document.createTextNode(points[4]));
                tr1.appendChild(td1);
                tr1.appendChild(td2);

                fixedRationCustomerTable.appendChild(tr1);
                fixedRationCustomerTable.appendChild(tr2);
                fixedRationCustomerTable.appendChild(tr3);
                fixedRationCustomerTable.appendChild(tr4);
                fixedRationCustomerTable.appendChild(tr5);
                return;
            }
        }).catch(function(e){
            console.log(e);
            alert1.setAttribute("class", "alert alert-danger col-md-6");
            alert1.innerHTML = "Couldn't fetch ration card details.";
            alert1.style.display = "block";
        });
    },

    viewFlexiRatioCardDetais: function() {
        var self = this;

        var number = document.getElementById("flexi-ration-card-number");
        var addr = document.getElementById("flexi-ration-card-addr");

        var useNumber = false;
        if ($('input:radio[id="radio3"]').is(':checked')) {
            useNumber = true;
        }
        else if ($('input:radio[id="radio4"]').is(':checked')) {
            useNumber = false;
        }
        console.log("useNumber => " + useNumber);

        if (useNumber && (number.value == "" || number.value < 5001 || number.value >= latestFlexiCardNumber)) {
            alert2.setAttribute("class", "alert alert-danger col-md-6");
            alert2.innerHTML = "Fixed Scheme RationCard number must between 1001 and  " + (latestFlexiCardNumber - 1);
            alert2.style.display = "block";
            $("#flexi-card-give-points-div").hide();
            return;
        }

        if (!useNumber && (addr.value == "")) {
            alert2.setAttribute("class", "alert alert-danger col-md-6");
            alert2.innerHTML = "Please give the addres of the customer/ RationCard";
            alert2.style.display = "block";
            $("#flexi-card-give-points-div").hide();
            return;
        }

        var flexiRationCustomerTable = document.getElementById("flexi-ration-customer-table");
        var flexiRationPointsCustomerTable = document.getElementById("flexi-ration-points-customer-table");
        flexiRationCustomerTable.innerHTML = "";
        flexiRationPointsCustomerTable.innerHTML = "";
        var tr1 = document.createElement("tr");
        var tr2 = document.createElement("tr");
        var tr3 = document.createElement("tr");
        var tr4 = document.createElement("tr");
        var tr5 = document.createElement("tr");
        var td1 = document.createElement("td");
        var td2 = document.createElement("td");
        var td3 = document.createElement("td");
        var td4 = document.createElement("td");
        var td5 = document.createElement("td");
        var td6 = document.createElement("td");
        var td7 = document.createElement("td");
        var td8 = document.createElement("td");
        var td9 = document.createElement("td");
        var td10 = document.createElement("td");

        RationCard.deployed().then(function(instance){
            rationCardGlobal = instance;
            if (useNumber)
                return rationCardGlobal.getFlexiRationCardInfo.call(number.value, '');
            else
                return rationCardGlobal.getFlexiRationCardInfo.call(0, addr.value);
        }).then(function(info){
            console.log(info);
            if (!info[0]) {
                alert2.setAttribute("class", "alert alert-danger col-md-6");
                alert2.innerHTML = "That ration card number is invalid";
                alert2.style.display = "block";
                document.getElementById("flexi-card-details-div").style.display = "none";
                return;
            }
            alert2.setAttribute("class", "alert alert-success col-md-6");
            alert2.innerHTML = "Flexi Scheme Rationcard details fetched successfully";
            // alert2.style.display = "block";
            alert2.style.display = "none";
            var details = document.getElementById("flexi-card-details-div");
            // document.getElementById("flexi-card-number").innerHTML = info[1].valueOf();
            // document.getElementById("flexi-card-custname").innerHTML = info[2];
            // document.getElementById("flexi-card-street").innerHTML = info[3];
            // document.getElementById("flexi-card-fps").innerHTML = info[5];
            details.style.display = "block";

            td3.appendChild(document.createTextNode("RationCard Number"));
            td4.appendChild(document.createTextNode(info[1].valueOf()));
            tr2.appendChild(td3);
            tr2.appendChild(td4);
            td5.appendChild(document.createTextNode("Customer Name"));
            td6.appendChild(document.createTextNode(info[2]));
            tr3.appendChild(td5);
            tr3.appendChild(td6);
            td7.appendChild(document.createTextNode("Street address"));
            td8.appendChild(document.createTextNode(info[3]));
            tr4.appendChild(td7);
            tr4.appendChild(td8);
            td9.appendChild(document.createTextNode("FPS Address(Id)"));
            td10.appendChild(document.createTextNode(info[5]));
            tr5.appendChild(td9);
            tr5.appendChild(td10);

            return rationCardGlobal.getFlexiRationCardPoints.call(info[1], '');
        }).then(function(points){
            if (points[0]) {
                // $("#flexi-card-points").html(points[1].valueOf());
                // $("#flexi-card-custaddr").html(points[2]);
                // $("#flexi-card-give-points-div").show();

                var tr6 = document.createElement("tr");
                var td11 = document.createElement("td");
                var td12 = document.createElement("td");

                td11.appendChild(document.createTextNode("Points"));
                td12.appendChild(document.createTextNode(points[1].valueOf()));
                tr6.appendChild(td11);
                tr6.appendChild(td12);

                flexiRationPointsCustomerTable.appendChild(tr6);

                td1.appendChild(document.createTextNode("Customer Address(Id)"));
                td2.appendChild(document.createTextNode(points[2]));
                tr1.appendChild(td1);
                tr1.appendChild(td2);

                flexiRationCustomerTable.appendChild(tr1);
                flexiRationCustomerTable.appendChild(tr2);
                flexiRationCustomerTable.appendChild(tr3);
                flexiRationCustomerTable.appendChild(tr4);
                flexiRationCustomerTable.appendChild(tr5);
                return;
            }
        }).catch(function(e){
            console.log(e);
            alert2.setAttribute("class", "alert alert-danger col-md-6");
            alert2.innerHTML = "Couldn't fetch ration card details.";
            alert2.style.display = "block";
        });
    },

    giveFixedRationPoints: function() {
        var self = this;
        var p1 = $("#give-fixed-point1").val();
        var p2 = $("#give-fixed-point2").val();
        var p3 = $("#give-fixed-point3").val();
        if (p1 == "" || p1 == 0 || p2 == "" || p2 == 0 || p3 == "" || p3 == 0) {
            alert1.setAttribute("class", "alert alert-danger col-md-6");
            alert1.innerHTML = "All Points must be greater than 0";
            alert1.style.display = "block";
            return;
        }
        if ($("#confirm-fixed-card-password").val() == "") {
            return;
        }
        var custAddr = $("#fixed-card-custaddr").html();
        console.log("fixed: " + custAddr + " * " + p1 + " * " + p2 + " * " + p3);
        var pass = $("#confirm-fixed-card-password").val();
        User.deployed().then(function(instance){
            userGlobal = instance;
            return userGlobal.authenticateUserWithAddress.call(centralGovernmentAddress, pass);
        }).then(function(res){
            if (!res) {
                alert1.setAttribute("class", "alert alert-danger col-md-6");
                alert1.innerHTML = "Sorry authentication failed, password is incorrect, try again.";
                alert1.style.display = "block";
                return;
            }
            RationCard.deployed().then(function(instance){
                rationCardGlobal = instance;
                return rationCardGlobal.addRationCardPoints(custAddr, p1, p2, p3, {from: centralGovernmentAddress, gas: 200000});
            }).then(function(res){
                console.log(res);
                alert("More points added successfully for card:\n" + custAddr);
                location.reload();
            });
        }).catch(function(e){
            console.log(e);
            alert1.setAttribute("class", "alert alert-danger col-md-6");
            alert1.innerHTML = "Sorry something went wrong, couldn't add points for this card";
            alert1.style.display = "block";
        });
    },

    giveFlexiRationPoints: function() {
        var self = this;
        var p1 = $("#give-flexi-point").val();
        if (p1 == "" || p1 == 0 || p1 < 3) {
            alert2.setAttribute("class", "alert alert-danger col-md-6");
            alert2.innerHTML = "Points must be 3 at minimum";
            alert2.style.display = "block";
            return;
        }
        var custAddr = $("#flexi-card-custaddr").html();
        console.log("fixed: " + custAddr + " * " + p1);
        if ($("#confirm-flexi-card-password").val() == "") {
            return;
        }
        var pass = $("#confirm-flexi-card-password").val();
        User.deployed().then(function(instance){
            userGlobal = instance;
            return userGlobal.authenticateUserWithAddress.call(centralGovernmentAddress, pass);
        }).then(function(res){
            if (!res) {
                alert2.setAttribute("class", "alert alert-danger col-md-6");
                alert2.innerHTML = "Sorry authentication failed, password is incorrect, try again.";
                alert2.style.display = "block";
                return;
            }
            RationCard.deployed().then(function(instance){
                rationCardGlobal = instance;
                return rationCardGlobal.addFlexiRationCardPoints(custAddr, p1, {from: centralGovernmentAddress, gas: 200000});
            }).then(function(res){
                console.log(res);
                alert("More points added successfully for card:\n" + custAddr);
                location.reload();
            })
        }).catch(function(e){
            console.log(e);
            alert2.setAttribute("class", "alert alert-danger col-md-6");
            alert2.innerHTML = "Sorry something went wrong, couldn't add points for this card";
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
            $("#fixed-card-give-points-div").hide();
            $("#flexi-card-give-points-div").hide();
            $("#fixed-number-div").show();
            $("#fixed-addr-div").hide();
            $("#flexi-number-div").show();
            $("#flexi-addr-div").hide();
            var number = document.getElementById("fixed-ration-card-number");
            var addr = document.getElementById("fixed-ration-card-addr");
            number.value = "";
            addr.value = "";
            var fixedRationCustomerTable = document.getElementById("fixed-ration-customer-table");
            var fixedRationPointsCustomerTable = document.getElementById("fixed-ration-points-customer-table");
            fixedRationCustomerTable.innerHTML = "";
            fixedRationPointsCustomerTable.innerHTML = "";
        }
    },

    showFlexiRationCard: function() {
        if (loggedIn) {
            fixedRationCardDiv.style.display = "none";
            flexiRationCardDiv.style.display = "block";
            $("#alert-message-flexi").hide();
            $("#flexi-card-details-div").hide();
            $("#ration-home-div").hide();
            $("#fixed-card-give-points-div").hide();
            $("#flexi-card-give-points-div").hide();
            $("#fixed-number-div").show();
            $("#fixed-addr-div").hide();
            $("#flexi-number-div").show();
            $("#flexi-addr-div").hide();
            var number = document.getElementById("flexi-ration-card-number");
            var addr = document.getElementById("flexi-ration-card-addr");
            number.value = "";
            addr.value = "";
            var flexiRationCustomerTable = document.getElementById("flexi-ration-customer-table");
            var flexiRationPointsCustomerTable = document.getElementById("flexi-ration-points-customer-table");
            flexiRationCustomerTable.innerHTML = "";
            flexiRationPointsCustomerTable.innerHTML = "";
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
