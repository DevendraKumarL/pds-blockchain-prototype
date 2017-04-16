var User = artifacts.require("./User.sol")
var RationCard = artifacts.require("./RationCard.sol")
var Approval = artifacts.require("./Approval.sol")
var Food = artifacts.require("./Food.sol")
var Rupee = artifacts.require("./Rupee.sol")

contract('User', function(accounts) {
    it("should create centralGovernment user", function() {
        var userglobal;
        return User.deployed().then(function(instance) {
            userglobal = instance;
            return userglobal.addUser(accounts[0], "central", "central@pds.com", 0, "password", 0, {from: accounts[0]});
        }).then(function(res) {
            return userglobal.getUserDetails.call(accounts[0]);
        }).then(function(userinfo){
            assert.equal(userinfo[0], accounts[0], "centralGovernment user was not created");
        })
    })
})
