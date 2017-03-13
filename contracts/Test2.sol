pragma solidity ^0.4.2;

contract Test1 { function shit(uint num) returns (uint){} }

contract Test2 {
    function shitAgain(address _test1Addr) returns (uint) {
        Test1 t1 = Test1(_test1Addr);
        uint num = t1.shit(5);
        return num;
    }
}