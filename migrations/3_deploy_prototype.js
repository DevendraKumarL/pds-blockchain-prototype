var User = artifacts.require("./User.sol");
// var RationCard = artifacts.require("./RationCard.sol");
var Approval = artifacts.require("./Approval.sol");

module.exports = function(deployer) {
    deployer.deploy(User);
    // deployer.deploy(RationCard);/
    deployer.deploy(Approval);
};
