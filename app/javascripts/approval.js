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
var userNames = {};
var usernameInterval;
// TODO:
// similar like userDb, have approvalsCustDb and approvalsFpsDb // SET
var approvedFPSList = [];

var i, j, k, l, m, n;
var loadUserInterval, loadUnapproCustInterval, loadUnapproFpsInterval, loadApprovedCustInterval, loadApprovedFpsInterval;
var selectPlaceEle, selectApprovedFpsEle;
var unapprovedCustDiv, unapprovedFpsDiv, approvedCustDiv, approvedFpsDiv;
var fpsNum, customerNum;
var loadAcctsEle;
var prevAddr;

var notify3;

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

        notify3 = document.getElementById("notification3");
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
                window.ApprovalApp.loadUserNames();
                // window.ApprovalApp.loadUnApprovedCustomersList();
            }
        }).catch(function(e){
            console.log(e);
            return;
        });
    },

    loadUserNames: function() {
        var self = this;

        n = 1;
        usernameInterval = setInterval(self.loadName, 800);
    },

    loadName: function() {
        var self = this;
        userGlobal.getUserInfo.call(accounts[n], "pass", {from: governmentAddress, gas: 150000}).then(function(res){
            console.log("n => " + n);
            console.log(res[0] + " : " + res[1]);
            if (res[1].length > 0) {
                userNames[res[0]] = res[1];
            }
            n++;
            if (n == 10) {
                n = 0;
                clearInterval(usernameInterval);
                console.log(userNames);
                // loadAcctsEle.style.display = "none";
                console.log("Finished userNames");
                window.ApprovalApp.loadUnApprovedCustomersList();
            }
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
            prevAddr = "";
            // loop through 0 to customerNum
            loadUnapproCustInterval = setInterval(self.loadUnapproCust, 150);
        });
    },

    loadUnapproCust: function() {
        var self = this;

        Approval.deployed().then(function(instance){
            approvalGlobal = instance;
            return approvalGlobal.getUnapprovedUser.call(accounts[j], 2);
        }).then(function(addr){
            if (j < accounts.length-1) {
                // document.getElementById("load-1").style.display = "none";
                console.log("j => " + j + " || " + "cust => " + addr.valueOf());
                if (addr.valueOf() != "0x0000000000000000000000000000000000000000" && addr.valueOf() != prevAddr) {
                    prevAddr = addr.valueOf();
                    var a = document.createElement("a");
                    a.setAttribute("class", "list-group-item list-group-item-action");
                    var div = document.createElement("div");
                    var p = document.createElement("p");
                    // p.innerHTML = addr.valueOf();
                    p.innerHTML = userNames[addr.valueOf()];
                    var b = document.createElement("button");
                    b.type = "button";
                    b.setAttribute("class", "btn btn-primary-outline btn-sm");
                    b.innerHTML = "Approve";
                    // Change this later
                    b.id = addr.valueOf();
                    b.onclick = function(e) {
                        console.log(e.target.id);
                        e.target.style.display = "none";
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
                document.getElementById("load-1").style.display = "none";
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
            prevAddr = "";
            // loop through 0 to fpsNum
            loadUnapproFpsInterval = setInterval(self.loadUnapproFps, 150);
        });        
    },

    loadUnapproFps: function() {
        var self = this;

        Approval.deployed().then(function(instance){
            approvalGlobal = instance;
            return approvalGlobal.getUnapprovedUser.call(accounts[k], 1);
        }).then(function(addr){
            if (k < accounts.length-1) {
                // document.getElementById("load-3").style.display = "none";                
                console.log("k => " + k + " || " + "fps => " + addr.valueOf());
                if (addr.valueOf() != "0x0000000000000000000000000000000000000000" && addr.valueOf() != prevAddr) {
                    prevAddr = addr.valueOf();
                    var a = document.createElement("a");
                    a.setAttribute("class", "list-group-item list-group-item-action");
                    var div = document.createElement("div");
                    var p = document.createElement("p");
                    // p.innerHTML = addr.valueOf();
                    p.innerHTML = userNames[addr.valueOf()]
                    var b = document.createElement("button");
                    b.innerHTML = "Approve";
                    b.type = "button";
                    b.setAttribute("class", "btn btn-primary-outline btn-sm");
                    // Change this later
                    b.id = addr.valueOf();
                    b.onclick = function(e) {
                        console.log(e.target.id);
                        e.target.style.display = "none";                        
                        window.ApprovalApp.approveFPS(e.target.id);
                    }
                    div.appendChild(p);
                    div.appendChild(b);
                    a.appendChild(div);
                    unapprovedFpsDiv.appendChild(a);
                }
                k++;
            } else {
                k = 0;
                clearInterval(loadUnapproFpsInterval);
                document.getElementById("load-3").style.display = "none";                
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
            notify3.setAttribute("class", "alert alert-success col-md-12");
            // notify3.innerHTML = "Customer Approved. Address: " + addr;
            notify3.innerHTML = "Customer - <strong>" + userNames[addr] + "</strong> Approved";
            notify3.style.display = "block";
            // alert("Customer approved");
            // location.reload();
        }).catch(function(e){
            console.log(e);
            notify3.setAttribute("class", "alert alert-danger col-md-12");
            notify3.innerHTML = "Somthing went wrong while approving customer. Error:  " + e;
            notify3.style.display = "block";
        });
    },

    approveFPS: function(addr) {
        var self = this;

        Approval.deployed().then(function(instance){
            approvalGlobal =  instance;
            return approvalGlobal.approveFPS(addr, {from: governmentAddress, gas: 150000});
        }).then(function(res){
            console.log(res);
            notify3.setAttribute("class", "alert alert-success col-md-12");
            // notify3.innerHTML = "FPS Approved. Address: " + addr;
            notify3.innerHTML = "FPS - <strong>" + userNames[addr] + "</strong> Approved";
            notify3.style.display = "block";
            // alert("FPS approved");
            // location.reload();
        }).catch(function(e){
            console.log(e);
            notify3.setAttribute("class", "alert alert-danger col-md-12");
            notify3.innerHTML = "Somthing went wrong while approving fps. Error:  " + e;
            notify3.style.display = "block";
        });
    },

    loadApprovedCustomersList: function() {
        var self = this;

        l = 0;
        prevAddr = "";
        loadApprovedCustInterval = setInterval(self.loadApprovedCust, 500);
    },

    loadApprovedCust: function() {
        var self = this;

        Approval.deployed().then(function(instance){
            approvalGlobal = instance;
            return approvalGlobal.getApprovedUser.call(accounts[l], 2);
        }).then(function(addr){
            if (l < accounts.length-1) {
                // document.getElementById("load-2").style.display = "none";
                // console.log("l => " + l + " || " + "cust => " + addr.valueOf());
                if (addr.valueOf() != "0x0000000000000000000000000000000000000000" && addr.valueOf() != prevAddr) {
                    console.log("l => " + l + " || " + "cust => " + addr.valueOf());
                    prevAddr = addr.valueOf();
                    // FIX IT
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
                        b.setAttribute("data-toggle", "modal");
                        b.setAttribute("data-target", "#myModal");
                        b.setAttribute("data-customeraddr", userinfo[0]);
                        b.setAttribute("data-usertype", userinfo[3]);
                        b.setAttribute("data-customername", userinfo[1]);
                        b.onclick = function(e) {
                            console.log(e.target.id);
                            window.ApprovalApp.showApprovedFPSList();
                            var cn = document.getElementById("ration-customer-name");
                            var c = document.getElementById("ration-customer-addr");
                            var f = document.getElementById("select-approved-list-fps");
                            var addrs = document.getElementById("ration-customer-street-address");
                            addrs.value = "";
                            var usert = document.getElementById("ration-customer-user-type");
                            var confirm = document.getElementById("ration-card-confirm-btn");
                            confirm.onclick = function() {
                                // var useri = [c.value, cn.value, addrs.value, usert.value, f.options[f.selectedIndex].text];
                                var useri = [c.value, cn.value, addrs.value, usert.value, f.options[f.selectedIndex].value];                                
                                console.log("**********");
                                // console.log(cn.value);
                                // console.log(c.value);
                                // console.log(f.options[f.selectedIndex].text);
                                // console.log(addrs.value);
                                // console.log(usert.value);
                                console.log(useri);
                                console.log("**********");
                                window.ApprovalApp.createRationCard(useri);
                            }
                        }
                        div.appendChild(p);
                        div.appendChild(p1);
                        RationCard.deployed().then(function(instance){
                            rationCardGlobal = instance;
                            return rationCardGlobal.checkRationCardExists.call(userinfo[0], {from: governmentAddress, gas: 50000});
                        }).then(function(exists){
                            console.log("RationCard " + userinfo[0] + " => " + exists.valueOf() + " : " + typeof exists);
                            if (exists) {
                                var b2 = document.createElement("button");
                                b2.type = "button";
                                b2.setAttribute("class", "btn btn-success btn-sm");
                                b2.style.display = "block";
                                b2.style.minWidth = "100%";
                                b2.innerHTML = "Ration card Exists";
                                div.appendChild(b2);
                            } else {
                                div.appendChild(b);
                            }
                            approvedCustDiv.appendChild(div);
                        }).catch(function(e){
                            console.log(e);
                        });
                    }).catch(function(e){
                        console.log(e);
                    });
                }
                l++;
            } else {
                l = 0;
                clearInterval(loadApprovedCustInterval);
                document.getElementById("load-2").style.display = "none";
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
        loadApprovedFpsInterval = setInterval(self.loadApprovedFps, 500);
    },

    loadApprovedFps: function() {
        Approval.deployed().then(function(instance){
            approvalGlobal = instance;
            return approvalGlobal.getApprovedUser.call(accounts[m], 1);
        }).then(function(addr){
            // document.getElementById("load-4").style.display = "none";
            if (m < accounts.length-1) {
                // console.log("m => " + m + " || " + "cust => " + addr.valueOf());
                if (addr.valueOf() != "0x0000000000000000000000000000000000000000" && addr.valueOf() != prevAddr) {
                    console.log("m => " + m + " || " + "fps => " + addr.valueOf());
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
                }
                m++;
            } else {
                m = 0;
                clearInterval(loadApprovedFpsInterval);
                document.getElementById("load-4").style.display = "none";
                console.log(approvedFPSList);
                // window.ApprovalApp.showApprovedFPSList();
                return;
            }
        }).catch(function(e){
            console.log(e);
            return;
        });
    },

    showApprovedFPSList: function() {
        var self = this;
        for (var i = selectApprovedFpsEle.options.length-1; i >= 0 ; i--) {
            selectApprovedFpsEle.remove(i);
        }
        for (var i = 0; i < approvedFPSList.length; i++) {
            var opt = document.createElement("option");
            // opt.value = 1;
            // opt.innerHTML = approvedFPSList[i];
            opt.value = approvedFPSList[i];
            opt.innerHTML = userNames[approvedFPSList[i]];
            selectApprovedFpsEle.appendChild(opt);
        }
    },

    createRationCard: function(userinfo) {
        var self = this;

        console.log(userinfo[0] + " ? " + userinfo[4]);
        if (userDb[userinfo[0]] && userDb[userinfo[4]]) {
            RationCard.deployed().then(function(instance){
                rationCardGlobal = instance;
                return rationCardGlobal.addRationCard(userinfo[0], userinfo[1], userinfo[2], userinfo[3], userinfo[4], {from: governmentAddress, gas: 500000});
            }).then(function(res){
                console.log(res);
                alert("Ration card created for customer: " + userinfo[0]);
                location.reload();
            }).catch(function(e){
                console.log(e);
                notify3.setAttribute("class", "alert alert-danger col-md-12");
                notify3.innerHTML = "Something went wrong while creating ration card. Error:  " + e;
                notify3.style.display = "block";
            });
            return;
        } else {
            notify3.setAttribute("class", "alert alert-danger col-md-12");
            notify3.innerHTML = "Either customer or fps hasn't registered.";
            notify3.style.display = "block";
            // console.log("==== Something went wrong while creating ration card ====");
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

  ApprovalApp.start();

  $(document).ready(function(){
      $('#myModal').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget) // Button that triggered the modal
            var custAddr = button.data('customeraddr') // Extract info from data-* attributes
            var usertype = button.data('usertype')
            var customername = button.data('customername');
            // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
            // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
            var modal = $(this)
            // modal.find('.modal-title').text('Ration card for : ' + custAddr)
            modal.find('.modal-body input').val(custAddr)
            $('#ration-customer-user-type').val(usertype)
            $('#ration-customer-name').val(customername)
        })
  });
});