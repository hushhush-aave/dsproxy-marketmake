import { expect } from 'chai';
import { ethers } from "hardhat";
import { BigNumberish, Contract, ContractFactory, EventFilter, Signer } from "ethers";
import { Fragment } from 'ethers/lib/utils';

describe("DSProxy", function () {

    let owner: Signer;
    let user: Signer;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
    });

    function getFunctions(contract: ContractFactory) {
        let cFunctions = {};
        let functionName = (frag: Fragment) => {
            if (frag.name == null) { return } return frag.name + "(" + frag.inputs.map(i => i.type) + ")";
        };

        contract.interface.fragments.forEach(frag => {
            let fn = functionName(frag);
            if (fn != null && fn != undefined) {
                cFunctions[fn] = frag;
            }
        });

        return cFunctions;
    }

    function getCalldata(contractFactory: ContractFactory, functionName: string, args: any[]): string {
        let functions: {} = getFunctions(contractFactory);
        if (functions[functionName] == undefined) {
            throw new Error('Invalid function: \"' + functionName + '\"');
        }
        let calldataString = contractFactory.interface.encodeFunctionData(functions[functionName], args);
        return calldataString;
    }

    it("Generate proxy, retrieve eth", async function () {
        const DSProxyFactory: ContractFactory = await ethers.getContractFactory("DSProxyFactory", owner);
        const DSProxy: ContractFactory = await ethers.getContractFactory("DSProxy");
        const ProxyRec: ContractFactory = await ethers.getContractFactory("ProxyRec");

        const dsProxyFactory: Contract = await DSProxyFactory.deploy();
        await dsProxyFactory.deployed();

        // User creates proxy
        let calldataCreateProxy: string = getCalldata(DSProxyFactory, "build()", null);
        await user.sendTransaction({ to: dsProxyFactory.address, data: calldataCreateProxy });
        let userBalance = await user.getBalance();

        let filter: EventFilter = dsProxyFactory.filters.Created(await user.getAddress());
        let query = await dsProxyFactory.queryFilter(filter);
        let proxyAddress: string = query[0]["args"]["proxy"];

        const proxy = DSProxy.attach(proxyAddress);
        expect(await user.provider.getBalance(proxy.address)).to.equal(0);

        // owner transfers ether to proxy
        let transferValue: BigNumberish = ethers.utils.parseEther("10");
        await owner.sendTransaction({ to: proxy.address, value: transferValue });
        expect(await user.provider.getBalance(proxy.address)).to.above(0);

        // Get data for execute(bytes,bytes).
        let recoverScriptBytecode = ProxyRec["bytecode"];
        let calldataRecover = getCalldata(ProxyRec, "recover()", null);

        // Create execute calldata
        let calldataExecute = getCalldata(DSProxy, "execute(bytes,bytes)", [recoverScriptBytecode, calldataRecover]);
        await user.sendTransaction({ to: proxy.address, data: calldataExecute });

        expect(await user.provider.getBalance(proxy.address)).to.equal(0);
        expect(await user.getBalance()).to.above(userBalance);
    });

    it("Generate proxy, other tries to retrieve eth", async function () {
        const DSProxyFactory: ContractFactory = await ethers.getContractFactory("DSProxyFactory", owner);
        const DSProxy: ContractFactory = await ethers.getContractFactory("DSProxy");
        const ProxyRec: ContractFactory = await ethers.getContractFactory("ProxyRec");

        const dsProxyFactory: Contract = await DSProxyFactory.deploy();
        await dsProxyFactory.deployed();

        // User creates proxy
        let calldataCreateProxy: string = getCalldata(DSProxyFactory, "build()", null);
        await user.sendTransaction({ to: dsProxyFactory.address, data: calldataCreateProxy });

        let filter: EventFilter = dsProxyFactory.filters.Created(await user.getAddress());
        let query = await dsProxyFactory.queryFilter(filter);
        let proxyAddress: string = query[0]["args"]["proxy"];

        const proxy = DSProxy.attach(proxyAddress);
        expect(await user.provider.getBalance(proxy.address)).to.equal(0);

        // owner transfers ether to proxy
        let transferValue: BigNumberish = ethers.utils.parseEther("10");
        await owner.sendTransaction({ to: proxy.address, value: transferValue });
        expect(await user.provider.getBalance(proxy.address)).to.above(0);

        // Get data for execute(bytes,bytes).
        let recoverScriptBytecode = ProxyRec["bytecode"];
        let calldataRecover = getCalldata(ProxyRec, "recover()", null);

        // Create execute calldata
        let calldataExecute = getCalldata(DSProxy, "execute(bytes,bytes)", [recoverScriptBytecode, calldataRecover]);
        await expect(
            owner.sendTransaction({ to: proxy.address, data: calldataExecute})
        ).to.be.revertedWith("ds-auth-unauthorized");

        expect(await user.provider.getBalance(proxy.address)).to.equal(transferValue);
    });

});