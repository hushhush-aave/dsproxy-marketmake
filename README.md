# Outline
- Ideas
- Notice buggy ethers


# Ideas
The general idea is to group transactions into smaller chunks such that it is easier for me/users to stake funds, or invest. Something a bit like the what is at zapper and zerion, but could also be for depositing into Aave etc. Or more intricate stuff.

From the users perspective, the easiest would be to give the proxy transfer rights? Or directly let it hold the funds? If the proxy holds the tokens itself, we can get away with fewer transfers in a lot of places. But we then have to extract them when if we were to interact with something that does not have a smart proxy written for them? 

## How to access funds
To make the proxy usable, it needs to be able to access the the funds of the user. We can do so in two manners, each with their painpoints. a) let the proxy access tokens through an initial approval or b) let the proxy hold the tokens.

### Proxy have approval for funds
For the case were the user will holds his funds. He needs to approve that the proxy is able to spend funds on his behalf. Otherwise it wont work. Practically, we would make an infinite approval, which should be secure as only the user can actually call functions using the proxy as we use `auth` for the `execute(address, bytes)` function. 

*When would we ever end up in `src == address(this)`?* 



For the case were we still have that the users is 

### Proxy hold funds





# Notice buggy ethers
https://github.com/nomiclabs/hardhat/issues/1168

Note that there is a bug in `ethers` such that you cannot directly call the `build` and `execute` functions of the factory and proxy js-objects.

## To build
When building, we need to also take into account that the address of the proxy is published in an event that we need to catch to know ehere we just created a proxy.

```javascript
const [owner, addr1] = await ethers.getSigners();

const DSProxyFactory = await ethers.getContractFactory(
    "DSProxyFactory",
    owner
);

// Deploy a proxy factory
const dsproxyFactory = await DSProxyFactory.deploy();
await dsproxyFactory.deployed();

// Read the fragments and encode a function with the fragment
let fragmentCreate = DSProxyFactory.interface.fragments[2]; // fragment for "build()"
let calldataCreate = DSProxyFactory.interface.encodeFunctionData(fragmentCreate);
await addr1.sendTransaction({ to: dsproxyFactory.address, data: calldataCreate});
//await dsproxyFactory.connect(addr1).build(); // This will crash the program. 

// Create a filer and query it, retrieve the proxy address
let filter = await dsproxyFactory.filters.Created(addr1.address);
let query = await dsproxyFactory.queryFilter(filter);
let proxyAddress = query[0]["args"]["proxy"];

// Attach to the new created proxy
const DSProxy = await ethers.getContractFactory("DSProxy", addr1);
const proxy = await DSProxy.attach(proxyAddress);
```


## To execute
```javascript
const SCRIPT = await ethers.getContractFactory("ProxyRec");
let bytecode = SCRIPT["bytecode"];

let fragment = SCRIPT.interface.fragments[1]; // Find fragment for recover()
let calldata = SCRIPT.interface.encodeFunctionData(fragment); // Encode calldata

let fragmentExecute = proxy.interface.fragments[2]; // "execute(bytes,bytes)" call
let calldataExecute = proxy.interface.encodeFunctionData(fragmentExecute, [bytecode, calldata]); // Full calldata for transaction
await addr1.sendTransaction({ to: proxy.address, data: calldataExecute});
```


