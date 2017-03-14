var User = artifacts.require("./User.sol");
var RationCard = artifacts.require("./RationCard.sol");

module.exports = function(deployer) {
    deployer.deploy(User);
    deployer.deploy(RationCard);
};
