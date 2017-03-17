// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import user_artifacts from '../../build/contracts/User.json';
import approval_artifacts from '../../build/contracts/Approval.json';

// User is our usable abstraction, which we'll use through the code below.
var User = contract(user_artifacts);
// Approval is our usable abstraction, which we'll use through the code below.
var Approval = contract(approval_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var governmentAddress;
var userGlobal;
var approvalGlobal;
// get all accounts and store whoever is registered

var userDb = {};

// hide divs
var g, c, f;
var i, j, k;
var loadUserInter;
var selectPlaceEle, wait;
var unapprovedCustEle, unapprovedFpsEle;

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
      self.loadUsers();
    });

    g = document.getElementById("government-register");
    c = document.getElementById("customer-register");
    f = document.getElementById("fps-register");
    g.style.display = "none";
    c.style.display = "none";
    f.style.display = "none";

    wait = document.getElementById("wait");
    unapprovedCustEle = document.getElementById("unapproved-list-customer")
    unapprovedFpsEle = document.getElementById("unapproved-list-fps");

    self.loadPlaces();
    self.loadUnApprovedListCustomer();
    self.loadUnApprovedListFps();
  },

  loadPlaces: function() {
    var self = this;

    selectPlaceEle = document.getElementById("place-list");
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
    });
  },

  loadUsers: function() {
    var self = this;

    wait.style.display = "block";
    i = 0;
    loadUserInter = setInterval(self.checkUserRegistered, 100);
    // console.log(userDb);
  },

  checkUserRegistered: function() {
    var self = this;
    console.log("i => " + i);
    userGlobal.checkUserRegistered.call(accounts[i]).then(function(res){
      console.log(accounts[i] + " => " + res);
      userDb[accounts[i]] = res;
      i++;
      if (i == 10) {
        i = 0;
        clearInterval(loadUserInter);
        wait.style.display = "none";
        console.log("Finished loading/checking user registrations");
        userDb[governmentAddress] = true;
        console.log(userDb);
      }
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
    }).catch(function(e){
      console.log(e);
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
      return Approval.deployed();
    }).then(function(instance){
      approvalGlobal = instance;
      return approvalGlobal.addToNotApprovedList(userAddr, 2, {from: governmentAddress, gas: 250000});
    }).then(function(res){
      console.log(res);
    }).catch(function(e){
      console.log(e);
    });
  },

  registerFPS: function() {
    var self = this;
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

    var userAddr = self.getNewAddress();

    // userGlobal.addUser(userAddr, name.value, email.value, 1, pass.value, uplace, {from: governmentAddress, gas: 200000}).then(function(res){
    //   console.log(res);
    //   userDb[userAddr] = true;
    // }).catch(function(e){
    //   console.log(e);
    // });

    userGlobal.addUser(userAddr, name.value, email.value, 1, pass.value, uplace, {from: governmentAddress, gas: 250000}).then(function(res){
      console.log(res);
      userDb[userAddr] = true;
      return Approval.deployed();
    }).then(function(instance){
      approvalGlobal = instance;
      return approvalGlobal.addToNotApprovedList(userAddr, 1, {from: governmentAddress, gas: 250000});
    }).then(function(res){
      console.log(res);
    }).catch(function(e){
      console.log(e);
    });
  },

  loadUnApprovedListCustomer: function() {
    var self = this;

    var customerNum;
    Approval.deployed().then(function(instance){
      approvalGlobal = instance;
      return approvalGlobal.getUnApprovedCustomers({from: governmentAddress});
    }).then(function(num1){
      customerNum = num1;
      console.log("customerNum => " + customerNum);
      j = 0;
      // loop through 0 to customerNum
    });
  },

  loadUnApprovedListFps: function() {
    var self = this;

    var fpsNum;
    Approval.deployed().then(function(instance){
      approvalGlobal = instance;
      return approvalGlobal.getUnApprovedFPS({from: governmentAddress});
    }).then(function(num1){
      fpsNum = num1;
      console.log("fpsNum => " + fpsNum);
      k = 0;
      // loop through 0 to fpsNum
    });
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
    g.style.display = "block";
    c.style.display = "none";
    f.style.display = "none";
  },

  showCustomer: function() {
    var self = this;
    c.style.display = "block";
    f.style.display = "none";
    g.style.display = "none";
  },

  showFPS: function() {
    var self = this;
    f.style.display = "block";
    g.style.display = "none";
    c.style.display = "none";
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
