// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import rationCard_artifacts from '../../build/contracts/RationCard.json';

// User is our usable abstraction, which we'll use through the code below.
var RationCard = contract(rationCard_artifacts);

var rationCardGlobal;
var accounts, governmentAddress;
var alert;
var latestCardNUmber;

window.RationApp = {
    start: function() {
        var self = this;

        RationCard.setProvider(web3.currentProvider);
        RationCard.deployed().then(function(instance){
            rationCardGlobal = instance;
            console.log(rationCardGlobal);

        });

        alert = document.getElementById("alert-message");

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
            self.showNumberOfRationCards();
            self.getLatestCardNumber();
        });
    },

    showNumberOfRationCards: function() {
        var self = this;

        var div = document.getElementById("number-of-ration-cards");
        RationCard.deployed().then(function(instance){
            rationCardGlobal = instance;
            return rationCardGlobal.totalNumberOfRationCards.call({from: governmentAddress});
        }).then(function(totalcards){
            console.log("totalNumberOfRationCards => " + totalcards.valueOf());
            div.innerHTML = "Total Number of Ration Cards : " + totalcards.valueOf();
        }).catch(function(e){
            console.log(e);
            alert.setAttribute("class", "alert alert-danger col-md-10");
            alert.innerHTML = "Couldn't fetch the total number of ration cards. Error: " + e;
            alert.style.display = "block";
        });
    },

    getLatestCardNumber: function() {
        var self = this;

        RationCard.deployed().then(function(instance){
            rationCardGlobal = instance;
            return rationCardGlobal.cardNumber.call();
        }).then(function(num){
            console.log("Latest card number => " + num.valueOf());
            latestCardNUmber = parseInt(num.valueOf());
        }).catch(function(e){
            console.log(e);
            alert.setAttribute("class", "alert alert-danger col-md-10");
            alert.innerHTML = "Couldn't fetch the latest ration card number. Error: " + e;
            alert.style.display = "block";
        });
    },

    viewRatioCardDetais: function() {
        var self = this;

        var number = document.getElementById("ration-card-number");
        if (number.value < 1001 && number.value >= latestCardNUmber) {
            alert.setAttribute("class", "alert alert-danger col-md-10");
            alert.innerHTML = "RationCard number must between 1001 and  " + latestCardNUmber;
            alert.style.display = "block";
            return;
        }

        RationCard.deployed().then(function(instance){
            rationCardGlobal = instance;
            return rationCardGlobal.getRationCardInfo.call(number.value);
        }).then(function(info){
            console.log(info);
            if (!info[0]) {
                alert.setAttribute("class", "alert alert-danger col-md-10");
                alert.innerHTML = "That ration card number is invalid";
                alert.style.display = "block";
                document.getElementById("card-details-div").style.display = "none";
                return;
            }
            alert.setAttribute("class", "alert alert-success col-md-10");
            alert.innerHTML = "Ration card details fetched successfully";
            alert.style.display = "block";
            var details = document.getElementById("card-details-div");
            document.getElementById("card-number").innerHTML = info[1].valueOf();
            document.getElementById("card-custname").innerHTML = info[2];
            document.getElementById("card-street").innerHTML = info[3];
            document.getElementById("card-fps").innerHTML = info[5];
            details.style.display = "block";

        }).catch(function(e){
            console.log(e);
            alert.setAttribute("class", "alert alert-danger col-md-10");
            alert.innerHTML = "Couldn't fetch ration card details. Error: " + e;
            alert.style.display = "block";
        });
    }
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

  RationApp.start();
});