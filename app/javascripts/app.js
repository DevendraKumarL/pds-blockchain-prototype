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

var governDiv, custDiv, fpsDiv;
var i, j, k, l, m;
var loadUserInterval, loadUnapproCustInterval, loadUnapproFpsInterval, loadApprovedCustInterval, loadApprovedFpsInterval;
var selectPlaceEle, loadAcctsEle, selectApprovedFpsEle;
var unapprovedCustDiv, unapprovedFpsDiv, approvedCustDiv;
var fpsNum, customerNum;

window.App = {
  start: function() {
    var self = this;
    User.setProvider(web3.currentProvider);
    User.deployed().then(function(instance){
      userGlobal = instance;
    });

    Approval.setProvider(web3.currentProvider);
    Approval.deployed().then(function(instance){
      approvalGlobal = instance;
    });

    RationCard.setProvider(web3.currentProvider);
    RationCard.deployed().then(function(instance){
      rationCardGlobal = instance;
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

    selectPlaceEle = document.getElementById("place-list");
    self.loadPlaces();

    governDiv = document.getElementById("government-register");
    custDiv = document.getElementById("customer-register");
    fpsDiv = document.getElementById("fps-register");
    self.hideDivs();

    // loadAcctsEle = document.getElementById("load-accts");
    // unapprovedCustDiv = document.getElementById("unapproved-list-customer")
    // unapprovedFpsDiv = document.getElementById("unapproved-list-fps");

    // approvedCustDiv = document.getElementById("approved-list-customer");
    // selectApprovedFpsEle = document.getElementById("approved-list-fps")
  },

  loadPlaces: function() {
    var self = this;

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
    loadUserInterval = setInterval(self.checkUserRegistered, 100);
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
        // window.App.loadUnApprovedCustomersList();
      }
    }).catch(function(e){
      console.log(e);
      return;
    });
  },

  registerGovernment: function() {
    var self = this;

    var name = document.getElementById("g-name");
    var email = document.getElementById("g-email");
    var pass = document.getElementById("g-password");
    console.log(name.value + " : " + email.value + " : " + pass.value);
    var uplace = selectPlaceEle.options[selectPlaceEle.selectedIndex].value;
    if (uplace == -1) {
      alert("Select a valid place");
      return;
    }

    userGlobal.addUser(governmentAddress, name.value, email.value, 0, pass.value, uplace, {from: governmentAddress, gas: 200000}).then(function(res){
      console.log(res);
      userDb[governmentAddress] = true;
      name.value = "";
      email.value = "";
      pass.value = "";
      alert("Government registered succesfully");
      self.hideDivs();
    }).catch(function(e){
      console.log(e);
      return;
    });
  },

  registerCustomer: function() {
    var self = this;
    // TODO:
    var name = document.getElementById("c-name");
    var email = document.getElementById("c-email");
    var pass = document.getElementById("c-password");
    console.log(name.value + " : " + email.value + " : " + pass.value);
    var uplace = selectPlaceEle.options[selectPlaceEle.selectedIndex].value;
    if (uplace == -1) {
      alert("Select a valid place");
      return;
    }

    var userAddr = self.getNewAddress();

    // userGlobal.addUser(userAddr, name.value, email.value, 2, pass.value, uplace, {from: governmentAddress, gas: 250000}).then(function(res){
    //   console.log(res);
    //   userDb[userAddr] = true;
    // }).catch(function(e){
    //   console.log(e);
    // });

    userGlobal.addUser(userAddr, name.value, email.value, 2, pass.value, uplace, {from: governmentAddress, gas: 250000}).then(function(res){
      console.log(res);
      userDb[userAddr] = true;
      name.value = "";
      email.value = "";
      pass.value = "";
      alert("Customer registered succesfully");
      self.hideDivs();
      return Approval.deployed();
    }).then(function(instance){
      approvalGlobal = instance;
      return approvalGlobal.addToNotApprovedList(userAddr, 2, {from: governmentAddress, gas: 250000});
    }).then(function(res){
      console.log(res);
    }).catch(function(e){
      console.log(e);
      return;
    });
  },

  registerFPS: function() {
    var self = this;
    var userAddr = self.getNewAddress();
    // TODO:
    var name = document.getElementById("f-name");
    var email = document.getElementById("f-email");
    var pass = document.getElementById("f-password");
    console.log(name.value + " : " + email.value + " : " + pass.value);
    var uplace = selectPlaceEle.options[selectPlaceEle.selectedIndex].value;
    if (uplace == -1) {
      alert("Select a valid place");
      return;
    }


    // userGlobal.addUser(userAddr, name.value, email.value, 1, pass.value, uplace, {from: governmentAddress, gas: 200000}).then(function(res){
    //   console.log(res);
    //   userDb[userAddr] = true;
    // }).catch(function(e){
    //   console.log(e);
    // });

    userGlobal.addUser(userAddr, name.value, email.value, 1, pass.value, uplace, {from: governmentAddress, gas: 250000}).then(function(res){
      console.log(res);
      userDb[userAddr] = true;
      name.value = "";
      email.value = "";
      pass.value = "";
      alert("FPS registered succesfully");
      self.hideDivs();
      return Approval.deployed();
    }).then(function(instance){
      approvalGlobal = instance;
      return approvalGlobal.addToNotApprovedList(userAddr, 1, {from: governmentAddress, gas: 250000});
    }).then(function(res){
      console.log(res);
    }).catch(function(e){
      console.log(e);
      return;
    });
  },

  // FIX IT
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
      unapprovedCustDiv.innerHTML = "";
      loadUnapproCustInterval = setInterval(self.loadUnapproCust, 100);
    });
  },

  // FIX IT
  loadUnapproCust: function() {
    var self = this;

    Approval.deployed().then(function(instance){
      approvalGlobal = instance;
      return approvalGlobal.getUnapprovedUser.call(accounts[j], 2);
    }).then(function(addr){
      if (j < accounts.length-1) {
        console.log("j => " + j + " || " + "cust => " + addr.valueOf());
        if (addr.valueOf() != "0x0000000000000000000000000000000000000000") {
          var div = document.createElement("div");
          var p = document.createElement("p");
          p.innerHTML = addr.valueOf();
          var b = document.createElement("button");
          b.innerHTML = "Approve";
          // Change this later
          b.id = addr.valueOf();
          b.onclick = function(e) {
            // console.log(e.target.id);
            window.App.approveCustomer(e.target.id);
          }
          div.appendChild(p);
          div.appendChild(b);
          unapprovedCustDiv.appendChild(div);
        }
        j++;
      } else {
        j = 0;
        clearInterval(loadUnapproCustInterval);
        window.App.loadUnApprovedFpsList();
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

    }).catch(function(e){
      console.log(e);
    });
  },

  // FIX IT
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
      unapprovedFpsDiv.innerHTML = "";
      loadUnapproFpsInterval = setInterval(self.loadUnapproFps, 100);
    });
  },

  // FIX IT
  loadUnapproFps: function() {
    var self = this;

    Approval.deployed().then(function(instance){
      approvalGlobal = instance;
      return approvalGlobal.getUnapprovedUser.call(accounts[k], 1);
    }).then(function(addr){
      if (k < accounts.length-1) {
        console.log("k => " + k + " || " + "fps => " + addr.valueOf());
        if (addr.valueOf() != "0x0000000000000000000000000000000000000000") {
          var div = document.createElement("div");
          var p = document.createElement("p");
          p.innerHTML = addr.valueOf();
          var b = document.createElement("button");
          b.innerHTML = "Approve";
          // Change this later
          b.id = addr.valueOf();
          b.onclick = function(e) {
            // console.log(e.target.id);
            window.App.approveFPS(e.target.id);
          }
          div.appendChild(p);
          div.appendChild(b);
          unapprovedFpsDiv.appendChild(div);
        }
        k++;
      } else {
        k = 0;
        clearInterval(loadUnapproFpsInterval);
        window.App.loadApprovedCustomersList();
        return;
      }
    }).catch(function(e){
      console.log(e);
      return;
    });
  },

  loadApprovedCustomersList: function() {
    var self = this;

    l = 0;
    // approvedCustDiv.innerHTML = "";
    loadApprovedCustInterval = setInterval(self.loadApprovedCust, 100);
  },

  loadApprovedCust: function() {
    var self = this;

    Approval.deployed().then(function(instance){
      approvalGlobal = instance;
      return approvalGlobal.getApprovedUser.call(accounts[l], 2);
    }).then(function(addr){
      if (l < accounts.length-1) {
        console.log("l => " + l + " || " + "cust => " + addr.valueOf());
        if (addr.valueOf() != "0x0000000000000000000000000000000000000000") {
          User.deployed().then(function(instance){
            userGlobal = instance;
            return userGlobal.getUserInfo(addr.valueOf(), "pass", {from: governmentAddress, gas: 150000});
          }).then(function(userinfo){
            var div = document.createElement("div");
            var p = document.createElement("p");
            p.innerHTML = addr.valueOf();
            var p1 = document.createElement("p");
            console.log("userinfo || " + addr.valueOf() + " => " + userinfo);
            p1.innerHTML = userinfo[1] + " - " + userinfo[2] + " - " + userinfo[3] + " - " + userinfo[4];
            var b = document.createElement("button");
            b.innerHTML = "Create Ration card";
            // Change this later
            b.id = addr.valueOf();
            b.onclick = function(e) {
              // console.log(e.target.id);
              window.App.createRationCard(userinfo);
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
        window.App.loadApprovedFpsList();
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
    // approvedFpsDiv.innerHTML = "";
    loadApprovedFpsInterval = setInterval(self.loadApprovedFps, 100);
  },

  loadApprovedFps: function() {
    Approval.deployed().then(function(instance){
      approvalGlobal = instance;
      return approvalGlobal.getApprovedUser.call(accounts[m], 1);
    }).then(function(addr){
      if (m < accounts.length-1) {
        console.log("m => " + m + " || " + "cust => " + addr.valueOf());
        if (addr.valueOf() != "0x0000000000000000000000000000000000000000") {
          var opt = document.createElement("option");
          opt.value = 1;
          opt.innerHTML = addr.valueOf();
          selectApprovedFpsEle.appendChild(opt);
        }
        m++;
      } else {
        m = 0;
        clearInterval(loadApprovedFpsInterval);
        return;
      }
    }).catch(function(e){
      console.log(e);
      return;
    });
  },

  createRationCard: function(userinfo) {
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

  getNewAddress: function() {
    var self = this;
    for (var key in userDb) {
      if (userDb.hasOwnProperty(key)){
        if (! userDb[key])
          return key;
      }
    }
  },

  showGovernment: function() {
    var self = this;
    governDiv.style.display = "block";
    custDiv.style.display = "none";
    fpsDiv.style.display = "none";
  },

  showCustomer: function() {
    var self = this;
    custDiv.style.display = "block";
    fpsDiv.style.display = "none";
    governDiv.style.display = "none";
  },

  showFPS: function() {
    var self = this;
    fpsDiv.style.display = "block";
    governDiv.style.display = "none";
    custDiv.style.display = "none";
  },

  hideDivs: function() {
    var self = this;
    governDiv.style.display = "none";
    fpsDiv.style.display = "none";
    custDiv.style.display = "none";
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

  App.start();
});
