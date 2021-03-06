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
var approvedFpsDb = [];

var loggedCustomer, customerData, prevAddr;

var governDiv, custDiv, fpsDiv;
var loadAcctsEle, selectPlaceEle;
var i, loadUserInterval, j, loadApprovedFpsInterval;
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

    checkCookies: function() {
        var self = this;
        $("#loading-content-text").html("Loading cookies ...");
        var login = self.checkLoginSessionCookie();
        if (login) {
            console.log(document.cookie);
            var cookies = document.cookie.split("; ");
            var cookieAddr;
            for (var a = 0; a < cookies.length; a++) {
                if (cookies[a].split("=")[0] == "customer") {
                    cookieAddr = cookies[a].split("=")[1].split("*")[0];
                    console.log("cookieAddr => " + cookieAddr);
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
                        loggedCustomer = userinfo[0];
                        customerData = userinfo;
                        console.log(loggedCustomer + " - " + customerData);
                        $("#user-address").html(customerData[0]);
                        self.loadApprovedFps();
                        return;
                    } else {
                        $('#loadingOverlay').hide();
                        self.showHome();
                    }
                }).catch(function(e){
                    console.log(e);
                    return;
                });
            } else {
                $('#loadingOverlay').hide();
                self.showHome();
            }
        } else {
            $('#loadingOverlay').hide();
            self.showHome();
        }
    },

    loadPlaces: function() {
        $("#loading-content-text").html("Loading places ...");
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
        $("#loading-content-text").html("Loading accounts from testrpc ...");
        // loadAcctsEle.style.display = "block";
        i = 0;
        loadUserInterval = setInterval(self.checkUserRegistered, 150);
    },

    checkUserRegistered: function() {
        var self = this;
        userGlobal.checkUserRegistered.call(accounts[i]).then(function(res){
            console.log(accounts[i] + " => " + res);
            userDb[accounts[i]] = res;
            i++;
            if (i == accounts.length) { // fix this, use accounts.length
                i = 0;
                clearInterval(loadUserInterval);
                window.customerApp.checkCookies();
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
        userGlobal.addUser(userAddr, name.value, email.value, 2, pass.value, uplace, {from: centralGovernmentAddress, gas: 220000}).then(function(res){
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
            return Approval.deployed();
        }).then(function(instance) {
            approvalGlobal = instance;
            return approvalGlobal.addToNotApprovedList(userAddr, 2, {from: centralGovernmentAddress, gas: 250000});
        }).then(function(res){
            console.log(res);
            alert("Customer added to Pending Approval List. Wait for Government to approve.");
            location.reload();
            // notifiy2.setAttribute("class", "alert alert-info col-md-12");
            // notifiy2.innerHTML = "Customer added to Pending Approval List. Wait for Government to approve.";
            // notifiy2.style.display = "block";
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
        console.log(nodes);
        for (var i = 1; i < nodes.length; i+=2) {
            nodes[i].style.display = "none";
        }
    },

    getNewAddress: function() {
        var self = this;
        for (var key in userDb) {
            if (userDb.hasOwnProperty(key)){
                if (! userDb[key]) // fix bug, add condition to not select centralGovernmentAddress and stateGovernmentAddress
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
            userGlobal.authenticateUserWithAddress.call(addr.value, pass.value)
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
            userGlobal.authenticateUserWithEmail.call(email.value, pass.value)
            .then(function(res) {
                if (res) {
                    // alert("centralGovernment Authenticated using email");
                    // store cookies
                    self.getUserDetails(email.value, 1, 5);
                    return;
                }
                alert("FPS not Authenticated");
                return;
            });
        }
    },

    getUserDetails: function(userId, type, expDays) {
        var self = this;
        console.log("type : " + type + " userId : " + userId);
        if (type == 0) {
            userGlobal.getUserDetails.call(userId)
            .then(function(userinfo){
                console.log(userinfo);
                self.storeLoginSessionCookie(userId, expDays, userinfo);
            });
        } else if (type == 1) {
            userGlobal.getUserDetailsUsingEmail.call(userId)
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

    showRationCards: function() {
        var self = this;
        self.hideAll();
        if (typeof loggedCustomer == 'undefined') {
            $("#ration-div").show();
            $("#must-login-customer").show();
        } else {
            $("#ration-div").show();
            $("#must-login-customer").hide();
        }
    },

    loadCustomerRationCards: function() {
        var self = this;
        $("#loading-content-text").html("Loading customer ration cards ...");
        console.log("customer address => " + loggedCustomer);
        if (typeof loggedCustomer != 'undefined') {
            Approval.deployed().then(function(instance){
                approvalGlobal = instance;
                return approvalGlobal.getUserApproval.call(loggedCustomer, 2);
            }).then(function(res) {
                if (res[1]) {
                    self.hideAll();
                    $("#ration-message").show();
                    $("#ration-message-1").removeClass("alert-info").addClass("alert-success");
                    $("#ration-message-1").html("User Approved by centralGovernment.");
                    $("#ration-message-2").hide();
                    $("#ration-message-3").hide();
                    $("#ration-main-div").show();
                    RationCard.deployed().then(function(instance){
                        rationCardGlobal = instance;
                        return rationCardGlobal.checkRationCardExists.call(loggedCustomer);
                    }).then(function(exists){
                        $("#ration-message-2").show();
                        if (exists) {
                            $("#ration-message-2").removeClass("alert-info").addClass("alert-success");
                            $("#ration-message-2").html("Fixed Scheme RationCard exists.");
                            $("#radio3-label").hide();
                            // populate fixed ration card details for this customer
                            window.customerApp.showFixedRationCardDetails();
                        } else {
                            $("#ration-message-2").removeClass("alert-info").addClass("alert-danger");
                            $("#ration-message-2").html("Fixed Scheme RationCard does not exists.");
                            $("#ration-message-3").hide();
                            $('input:radio[name="radio_new"]').change(function() {
                                if ($('input:radio[id="radio3"]').is(':checked')) {
                                    console.log("fixed");
                                    $("#create-ration-card-div").show();
                                    $("#create-ration-card-btn").attr("data-customeraddr", customerData[0]);
                                    $("#create-ration-card-btn").attr("data-usertype", customerData[3]);
                                    $("#create-ration-card-btn").attr("data-customername", customerData[1]);
                                    $("#create-ration-card-btn").attr("data-customerplace", customerData[4]);
                                    $("#create-ration-card-div-flexi").hide();
                                }
                            });
                        }
                        return rationCardGlobal.checkFlexiRationCardExists.call(loggedCustomer);
                    }).then(function(res){
                        $("#ration-message-3").show();
                        if (res) {
                            $("#ration-message-3").removeClass("alert-info").addClass("alert-success");
                            $("#ration-message-3").html("Flexi Scheme RationCard exists.");
                            $("#radio4-label").hide();
                            // populate flexi ration card details for this customer
                            window.customerApp.showFlexiRationCardDetails();
                        } else {
                            $("#ration-message-3").removeClass("alert-info").addClass("alert-danger");
                            $("#ration-message-3").html("Flexi Scheme RationCard does not exists.");
                            $('input:radio[name="radio_new"]').change(function() {
                                if ($('input:radio[id="radio4"]').is(':checked')) {
                                    console.log("flexi");
                                    $("#create-ration-card-div-flexi").show();
                                    $("#create-ration-card-btn-flexi").attr("data-customeraddr", customerData[0]);
                                    $("#create-ration-card-btn-flexi").attr("data-usertype", customerData[3]);
                                    $("#create-ration-card-btn-flexi").attr("data-customername", customerData[1]);
                                    $("#create-ration-card-btn-flexi").attr("data-customerplace", customerData[4]);
                                    $("#create-ration-card-div").hide();
                                }
                            });
                        }
                        $('#loadingOverlay').hide();
                        self.showHome();
                    }).catch(function(e){
                        console.log(e);
                    });
                    return;
                } else {
                    $("#ration-message").show();
                    $("#ration-message-1").removeClass("alert-info").addClass("alert-danger");
                    $("#ration-message-1").html("User not Approved by centralGovernment yet.");
                    $("#ration-message-2").hide();
                    $("#ration-message-3").hide();
                    $("#ration-main-div").hide();
                    $('#loadingOverlay').hide();
                    return;
                }
            }).catch(function(e){
                console.log(e);
                $("#ration-message").html("Approval error : " + e);
                return;
            })
        }
        return;
    },

    loadApprovedFps: function() {
        var self = this;
        $("#loading-content-text").html("Loading approved fps list ...");
        j = 2;
        prevAddr = "";
        loadApprovedFpsInterval = setInterval(self.loadAprovedFpsList, 200);
    },

    loadAprovedFpsList: function() {
        var self = this;
        Approval.deployed().then(function(instance){
            approvalGlobal = instance;
            return approvalGlobal.getUserApproval.call(accounts[j], 1);
        }).then(function(res){
            if (res[0] != "0x0000000000000000000000000000000000000000" && res[0] != prevAddr) {
                if (res[1]) {
                    User.deployed().then(function(instance){
                        userGlobal = instance;
                        return userGlobal.getUserDetails.call(res[0]);
                    }).then(function(userinfo){
                        approvedFpsDb.push(userinfo);
                    }).catch(function(e){
                        console.log(e);
                        return;
                    })
                }
            }
            j++;
            if (j == accounts.length) {
                j = 0;
                clearInterval(loadApprovedFpsInterval);
                console.log("Finished loading approved fps");
                console.log(approvedFpsDb);
                window.customerApp.loadCustomerRationCards();
            }
        }).catch(function(e){
            console.log(e);
            return;
        })
    },

    createFixedRationCard: function() {
        var self = this;
        var cn = document.getElementById("ration-customer-name");
        var c = document.getElementById("ration-customer-addr");
        var f = document.getElementById("select-approved-list-fps-fixed");
        var addrs = document.getElementById("ration-customer-street-address");
        var usert = document.getElementById("ration-customer-user-type");
        // var useri = [c.value, cn.value, addrs.value, usert.value, f.options[f.selectedIndex].text];
        var useri = [c.value, cn.value, addrs.value, usert.value, f.options[f.selectedIndex].value];
        console.log("**********");
        console.log(useri);
        console.log("**********");
        self.createRationCard1(useri);
    },

    createFlexiRationCard: function() {
        var self = this;
        var cn = document.getElementById("ration-customer-name-flexi");
        var c = document.getElementById("ration-customer-addr-flexi");
        var f = document.getElementById("select-approved-list-fps-flexi");
        var addrs = document.getElementById("ration-customer-street-address-flexi");
        var usert = document.getElementById("ration-customer-user-type-flexi");
        // var useri = [c.value, cn.value, addrs.value, usert.value, f.options[f.selectedIndex].text];
        var useri = [c.value, cn.value, addrs.value, usert.value, f.options[f.selectedIndex].value];
        console.log("**********");
        console.log(useri);
        console.log("**********");
        self.createRationCard2(useri);
    },

    createRationCard1: function(userinfo) {
        var self = this;
        console.log(userinfo[0] + " ? " + userinfo[4]);
        var password = document.getElementById("ration-customer-password");
        if (password.value == "") {
            return;
        }
        if (userDb[userinfo[0]] && userDb[userinfo[4]]) {
            User.deployed().then(function(instance){
                userGlobal = instance;
                return userGlobal.authenticateUserWithAddress.call(customerData[0], password.value);
            }).then(function(res){
                if (!res) {
                    alert("Authentication failure, password is incorrect");
                    password.value == "";
                    return;
                }
                RationCard.deployed().then(function(instance){
                    rationCardGlobal = instance;
                    return rationCardGlobal.addRationCard(userinfo[0], userinfo[1], userinfo[2], userinfo[3], userinfo[4], {from: centralGovernmentAddress, gas: 500000});
                }).then(function(res){
                    console.log(res);
                    alert("Fixed Scheme Ration card created for customer: " + userinfo[0]);
                    location.reload();
                }).catch(function(e){
                    console.log(e);
                    // notify3.setAttribute("class", "alert alert-danger col-md-12");
                    // notify3.innerHTML = "Something went wrong while creating ration card. Error:  " + e;
                    // notify3.style.display = "block";
                });
            }).catch(function(e){
                console.log(e);
            })
        } else {
            // notify3.setAttribute("class", "alert alert-danger col-md-12");
            // notify3.innerHTML = "Either customer or fps hasn't registered.";
            // notify3.style.display = "block";
            console.log("==== Something went wrong while creating ration card ====");
        }
    },

    createRationCard2: function(userinfo) {
        var self = this;
        console.log(userinfo[0] + " ? " + userinfo[4]);
        var password = document.getElementById("ration-customer-password-flexi");
        if (password.value == "") {
            return;
        }
        if (userDb[userinfo[0]] && userDb[userinfo[4]]) {
            User.deployed().then(function(instance){
                userGlobal = instance;
                return userGlobal.authenticateUserWithAddress.call(customerData[0], password.value);
            }).then(function(res){
                if (!res) {
                    alert("Authentication failure, password is incorrect");
                    password.value == "";
                    return;
                }
                RationCard.deployed().then(function(instance){
                    rationCardGlobal = instance;
                    return rationCardGlobal.addFlexiRationCard(userinfo[0], userinfo[1], userinfo[2], userinfo[3], userinfo[4], {from: centralGovernmentAddress, gas: 500000});
                }).then(function(res){
                    console.log(res);
                    alert("Flexi Scheme Ration card created for customer: " + userinfo[0]);
                    location.reload();
                }).catch(function(e){
                    console.log(e);
                    // notify3.setAttribute("class", "alert alert-danger col-md-12");
                    // notify3.innerHTML = "Something went wrong while creating ration card. Error:  " + e;
                    // notify3.style.display = "block";
                });
            }).catch(function(e){
                console.log(e);
            })
        } else {
            // notify3.setAttribute("class", "alert alert-danger col-md-12");
            // notify3.innerHTML = "Either customer or fps hasn't registered.";
            // notify3.style.display = "block";
            console.log("==== Something went wrong while creating ration card ====");
        }
    },

    showFixedRationCardDetails: function() {
        var self = this;

        $("#view-card-details-div").show();
        $("#fixed-ration-card-div").show();
        var fixedRationCustomerTable = document.getElementById("fixed-ration-customer-table");
        var fixedRationPointsCustomerTable = document.getElementById("fixed-ration-points-customer-table");
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
            return rationCardGlobal.getRationCardInfo.call(0, loggedCustomer);
        }).then(function(info){
            console.log(info);
            if (!info[0]) {
                // alert.setAttribute("class", "alert alert-danger col-md-10");
                // alert.innerHTML = "That ration card number is invalid";
                // alert.style.display = "block";
                // document.getElementById("card-details-div").style.display = "none";
                return;
            }
            // document.getElementById("fixed-card-number").innerHTML = info[1].valueOf();
            // document.getElementById("fixed-card-custname").innerHTML = info[2];
            // document.getElementById("fixed-card-street").innerHTML = info[3];
            // document.getElementById("fixed-card-fps").innerHTML = info[5];

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

            return rationCardGlobal.getRationCardPoints.call(0, loggedCustomer);
        }).then(function(points){
            console.log("fixed => " + points);
            if (points[0]) {
                var tr6 = document.createElement("tr");
                var tr7 = document.createElement("tr");
                var tr8 = document.createElement("tr");

                var td11 = document.createElement("td");
                var td12 = document.createElement("td");
                var td13 = document.createElement("td");
                var td14 = document.createElement("td");
                var td15 = document.createElement("td");
                var td16 = document.createElement("td");
                // $("#fixed-card-item1-points").html(points[1].valueOf());
                // $("#fixed-card-item2-points").html(points[2].valueOf());
                // $("#fixed-card-item3-points").html(points[3].valueOf());
                // $("#fixed-card-custaddr").html(points[4]);

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
            // alert.setAttribute("class", "alert alert-danger col-md-10");
            // alert.innerHTML = "Couldn't fetch ration card details. Error: " + e;
            // alert.style.display = "block";
        });
    },

    showFlexiRationCardDetails: function() {
        var self = this;

        $("#view-card-details-div").show();
        $("#flexi-ration-card-div").show();
        var flexiRationCustomerTable = document.getElementById("flexi-ration-customer-table");
        var flexiRationPointsCustomerTable = document.getElementById("flexi-ration-points-customer-table");
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
            return rationCardGlobal.getFlexiRationCardInfo.call(0, loggedCustomer);
        }).then(function(info){
            console.log(info);
            if (!info[0]) {
                // alert.setAttribute("class", "alert alert-danger col-md-10");
                // alert.innerHTML = "That ration card number is invalid";
                // alert.style.display = "block";
                // document.getElementById("card-details-div").style.display = "none";
                return;
            }
            // document.getElementById("flexi-card-number").innerHTML = info[1].valueOf();
            // document.getElementById("flexi-card-custname").innerHTML = info[2];
            // document.getElementById("flexi-card-street").innerHTML = info[3];
            // document.getElementById("flexi-card-fps").innerHTML = info[5];

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

            return rationCardGlobal.getFlexiRationCardPoints.call(0, loggedCustomer);
        }).then(function(points){
            console.log("flexi => " + points);
            if (points[0]) {
                var tr6 = document.createElement("tr");
                var td11 = document.createElement("td");
                var td12 = document.createElement("td");

                // $("#flexi-card-points").html(points[1].valueOf());
                // $("#flexi-card-custaddr").html(points[2]);

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

                return;
            }
        }).catch(function(e){
            console.log(e);
            // alert.setAttribute("class", "alert alert-danger col-md-10");
            // alert.innerHTML = "Couldn't fetch ration card details. Error: " + e;
            // alert.style.display = "block";
        });
    },

    showApprovedFPSList1: function() {
        var self = this;
        var selectApprovedFpsEle = document.getElementById('select-approved-list-fps-fixed');
        for (var i = selectApprovedFpsEle.options.length-1; i >= 0 ; i--) {
            selectApprovedFpsEle.remove(i);
        }
        for (var i = 0; i < approvedFpsDb.length; i++) {
            var opt = document.createElement("option");
            opt.value = approvedFpsDb[i][0];
            opt.innerHTML = approvedFpsDb[i][1] + ", " + approvedFpsDb[i][0] + ", " + approvedFpsDb[i][4];
            selectApprovedFpsEle.appendChild(opt);
        }
    },

    showApprovedFPSList2: function() {
        var self = this;
        var selectApprovedFpsEle = document.getElementById('select-approved-list-fps-flexi');
        for (var i = selectApprovedFpsEle.options.length-1; i >= 0 ; i--) {
            selectApprovedFpsEle.remove(i);
        }
        for (var i = 0; i < approvedFpsDb.length; i++) {
            var opt = document.createElement("option");
            opt.value = approvedFpsDb[i][0];
            opt.innerHTML = approvedFpsDb[i][1] + ", " + approvedFpsDb[i][0] + ", " + approvedFpsDb[i][4];
            selectApprovedFpsEle.appendChild(opt);
        }
    },

    showOverlay: function() {
        $("#loadingOverlay").show();
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
      console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
    customerApp.start();

    $(document).ready(function(){
        $('#myModal').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget) // Button that triggered the modal
            var custAddr = button.data('customeraddr') // Extract info from data-* attributes
            var usertype = button.data('usertype')
            var customername = button.data('customername')
            var customerplace = button.data('customerplace')
            // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
            // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
            var modal = $(this)
            // modal.find('.modal-title').text('Ration card for : ' + custAddr)
            // modal.find('.modal-body input').val(custAddr)
            $("#ration-customer-addr").val(custAddr)
            $('#ration-customer-user-type').val(usertype)
            $('#ration-customer-name').val(customername)
            $('#ration-customer-place').val(customerplace)
            var selectApprovedFpsEle = document.getElementById('select-approved-list-fps-fixed');
            for (var i = selectApprovedFpsEle.options.length-1; i >= 0 ; i--) {
                selectApprovedFpsEle.remove(i);
            }
            $('#ration-customer-street-address').val("");
            $('#fps-address-fixed').click(function(){
                window.customerApp.showApprovedFPSList1();
            })
        });
        // fix this
        $('#myModal-flexi').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget) // Button that triggered the modal
            var custAddr = button.data('customeraddr') // Extract info from data-* attributes
            var usertype = button.data('usertype')
            var customername = button.data('customername')
            var customerplace = button.data('customerplace')
            // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
            // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
            var modal = $(this)
            // modal.find('.modal-title').text('Ration card for : ' + custAddr)
            // modal.find('.modal-body input').val(custAddr)
            $("#ration-customer-addr-flexi").val(custAddr)
            $('#ration-customer-user-type-flexi').val(usertype)
            $('#ration-customer-name-flexi').val(customername)
            $('#ration-customer-place-flexi').val(customerplace)
            var selectApprovedFpsEle = document.getElementById('select-approved-list-fps-flexi');
            for (var i = selectApprovedFpsEle.options.length-1; i >= 0 ; i--) {
                selectApprovedFpsEle.remove(i);
            }
            $('#ration-customer-street-address-flexi').val("");
            $('#fps-address-flexi').click(function(){
                window.customerApp.showApprovedFPSList2();
            })
        });
    });
});
