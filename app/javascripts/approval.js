// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import user_artifacts from '../../build/contracts/User.json';
import approval_artifacts from '../../build/contracts/Approval.json';
import rationCard_artifacts from '../../build/contracts/RationCard.json';

// User is our usable abstraction, which we'll use through the code below.
var User = contract(user_artifacts);
// Approval is our usable abstraction, which we'll use through the code below.
var Approval = contract(approval_artifacts);
// RationCard is our usable abstraction, which we'll use through the code below.
var RationCard = contract(rationCard_artifacts);


// For application bootstrapping, check out window.addEventListener below.
var accounts, governmentAddress;
var userGlobal, approvalGlobal, rationCardGlobal;

// get all accounts and store whoever is registered
var userDb = {};

// TODO:
// similar like userDb, have approvalsCustDb and approvalsFpsDb // SET
var approvedFPSList = [];

var i, j, k, l, m;
var loadUserInterval, loadUnapproCustInterval, loadUnapproFpsInterval, loadApprovedCustInterval, loadApprovedFpsInterval;
var selectPlaceEle, selectApprovedFpsEle;
var unapprovedCustDiv, unapprovedFpsDiv, approvedCustDiv, approvedFpsDiv;
var fpsNum, customerNum;
var loadAcctsEle;
var prevAddr;

window.ApprovalApp = {
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
            governmentAddress = accounts[0];
            console.log("governmentAddress => " + governmentAddress);
            self.getElements();
            self.loadUsers();
        });
    },

    getElements: function() {
        var self = this;

        // loadAcctsEle = document.getElementById("load-accts");
        unapprovedCustDiv = document.getElementById("unapproved-list-customer")
        unapprovedFpsDiv = document.getElementById("unapproved-list-fps");

        approvedCustDiv = document.getElementById("approved-list-customer");
        approvedFpsDiv = document.getElementById("approved-list-fps")
        selectApprovedFpsEle = document.getElementById("select-approved-list-fps");
    },

    loadUsers: function() {
         var self = this;

        // loadAcctsEle.style.display = "block";
        i = 0;
        loadUserInterval = setInterval(self.checkUserRegistered, 120);
    },

    checkUserRegistered: function() {
        var self = this;
        userGlobal.checkUserRegistered.call(accounts[i]).then(function(res){
            console.log("i => " + i + " || " + accounts[i] + " => " + res);
            userDb[accounts[i]] = res;
            i++;
            if (i == 10) {
                i = 0;
                clearInterval(loadUserInterval);
                // loadAcctsEle.style.display = "none";
                console.log("Finished loading/checking user registrations");
                userDb[governmentAddress] = true;
                window.ApprovalApp.loadUnApprovedCustomersList();
            }
        }).catch(function(e){
            console.log(e);
            return;
        });
    },

    loadUnApprovedCustomersList: function() {
        var self = this;

        var customerNum;
        Approval.deployed().then(function(instance){
            approvalGlobal = instance;
            return approvalGlobal.getUnApprovedCustomers.call();
        }).then(function(num1){
            customerNum = num1;
            console.log("customerNum => " + customerNum);
            j = 0;
            // loop through 0 to customerNum
            loadUnapproCustInterval = setInterval(self.loadUnapproCust, 100);
        });
    },

    loadUnapproCust: function() {
        var self = this;

        Approval.deployed().then(function(instance){
            approvalGlobal = instance;
            return approvalGlobal.getUnapprovedUser.call(accounts[j], 2);
        }).then(function(addr){
            if (j < accounts.length-1) {
                document.getElementById("load-1").style.display = "none";
                console.log("j => " + j + " || " + "cust => " + addr.valueOf());
                if (addr.valueOf() != "0x0000000000000000000000000000000000000000") {
                    var a = document.createElement("a");
                    a.href = "#";
                    a.setAttribute("class", "list-group-item list-group-item-action");
                    var div = document.createElement("div");
                    var p = document.createElement("p");
                    p.innerHTML = addr.valueOf();
                    var b = document.createElement("button");
                    b.type = "button";
                    b.setAttribute("class", "btn btn-primary-outline btn-sm");
                    b.innerHTML = "Approve";
                    // Change this later
                    b.id = addr.valueOf();
                    b.onclick = function(e) {
                        console.log(e.target.id);
                        window.ApprovalApp.approveCustomer(e.target.id);
                    }
                    div.appendChild(p);
                    div.appendChild(b);
                    a.appendChild(div);
                    unapprovedCustDiv.appendChild(a);
                }
                j++;
            } else {
                j = 0;
                clearInterval(loadUnapproCustInterval);
                window.ApprovalApp.loadUnApprovedFpsList();
                return;
            }
        }).catch(function(e){
            console.log(e);
            return;
        });
    },

    loadUnApprovedFpsList: function() {
        var self = this;

        var fpsNum;
        Approval.deployed().then(function(instance){
            approvalGlobal = instance;
            return approvalGlobal.getUnApprovedFPS.call();
        }).then(function(num1){
            fpsNum = num1;
            console.log("fpsNum => " + fpsNum);
            k = 0;
            // loop through 0 to fpsNum
            loadUnapproFpsInterval = setInterval(self.loadUnapproFps, 100);
        });        
    },

    loadUnapproFps: function() {
        var self = this;

        Approval.deployed().then(function(instance){
            approvalGlobal = instance;
            return approvalGlobal.getUnapprovedUser.call(accounts[k], 1);
        }).then(function(addr){
            if (k < accounts.length-1) {
                document.getElementById("load-3").style.display = "none";                
                console.log("k => " + k + " || " + "fps => " + addr.valueOf());
                if (addr.valueOf() != "0x0000000000000000000000000000000000000000") {
                    var div = document.createElement("div");
                    div.setAttribute("class", "list-group-item list-group-item-action");
                    var p = document.createElement("p");
                    p.innerHTML = addr.valueOf();
                    var b = document.createElement("button");
                    b.innerHTML = "Approve";
                    b.type = "button";
                    b.setAttribute("class", "btn btn-primary-outline btn-sm");
                    // Change this later
                    b.id = addr.valueOf();
                    b.onclick = function(e) {
                        console.log(e.target.id);
                        window.ApprovalApp.approveFPS(e.target.id);
                    }
                    div.appendChild(p);
                    div.appendChild(b);
                    unapprovedFpsDiv.appendChild(div);
                }
                k++;
            } else {
                k = 0;
                clearInterval(loadUnapproFpsInterval);
                window.ApprovalApp.loadApprovedCustomersList();
                return;
            }
        }).catch(function(e){
            console.log(e);
            return;
        });
    },

    approveCustomer: function(addr) {
        var self = this;

        Approval.deployed().then(function(instance){
            approvalGlobal =  instance;
            return approvalGlobal.approveCustomer(addr, {from: governmentAddress, gas: 150000});
        }).then(function(res){
            console.log(res);
            alert("Customer approved");
            // location.reload();
        }).catch(function(e){
            console.log(e);
        });
    },

    approveFPS: function(addr) {
        var self = this;

        Approval.deployed().then(function(instance){
            approvalGlobal =  instance;
            return approvalGlobal.approveFPS(addr, {from: governmentAddress, gas: 150000});
        }).then(function(res){
            console.log(res);
            alert("FPS approved");
            // location.reload();
        }).catch(function(e){
            console.log(e);
        });
    },

    loadApprovedCustomersList: function() {
        var self = this;

        l = 0;
        prevAddr = "";
        loadApprovedCustInterval = setInterval(self.loadApprovedCust, 100);
    },

    loadApprovedCust: function() {
        var self = this;

        Approval.deployed().then(function(instance){
            approvalGlobal = instance;
            return approvalGlobal.getApprovedUser.call(accounts[l], 2);
        }).then(function(addr){
            if (l < accounts.length-1) {
                document.getElementById("load-2").style.display = "none";
                // console.log("l => " + l + " || " + "cust => " + addr.valueOf());
                if (addr.valueOf() != "0x0000000000000000000000000000000000000000" && addr.valueOf() != prevAddr) {
                    console.log("l => " + l + " || " + "cust => " + addr.valueOf());
                    prevAddr = addr.valueOf();
                    User.deployed().then(function(instance){
                        userGlobal = instance;
                        return userGlobal.getUserInfo(addr.valueOf(), "pass", {from: governmentAddress, gas: 150000});
                    }).then(function(userinfo){
                        var div = document.createElement("div");
                        div.setAttribute("class", "list-group-item list-group-item-action");                        
                        var p = document.createElement("p");
                        p.innerHTML = addr.valueOf();
                        var p1 = document.createElement("p");
                        console.log("userinfo || " + addr.valueOf() + " => " + userinfo);
                        var inf = "Username : " + userinfo[1] + "<br>" + "Email : " + userinfo[2] + "<br>" + "Usertype : " + userinfo[3] + "<br>" + "Area : " + userinfo[4];
                        p1.innerHTML = inf;
                        var b = document.createElement("button");
                        b.type = "button";
                        b.setAttribute("class", "btn btn-primary-outline btn-sm");
                        b.style.display = "block";
                        b.style.minWidth = "100%";
                        b.innerHTML = "Create Ration card";
                        // Change this later
                        b.id = addr.valueOf();
                        b.onclick = function(e) {
                            console.log(e.target.id);
                            // window.ApprovalApp.createRationCard(userinfo);
                        }
                        div.appendChild(p);
                        div.appendChild(p1);
                        div.appendChild(b);
                        approvedCustDiv.appendChild(div);
                    }).catch(function(e){
                        console.log(e);
                    });
                }
                l++;
            } else {
                l = 0;
                clearInterval(loadApprovedCustInterval);
                window.ApprovalApp.loadApprovedFpsList();
                return;
            }
        }).catch(function(e){
            console.log(e);
            return;
        });
    },

    loadApprovedFpsList: function() {
        var self = this;

        m = 0;
        prevAddr = "";
        loadApprovedFpsInterval = setInterval(self.loadApprovedFps, 100);
    },

    loadApprovedFps: function() {
        Approval.deployed().then(function(instance){
            approvalGlobal = instance;
            return approvalGlobal.getApprovedUser.call(accounts[m], 1);
        }).then(function(addr){
            document.getElementById("load-4").style.display = "none";
            if (m < accounts.length-1) {
                // console.log("m => " + m + " || " + "cust => " + addr.valueOf());
                if (addr.valueOf() != "0x0000000000000000000000000000000000000000" && addr.valueOf() != prevAddr) {
                    console.log("m => " + m + " || " + "cust => " + addr.valueOf());
                    prevAddr = addr.valueOf();
                    approvedFPSList.push(addr.valueOf());
                    User.deployed().then(function(instance){
                        userGlobal = instance;
                        return userGlobal.getUserInfo.call(addr.valueOf(), "pass", {from: governmentAddress, gas: 150000});
                    }).then(function(userinfo){
                        var div = document.createElement("div");
                        div.setAttribute("class", "list-group-item list-group-item-action");                        
                        var p = document.createElement("p");
                        p.innerHTML = addr.valueOf();
                        var p1 = document.createElement("p");
                        console.log("userinfo || " + addr.valueOf() + " => " + userinfo);
                        var inf = "Username : " + userinfo[1] + "<br>" + "Email : " + userinfo[2] + "<br>" + "Usertype : " + userinfo[3] + "<br>" + "Area : " + userinfo[4];
                        p1.innerHTML = inf;
                        div.appendChild(p);
                        div.appendChild(p1);
                        approvedFpsDiv.appendChild(div);
                    }).catch(function(e){
                        console.log(e);
                        return;
                    });
                    // var opt = document.createElement("option");
                    // opt.value = 1;
                    // opt.innerHTML = addr.valueOf();
                    // selectApprovedFpsEle.appendChild(opt);
                }
                m++;
            } else {
                m = 0;
                clearInterval(loadApprovedFpsInterval);
                console.log(approvedFPSList);
                window.ApprovalApp.showApprovedFPSList();
                return;
            }
        }).catch(function(e){
            console.log(e);
            return;
        });
    },

    showApprovedFPSList: function() {
        var self = this;
        for (var i = 0; i < approvedFPSList.length; i++) {
            var opt = document.createElement("option");
            opt.value = 1;
            opt.innerHTML = approvedFPSList[i];
            selectApprovedFpsEle.appendChild(opt);
        }
    },

    createRationCard: function() {
        var self = this;

        // this is not correct way to do,find someother to get this.
        if (selectApprovedFpsEle.options[selectApprovedFpsEle.selectedIndex].value == -1) {
            alert("Select valid fps to createRationCard");
            return;
        }
        var fps = selectApprovedFpsEle.options[selectApprovedFpsEle.selectedIndex].text;
        if (userDb[userinfo[0]] && userDb[fps]) {
            RationCard.deployed().then(function(instance){
                rationCardGlobal = instance;
                return rationCardGlobal.addRationCard(userinfo[0], userinfo[1], "this is street address", userinfo[3], fps, {from: governmentAddress, gas: 500000});
            }).then(function(res){
                console.log(res);
            }).catch(function(e){
                console.log(e);
            });
        }
        return;
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