import "../../stylesheets/app.css";
import "../../stylesheets/sidebar.css"
import "../../stylesheets/central-government.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';

// Import our contract artifacts and turn them into usable abstractions.
import user_artifacts from '../../../build/contracts/User.json';
import approval_artifacts from '../../../build/contracts/Approval.json';

// User is our usable abstraction, which we'll use through the code below.
var User = contract(user_artifacts);
// Approval is our usable abstraction, which we'll use through the code below.
var Approval = contract(approval_artifacts);

// For application bootstrapping, check out window.addEventListener below.
var accounts, centralGovernmentAddress;
var userGlobal, approvalGlobal;

// get all accounts and store whoever is registered
var userDb = {};
// TODO:
// similar like userDb, have approvalsCustDb and approvalsFpsDb // SET
var approvedFPSList = [];

var i, j, k, l, m, n;
var loadUserInterval, loadUnapproandApproCustInterval, loadUnapproandApproFpsInterval;
var unapprovedCustDiv, unapprovedFpsDiv, approvedCustDiv, approvedFpsDiv;
var fpsNum, customerNum;
var prevAddr;

var loggedIn = false;

window.ApprovalApp = {
    start: function() {
        var self = this;
        User.setProvider(web3.currentProvider);
        User.deployed().then(function(instance) {
            userGlobal = instance;
            console.log(userGlobal);
        });
        Approval.setProvider(web3.currentProvider);
        Approval.deployed().then(function(instance) {
            approvalGlobal = instance;
            console.log(approvalGlobal);
        });

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
                        document.getElementById('profile-name').innerHTML = userinfo[1];
                        self.getListElements();
                        loggedIn = true;
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
        $("#loading-main").hide();
        $("#loadingOverlay").hide();
    },

    getListElements: function() {
        var self = this;
        $("#loading-content-text").html("Loading DOM elements ...");
        $("#not-logged-div-card").hide();
        unapprovedCustDiv = document.getElementById("unapproved-list-customer")
        unapprovedFpsDiv = document.getElementById("unapproved-list-fps");

        approvedCustDiv = document.getElementById("approved-list-customer");
        approvedFpsDiv = document.getElementById("approved-list-fps")

        self.loadUsers();
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
        userGlobal.checkUserRegistered.call(accounts[i]).then(function(res) {
            console.log("i => " + i + " || " + accounts[i] + " => " + res);
            userDb[accounts[i]] = res;
            i++;
            if (i == accounts.length) {
                i = 0;
                clearInterval(loadUserInterval);
                // loadAcctsEle.style.display = "none";
                console.log("Finished loading/checking user registrations");
                userDb[centralGovernmentAddress] = true;
                // window.ApprovalApp.loadUserNames();
                window.ApprovalApp.loadUnApprovedandApprovedCustomersList();
                // return;
            }
        }).catch(function(e) {
            console.log(e);
            return;
        });
    },

    loadUnApprovedandApprovedCustomersList: function() {
        var self = this;
        $("#loading-content-text").html("Loading UnApproved and Approved customers ...");

        Approval.deployed().then(function(instance) {
            approvalGlobal = instance;
            return approvalGlobal.numberOfNotApprovedCustomers.call();
        }).then(function(num1) {
            customerNum = num1;
            console.log("customerNum => " + customerNum);
            j = 2;
            prevAddr = "";
            // loop through 0 to customerNum
            $("#loading-message").html("Loading unapproved and approved customers ...");
            loadUnapproandApproCustInterval = setInterval(self.loadUnapproandApproCust, 300);
        });
    },

    loadUnapproandApproCust: function() {
        var self = this;

        var approvedCustTable = document.getElementById('approved-list-customer-table');
        var unaaprovedCustTable = document.getElementById('unapproved-list-customer-table');
        if (j < accounts.length) {
            Approval.deployed().then(function(instance) {
                approvalGlobal = instance;
                return approvalGlobal.getUserApproval.call(accounts[j], 2);
            }).then(function(addr) {
                    // document.getElementById("load-1").style.display = "none";
                    console.log("j => " + j + " || " + "cust => " + addr.valueOf());
                    if (addr[0] != "0x0000000000000000000000000000000000000000" && addr[0] != prevAddr) {
                        User.deployed().then(function(instance) {
                            userGlobal = instance;
                            return userGlobal.getUserDetails(addr[0], {from: centralGovernmentAddress, gas: 150000});
                        }).then(function(userinfo){
                            if (!addr[1]) {
                                prevAddr = addr.valueOf();
                                var tr = document.createElement("tr");
                                var td1 = document.createElement("td");
                                var td2 = document.createElement("td");
                                var td3 = document.createElement("td");
                                var td4 = document.createElement("td");
                                var td5 = document.createElement("td");
                                td1.appendChild(document.createTextNode(userinfo[0]));
                                td2.appendChild(document.createTextNode(userinfo[1]));
                                td3.appendChild(document.createTextNode(userinfo[2]));
                                td4.appendChild(document.createTextNode(userinfo[4]));
                                var b = document.createElement("input");
                                b.type = "button";
                                b.setAttribute("class", "btn btn-primary-outline btn-sm");
                                b.value = "Approve";
                                b.id = userinfo[0];
                                b.setAttribute("data-toggle", "modal");
                                b.setAttribute("data-target", "#myModal");
                                b.onclick = function(e) {
                                    console.log("btn => " + e.target.id);
                                    $("#confirm-approve-btn").click(function(event){
                                        console.log("confirm customer=> " + (event.target.id == "confirm-approve-btn"));
                                        window.ApprovalApp.approveCustomer(e.target);
                                        $("#confirm-approve-btn").off();
                                    });
                                    // var result = confirm("Are you sure you want to approve this customer?");
                                    // if (result) {
                                    //     window.ApprovalApp.approveCustomer(e.target);
                                    // }
                                }
                                td5.appendChild(b);
                                tr.appendChild(td1);
                                tr.appendChild(td2);
                                tr.appendChild(td3);
                                tr.appendChild(td4);
                                tr.appendChild(td5);
                                unaaprovedCustTable.appendChild(tr);
                            } else {
                                var tr = document.createElement("tr");
                                var td1 = document.createElement("td");
                                var td2 = document.createElement("td");
                                var td3 = document.createElement("td");
                                var td4 = document.createElement("td");
                                td1.appendChild(document.createTextNode(userinfo[0]));
                                td2.appendChild(document.createTextNode(userinfo[1]));
                                td3.appendChild(document.createTextNode(userinfo[2]));
                                td4.appendChild(document.createTextNode(userinfo[4]));
                                tr.appendChild(td1);
                                tr.appendChild(td2);
                                tr.appendChild(td3);
                                tr.appendChild(td4);
                                approvedCustTable.appendChild(tr);
                            }
                        }).catch(function(e){
                            console.log(e);
                        });
                    }
                    j++;
            }).catch(function(e) {
                console.log(e);
                return;
            });
        } else {
            j = 0;
            clearInterval(loadUnapproandApproCustInterval);
            document.getElementById("load-1").style.display = "none";
            document.getElementById("load-2").style.display = "none";
            window.ApprovalApp.loadUnapprovedAndApprovedFpsList();
            return;
        }
    },

    loadUnapprovedAndApprovedFpsList: function() {
        var self = this;
        $("#loading-content-text").html("Loading UnApproved and Approved Fps ...");

        var fpsNum;
        Approval.deployed().then(function(instance) {
            approvalGlobal = instance;
            return approvalGlobal.numberOfNotApprovedFPS.call();
        }).then(function(num1) {
            fpsNum = num1;
            console.log("fpsNum => " + fpsNum);
            k = 2;
            prevAddr = "";
            // loop through 0 to fpsNum
            $("#loading-message").html("Loading unapproved and approved FPS ...");
            loadUnapproandApproFpsInterval = setInterval(self.loadUnapproandApprofps, 300);
        });
    },

    loadUnapproandApprofps: function() {
        var self = this;

        var approvedFpsTable = document.getElementById('approved-list-fps-table');
        var unaaprovedFpsTable = document.getElementById('unapproved-list-fps-table')
        if (k < accounts.length) {
            Approval.deployed().then(function(instance) {
                approvalGlobal = instance;
                return approvalGlobal.getUserApproval.call(accounts[k], 1);
            }).then(function(addr) {
                    // document.getElementById("load-3").style.display = "none";
                    console.log("k => " + k + " || " + "fps => " + addr.valueOf());
                    if (addr[0] != "0x0000000000000000000000000000000000000000" && addr[0] != prevAddr) {
                        User.deployed().then(function(instance) {
                            userGlobal = instance;
                            return userGlobal.getUserDetails(addr[0], {from: centralGovernmentAddress, gas: 150000});
                        }).then(function(userinfo){
                            if (!addr[1]) {
                                prevAddr = addr[0];
                                var tr = document.createElement("tr");
                                var td1 = document.createElement("td");
                                var td2 = document.createElement("td");
                                var td3 = document.createElement("td");
                                var td4 = document.createElement("td");
                                var td5 = document.createElement("td");
                                td1.appendChild(document.createTextNode(userinfo[0]));
                                td2.appendChild(document.createTextNode(userinfo[1]));
                                td3.appendChild(document.createTextNode(userinfo[2]));
                                td4.appendChild(document.createTextNode(userinfo[4]));
                                var b = document.createElement("input");
                                b.type = "button";
                                b.setAttribute("class", "btn btn-primary-outline btn-sm");
                                b.value = "Approve";
                                b.id = userinfo[0];
                                b.setAttribute("data-toggle", "modal");
                                b.setAttribute("data-target", "#myModal");
                                b.onclick = function(e) {
                                    console.log("btn => " + e.target.id);
                                    $("#confirm-approve-btn").click(function(event){
                                        console.log("confirm fps => " + (event.target.id == "confirm-approve-btn"));
                                        window.ApprovalApp.approveFPS(e.target);
                                        $("#confirm-approve-btn").off();
                                    });
                                    // var result = confirm("Are you sure you want to approve this fps?");
                                    // if (result) {
                                    //     window.ApprovalApp.approveFPS(e.target);
                                    // }
                                }
                                td5.appendChild(b);
                                tr.appendChild(td1);
                                tr.appendChild(td2);
                                tr.appendChild(td3);
                                tr.appendChild(td4);
                                tr.appendChild(td5);
                                unaaprovedFpsTable.appendChild(tr);
                            } else {
                                var tr = document.createElement("tr");
                                var td1 = document.createElement("td");
                                var td2 = document.createElement("td");
                                var td3 = document.createElement("td");
                                var td4 = document.createElement("td");
                                td1.appendChild(document.createTextNode(userinfo[0]));
                                td2.appendChild(document.createTextNode(userinfo[1]));
                                td3.appendChild(document.createTextNode(userinfo[2]));
                                td4.appendChild(document.createTextNode(userinfo[4]));
                                tr.appendChild(td1);
                                tr.appendChild(td2);
                                tr.appendChild(td3);
                                tr.appendChild(td4);
                                approvedFpsTable.appendChild(tr);
                            }
                        }).catch(function(e){
                            console.log(e);
                        })
                    }
                    k++;
            }).catch(function(e) {
                console.log(e);
                return;
            });
        }
        else {
           k = 0;
           clearInterval(loadUnapproandApproFpsInterval);
           document.getElementById("load-3").style.display = "none";
           document.getElementById("load-4").style.display = "none";
           $("#loadingOverlay").hide();
           $("#loading-main").hide();
           return;
       }
    },

    approveCustomer: function(addr) {
        var self = this;

        Approval.deployed().then(function(instance) {
            approvalGlobal =  instance;
            return approvalGlobal.approveCustomer(addr.id, {from: centralGovernmentAddress, gas: 150000});
        }).then(function(res) {
            console.log(res);
            // notify3.setAttribute("class", "alert alert-success col-md-12");
            // notify3.innerHTML = "Customer Approved. Address: " + addr;
            // notify3.innerHTML = "Customer - <strong>" + userNames[addr] + "</strong> Approved";
            // notify3.style.display = "block";
            alert("Customer approved");
            addr.style.display = "none";
            // location.reload();
        }).catch(function(e) {
            console.log(e);
            alert("Customer not approved");
            // notify3.setAttribute("class", "alert alert-danger col-md-12");
            // notify3.innerHTML = "Somthing went wrong while approving customer. Error:  " + e;
            // notify3.style.display = "block";
        });
    },

    approveFPS: function(addr) {
        var self = this;

        Approval.deployed().then(function(instance) {
            approvalGlobal =  instance;
            return approvalGlobal.approveFPS(addr.id, {from: centralGovernmentAddress, gas: 150000});
        }).then(function(res) {
            console.log(res);
            // notify3.setAttribute("class", "alert alert-success col-md-12");
            // notify3.innerHTML = "FPS Approved. Address: " + addr;
            // notify3.innerHTML = "FPS - <strong>" + userNames[addr] + "</strong> Approved";
            // notify3.style.display = "block";
            alert("FPS approved");
            addr.style.display = "none";
            // location.reload();
        }).catch(function(e) {
            console.log(e);
            alert("FPS not approved");
            // notify3.setAttribute("class", "alert alert-danger col-md-12");
            // notify3.innerHTML = "Somthing went wrong while approving fps. Error:  " + e;
            // notify3.style.display = "block";
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

    showApprovedCustomersDiv: function () {
        if (loggedIn) {
            unapprovedCustDiv.style.display = "none";
            unapprovedFpsDiv.style.display = "none";

            approvedCustDiv.style.display = "block";
            approvedFpsDiv.style.display = "none";
            $("#approval-home-div").hide();
        }
    },

    showApprovedFpsDiv: function() {
        if (loggedIn) {
            unapprovedCustDiv.style.display = "none";
            unapprovedFpsDiv.style.display = "none";

            approvedCustDiv.style.display = "none";
            approvedFpsDiv.style.display = "block";
            $("#approval-home-div").hide();
        }
    },

    showUnapprovedCustomersDiv: function() {
        if (loggedIn) {
            unapprovedCustDiv.style.display = "block";
            unapprovedFpsDiv.style.display = "none";

            approvedCustDiv.style.display = "none";
            approvedFpsDiv.style.display = "none";
            $("#approval-home-div").hide();
        }
    },

    showUnapprovedFpsDiv: function() {
        if (loggedIn) {
            unapprovedCustDiv.style.display = "none";
            unapprovedFpsDiv.style.display = "block";

            approvedCustDiv.style.display = "none";
            approvedFpsDiv.style.display = "none";
            $("#approval-home-div").hide();
        }
    },

    showHome: function() {
        $("#approval-home-div").show();
        unapprovedCustDiv.style.display = "none";
        unapprovedFpsDiv.style.display = "none";

        approvedCustDiv.style.display = "none";
        approvedFpsDiv.style.display = "none";
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
    ApprovalApp.start();
});
