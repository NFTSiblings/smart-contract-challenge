const { getSelectors, FacetCutAction } = require('../../scripts/libraries/diamond.js')

async function deployDiamond() {
    // deploy DiamondCutFacet
    const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
    const diamondCutFacet = await DiamondCutFacet.deploy()
    await diamondCutFacet.deployed()
    console.log('DiamondCutFacet deployed:', diamondCutFacet.address)

    // deploy DiamondInit
    const DiamondInit = await ethers.getContractFactory('DiamondInit')
    const diamondInit = await DiamondInit.deploy()
    await diamondInit.deployed()
    console.log('DiamondInit deployed:', diamondInit.address)

    const FacetNames = [
        // normally, the name of the facet listed here would
        // just be `CounterFacet`, but since there are multiple
        // contracts called CounterFacet in the contracts folder
        // of this repo, we need to include a file path to the
        // specific contract
        "contracts/DiamondPracticeTwo/CounterFacet.sol:CounterFacet",
        "DiamondLoupeFacet"
    ]
    const cut = []

    for (let FacetName of FacetNames) {
        const Facet = await ethers.getContractFactory(FacetName)
        const facet = await Facet.deploy()
        await facet.deployed()
        console.log(`${FacetName} deployed:`, facet.address)

        cut.push({
            facetAddress: facet.address,
            action: FacetCutAction.Add,
            functionSelectors: getSelectors(facet)
        })
    }

    // deploy Diamond
    const Diamond = await ethers.getContractFactory('contracts/DiamondPracticeTwo/Diamond.sol:Diamond')
    const diamond = await Diamond.deploy(diamondCutFacet.address)
    await diamond.deployed()
    console.log('Diamond deployed:', diamond.address)

    // send DiamondCut txn
    const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
    let functionCall = diamondInit.interface.encodeFunctionData('initCounterFacet')
    const txn = await diamondCut.diamondCut(cut, diamondInit.address, functionCall)
    console.log(`Diamond cut tx: ${txn.hash}`)
    const receipt = await txn.wait()

    if (!receipt.status) {
        throw Error(`Diamond cut failed: ${txn.hash}`)
    } else {
        console.log(`Diamond cut completed`)
    }
}

deployDiamond()