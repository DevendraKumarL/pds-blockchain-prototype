// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";
// Import libraries we need.
import { default as Web3} from 'web3';

var secretKeyEle, generatedHashEle;
window.hashGeneratorApp = {
    start: function() {
        var self = this;

        secretKeyEle = document.getElementById("secretKey-input");
        generatedHashEle = document.getElementById("generatedHash-output");

        secretKeyEle.value = "";
        secretKeyEle.placeholder = "Secret Key";
        generatedHashEle.value = "";
        generatedHashEle.placeholder = "Generated sha3Hash";
    },

    getSha3Hash: function() {
        var hash = web3.sha3(secretKeyEle.value);
        console.log("generatedHash => " + hash);
        generatedHashEle.value = hash;
        return;
    },

    copyAddress: function (element) {
        console.log(element);
        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val($(element).val()).select();
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
        // console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
        console.warn("No web3 detected. Falling back to http://localhost:8080. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
        // window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8080"));
    }
    hashGeneratorApp.start();
});
