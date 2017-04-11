import "../stylesheets/app.css";
// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';

// Import our contract artifacts and turn them into usable abstractions.
import user_artifacts from '../../build/contracts/User.json';
var User = contract(user_artifacts);

var userGlobal;
window.App = {
    start: function() {
        var self = this;
        User.setProvider(web3.currentProvider);
        User.deployed().then(function(instance){
            userGlobal = instance;
            console.log(userGlobal);
        });
    },

    getUserInfo: function() {
        var self = this;
        var addr = $("#address").val();
        if (addr != "") {
            User.deployed().then(function(instance){
                userGlobal = instance;
                return userGlobal.getUserDetails.call(addr);
            }).then(function(userinfo){
                if (userinfo[0] == "0x0000000000000000000000000000000000000000") {
                    $("#alert-div").show();
                    $("#alert-div").html("Sorry! either the user is not registered or the address is invalid");
                    $("#userinfo-div").hide();
                    return;
                }
                $("#alert-div").hide();
                $("#userinfo-div").show();
                $("#user-addr").html(userinfo[0]);
                $("#user-name").html(userinfo[1]);
                $("#user-email").html(userinfo[2]);
                $("#user-type").html(userinfo[3]);
                $("#user-place").html(userinfo[4]);
                return;
            }).catch(function(e){
                console.log(e);
                $("#alert-div").show();
                $("#alert-div").html("Sorry! either the user is not registered or the address is invalid");
                $("#userinfo-div").hide();
            })
        }
        return;
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
    App.start();
});
