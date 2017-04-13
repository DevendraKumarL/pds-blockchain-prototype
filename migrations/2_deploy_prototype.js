var User = artifacts.require("./User.sol");
var RationCard = artifacts.require("./RationCard.sol");
var Approval = artifacts.require("./Approval.sol");
var Food = artifacts.require("./Food.sol");
var Rupee = artifacts.require("./Rupee.sol");

module.exports = function(deployer) {
    deployer.deploy(User);
    deployer.deploy(RationCard);
    deployer.deploy(Approval);
    deployer.deploy(Food);
    deployer.deploy(Rupee);
};
