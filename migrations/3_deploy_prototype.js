var User = artifacts.require("./User.sol");
var RationCard = artifacts.require("./RationCard.sol");
// var Test1 = artifacts.require("./Test1.sol");
// var Test2 = artifacts.require("./Test2.sol");

module.exports = function(deployer) {
    deployer.deploy(User);
    deployer.deploy(RationCard);

    // deployer.deploy(Test1);
    // deployer.deploy(Test2);
};
