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
var loadAcctsEle, selectPlaceEle;
var i, loadUserInterval;
var notifiy1, notifiy2;
// var j, k, l, m;
// var loadUnapproCustInterval, loadUnapproFpsInterval, loadApprovedCustInterval, loadApprovedFpsInterval;
// var selectApprovedFpsEle;
// var unapprovedCustDiv, unapprovedFpsDiv, approvedCustDiv;
// var fpsNum, customerNum;

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

    notifiy1 = document.getElementById("notification1");
    notifiy2 = document.getElementById("notification2");
    // loadAcctsEle = document.getElementById("load-accts");
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
    loadUserInterval = setInterval(self.checkUserRegistered, 130);
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
      // alert("Government registered succesfully");
      notifiy1.setAttribute("class", "alert alert-success col-md-12");
      notifiy1.innerHTML = "Government registered succesfully. Address: <strong>" + governmentAddress + "</strong>";
      notifiy1.style.display = "block";
      self.hideDivs();
    }).catch(function(e){
      console.log(e);
      notifiy1.setAttribute("class", "alert alert-danger col-md-12");
      notifiy1.innerHTML = "Government registeration failed. <strong>" + e + "</strong>";
      notifiy1.style.display = "block";
      notifiy2.style.display = "none";
      self.hideDivs();
      return;
    });
  },

  registerCustomer: function() {
    var self = this;
    var userAddr = self.getNewAddress();
    var name = document.getElementById("c-name");
    var email = document.getElementById("c-email");
    var pass = document.getElementById("c-password");
    console.log(name.value + " : " + email.value + " : " + pass.value);
    var uplace = selectPlaceEle.options[selectPlaceEle.selectedIndex].value;
    if (uplace == -1) {
      alert("Select a valid place");
      return;
    }
    userGlobal.addUser(userAddr, name.value, email.value, 2, pass.value, uplace, {from: governmentAddress, gas: 250000}).then(function(res){
      console.log(res);
      if (res.logs.length == 0) {
        throw "Email already taken";
      }
      userDb[userAddr] = true;
      name.value = "";
      email.value = "";
      pass.value = "";
      // alert("Customer registered succesfully");
      notifiy1.setAttribute("class", "alert alert-success col-md-12");
      notifiy1.innerHTML = "Customer registered succesfully. Address: <strong>" + userAddr + "</strong>";
      notifiy1.style.display = "block";
      self.hideDivs();
      self.hideDivs();
      return Approval.deployed();
    }).then(function(instance){
      approvalGlobal = instance;
      return approvalGlobal.addToNotApprovedList(userAddr, 2, {from: governmentAddress, gas: 250000});
    }).then(function(res){
      console.log(res);
      notifiy2.setAttribute("class", "alert alert-info col-md-12");
      notifiy2.innerHTML = "Customer added to Pending Approval List. Wait for Government to approve.";
      notifiy2.style.display = "block";
    }).catch(function(e){
      console.log(e);
      notifiy1.setAttribute("class", "alert alert-danger col-md-12");
      notifiy1.innerHTML = "Customer registration failed. <strong>"+ e + "</strong>";
      notifiy1.style.display = "block";
      notifiy2.style.display = "none";
      return;
    });
  },

  registerFPS: function() {
    var self = this;
    var userAddr = self.getNewAddress();
    var name = document.getElementById("f-name");
    var email = document.getElementById("f-email");
    var pass = document.getElementById("f-password");
    console.log(name.value + " : " + email.value + " : " + pass.value);
    var uplace = selectPlaceEle.options[selectPlaceEle.selectedIndex].value;
    if (uplace == -1) {
      alert("Select a valid place");
      return;
    }
    userGlobal.addUser(userAddr, name.value, email.value, 1, pass.value, uplace, {from: governmentAddress, gas: 250000}).then(function(res){
      console.log(res);
      if (res.logs.length == 0) {
        throw "Email already taken";
      }
      userDb[userAddr] = true;
      name.value = "";
      email.value = "";
      pass.value = "";
      // alert("FPS registered succesfully");
      notifiy1.setAttribute("class", "alert alert-success col-md-12");
      notifiy1.innerHTML = "FPS registered succesfully. Address: <strong>" + userAddr + "</strong>";
      notifiy1.style.display = "block";
      self.hideDivs();
      return Approval.deployed();
    }).then(function(instance){
      approvalGlobal = instance;
      return approvalGlobal.addToNotApprovedList(userAddr, 1, {from: governmentAddress, gas: 250000});
    }).then(function(res){
      console.log(res);
      notifiy2.setAttribute("class", "alert alert-info col-md-12");
      notifiy2.innerHTML = "FPS added to Pending Approval List. Wait for Government to approve.";
      notifiy2.style.display = "block";
    }).catch(function(e){
      console.log(e);
      notifiy1.setAttribute("class", "alert alert-danger col-md-12");
      notifiy1.innerHTML = "FPS registration failed. <strong>"+ e + "</strong>";
      notifiy1.style.display = "block";
      notifiy2.style.display = "none";
      return;
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
