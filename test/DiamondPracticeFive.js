const { expect } = require('chai')
const helpers = require('@nomicfoundation/hardhat-network-helpers')
const { ethers } = require('hardhat')
const { deployDiamond } = require('../contracts/DiamondPracticeFive/diamondFullDeployment.js')

describe("DiamondPracticeFive", () => {
    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners()

        diamondAddress = await deployDiamond()
        CounterFacet = await ethers.getContractAt('contracts/DiamondPracticeOne/CounterFacet.sol:CounterFacet', diamondAddress)
    })

    it("Count function returns the stored count", async () => {
        // count variable is initialised as ten
        expect(await CounterFacet.count()).to.equal(10)

        await CounterFacet.increment()

        // count function returns updated variable
        // correctly
        expect(await CounterFacet.count()).to.equal(11)
    })

    it("Increment function correctly updates the count variable", async () => {
        expect(await CounterFacet.count()).to.equal(10)

        await CounterFacet.increment()

        expect(await CounterFacet.count()).to.equal(11)
    })

    it("Decrement function correctly updates the count variable", async () => {
        expect(await CounterFacet.count()).to.equal(10)

        await CounterFacet.decrement()

        expect(await CounterFacet.count()).to.equal(9)
    })
})