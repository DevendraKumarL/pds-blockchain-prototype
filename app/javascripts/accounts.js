import "../stylesheets/app.css";
// Import libraries we need.
import { default as Web3} from 'web3';

var accounts;
window.App = {
    start: function() {
        var self = this;
        accounts = web3.eth.accounts;
        var mainDiv = document.getElementById("main-div");
        for (var i = 0; i < accounts.length; i++) {
            console.log(accounts[i]);
            var d = document.createElement("div");
            var d1 = document.createElement("div");
            d.setAttribute("class", "col-md-5 card card-1");
            d1.innerHTML = accounts[i];
            // d1.id = accounts[i];
            var b = document.createElement("button");
            b.type = "button";
            b.setAttribute("class", "btn btn-secondary btn-sm");
            b.innerHTML = "Copy";
            b.id = accounts[i].toString();
            b.onclick = function(e) {
                window.App.copyToClipboard(e.target.id);
            }
            d.appendChild(d1);
            d.appendChild(b);
            var clearfix = document.createElement("div");
            clearfix.setAttribute("class", "clearfix");
            mainDiv.appendChild(d);
        }
    },

    copyToClipboard: function (element) {
        console.log(element);
        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val(element).select();
        document.execCommand("copy");
        $temp.remove();
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
