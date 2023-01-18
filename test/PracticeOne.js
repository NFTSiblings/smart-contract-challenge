const { expect } = require('chai')
const helpers = require('@nomicfoundation/hardhat-network-helpers')
const { ethers } = require('hardhat')

describe("Practice1", () => {
    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners()

        practiceOne = await ethers.getContractFactory("PracticeOne")
        contract = await practiceOne.deploy()

        await contract.toggleAllowlist([addr1.address])
    })

    describe("Must be compatible with ERC721", () => {
        it("supportsInterface function signals support for IERC721", async () => {
            expect(await contract.supportsInterface("0x80ac58cd")).to.equal(true);
        })

        it("Contract supports all necessary ERC721 functions", async () => {
            expect(contract.hasOwnProperty("balanceOf")).to.equal(true)
            expect(contract.hasOwnProperty("ownerOf")).to.equal(true)
            expect(contract.hasOwnProperty("safeTransferFrom(address,address,uint256,bytes)")).to.equal(true)
            expect(contract.hasOwnProperty("safeTransferFrom(address,address,uint256)")).to.equal(true)
            expect(contract.hasOwnProperty("transferFrom")).to.equal(true)
            expect(contract.hasOwnProperty("approve")).to.equal(true)
            expect(contract.hasOwnProperty("setApprovalForAll")).to.equal(true)
            expect(contract.hasOwnProperty("getApproved")).to.equal(true)
            expect(contract.hasOwnProperty("isApprovedForAll")).to.equal(true)
        })
    })

    describe("Must be able to add multiple contract admins, who can access admin-only functions", () => {
        it("Can add/remove admins", async () => {
            expect(await contract.admins(addr1.address)).to.equal(false)

            await contract.toggleAdmins(addr1.address)
            expect(await contract.admins(addr1.address)).to.equal(true)

            await contract.toggleAdmins(addr1.address)
            expect(await contract.admins(addr1.address)).to.equal(false)
        })

        it("Only admins can access restricted functions", async () => {
            await expect(contract.connect(addr1).togglePause())
            .to.be.revertedWith("Caller is not admin")

            await expect(contract.connect(addr1).toggleAdmins(addr1.address))
            .to.be.revertedWith("Caller is not admin")

            await expect(contract.connect(addr1).toggleAllowlist([addr1.address]))
            .to.be.revertedWith("Caller is not admin")

            await expect(contract.connect(addr1).beginSale())
            .to.be.revertedWith("Caller is not admin")

            await expect(contract.connect(addr1).reserve(1))
            .to.be.revertedWith("Caller is not admin")
        })
    })

    describe("Contract must be pausable by admins (no transfers, mints or burns when contract is paused)", () => {
        it("Toggle pause function works as expected", async () => {
            expect(await contract.paused()).to.equal(false);
            await contract.togglePause()
            expect(await contract.paused()).to.equal(true);
            await contract.togglePause()
            expect(await contract.paused()).to.equal(false);
        })

        it("Transfers, mints and burns are unavailable when contract is paused", async () => {
            await contract.reserve(1)
            await contract.togglePause()
            
            await expect(contract["safeTransferFrom(address,address,uint256)"](owner.address, addr1.address, 0))
            .to.be.revertedWith("Contract is currently paused")

            await expect(contract.burn(0))
            .to.be.revertedWith("Contract is currently paused")

            await contract.beginSale()
            await expect(contract.connect(addr1).mint(1, { value: ethers.utils.parseEther("0.01") }))
            .to.be.revertedWith("Contract is currently paused")
        })
    })

    describe("Must support EIP2981 NFT Royalty Standard", () => {
        it("supportsInterface function signals support for IERC2981", async () => {
            expect(await contract.supportsInterface("0x2a55205a")).to.equal(true);
        })

        it("Contract supports all necessary ERC2981 functions", async () => {
            expect(contract.hasOwnProperty("royaltyInfo")).to.equal(true)
        })
    })

    describe("Must have a private sale that goes for 24 hours (only addresses on an allowlist can mint during this sale)", () => {
        it("Allowlisted wallets are able to mint during private sale", async () => {
            await contract.beginSale()
            expect(await contract.connect(addr1).mint(1, { value: ethers.utils.parseEther("0.01") }))
            .not.to.be.reverted

            expect(await contract.balanceOf(addr1.address)).to.equal(1)
            expect(await contract.ownerOf(0)).to.equal(addr1.address)
        })

        it("Wallets which aren't allowlisted can't mint during the private sale", async () => {
            await contract.beginSale()

            await expect(contract.connect(addr2).mint(1, { value: ethers.utils.parseEther("0.01") }))
            .to.be.revertedWith("You are not on the allowlist")
        })

        it("Private sale ends automatically after 24 hours", async () => {
            await contract.beginSale()

            // Private sale is currently active, therefore wallets must be on the allowlist to mint
            await expect(contract.connect(addr2).mint(1, { value: ethers.utils.parseEther("0.01") }))
            .to.be.revertedWith("You are not on the allowlist")

            await helpers.time.increase(86400)

            // After 24 hours, the private sale concludes and related restrictions no longer apply
            await expect(contract.connect(addr2).mint(1, { value: ethers.utils.parseEther("0.03") }))
            .not.to.be.reverted
        })

        it("No wallet may mint before the private sale begins", async () => {
            await expect(contract.connect(addr1).mint(1, { value: ethers.utils.parseEther("0.01") }))
            .to.be.revertedWith("Sale is not available now")

            await expect(contract.connect(addr2).mint(1, { value: ethers.utils.parseEther("0.03") }))
            .to.be.revertedWith("Sale is not available now")
        })
    })

    describe("Must have a public sale that goes for 48 hours or until all tokens are minted", () => {
        it("Purchasing tokens during public sale works correctly", async () => {
            await contract.beginSale()
            await helpers.time.increase(86400)

            expect(await contract.connect(addr2).mint(1, { value: ethers.utils.parseEther("0.03") }))
            .not.to.be.reverted

            expect(await contract.balanceOf(addr2.address)).to.equal(1)
            expect(await contract.ownerOf(0)).to.equal(addr2.address)
        })

        it("Public sale automatically concludes after 48 hours", async () => {
            await contract.beginSale()
            await helpers.time.increase(259200)

            await expect(contract.connect(addr2).mint(1, { value: ethers.utils.parseEther("0.03") }))
            .to.be.revertedWith("Sale is not available now")
        })

        it("Public sale concludes if all tokens are minted", async () => {
            await contract.beginSale()
            await helpers.time.increase(86400)

            await contract.reserve(1000)
            await expect(contract.connect(addr2).mint(1, { value: ethers.utils.parseEther("0.03") }))
            .to.be.revertedWith("Too few tokens remaining")
        })
    })

    describe("Must have a maximum supply of 1000", () => {
        it("No more than 1000 tokens can be minted", async () => {
            await contract.beginSale()
            await helpers.setBalance(owner.address, ethers.utils.parseEther("100"))
            await contract.reserve(999)

            await expect(contract.connect(addr1).mint(2, { value: ethers.utils.parseEther("0.02") }))
            .to.be.revertedWith("Too few tokens remaining")

            await contract.reserve(1)

            await expect(contract.connect(addr1).mint(1, { value: ethers.utils.parseEther("0.01") }))
            .to.be.revertedWith("Too few tokens remaining")
        })
    })

    describe("Tokens must cost 0.01 Ether during the private sale and 0.03 during the public sale", () => {
        beforeEach(async () => {
            await contract.beginSale()
        })

        it("Mint function accepts the correct amount of Ether during private sale", async () => {
            // Sending the public sale price during the private sale
            await expect(contract.connect(addr1).mint(1, { value: ethers.utils.parseEther("0.03") }))
            .to.be.revertedWith("Incorrect amount of Ether sent")

            // Sending no ether value
            await expect(contract.connect(addr1).mint(1))
            .to.be.revertedWith("Incorrect amount of Ether sent")

            // Sending the price of one token when trying to purchase two
            await expect(contract.connect(addr1).mint(2, { value: ethers.utils.parseEther("0.01") }))
            .to.be.revertedWith("Incorrect amount of Ether sent")

            // Correct amount
            await expect(contract.connect(addr1).mint(2, { value: ethers.utils.parseEther("0.02") }))
            .not.to.be.reverted
        })

        it("Mint function accepts the correct amount of Ether during public sale", async () => {
            await helpers.time.increase(86400)

            // Sending the private sale price during the public sale
            await expect(contract.connect(addr2).mint(1, { value: ethers.utils.parseEther("0.01") }))
            .to.be.revertedWith("Incorrect amount of Ether sent")

            // Sending no ether value
            await expect(contract.connect(addr2).mint(1))
            .to.be.revertedWith("Incorrect amount of Ether sent")

            // Sending the price of one token when trying to purchase two
            await expect(contract.connect(addr2).mint(2, { value: ethers.utils.parseEther("0.03") }))
            .to.be.revertedWith("Incorrect amount of Ether sent")

            // Correct amount
            await expect(contract.connect(addr2).mint(2, { value: ethers.utils.parseEther("0.06") }))
            .not.to.be.reverted
        })
    })

    describe("Must have a wallet cap (limit per wallet) of 2 for the private sale, and 5 for the public sale", () => {
        beforeEach(async () => {
            await contract.beginSale()
        })

        it("Wallets can mint no more than 2 during private sale", async () => {
            await expect(contract.connect(addr1).mint(3, { value: ethers.utils.parseEther("0.03") }))
            .to.be.revertedWith("Trying to mint too many tokens")

            await contract.connect(addr1).mint(1, { value: ethers.utils.parseEther("0.01") })

            await expect(contract.connect(addr1).mint(2, { value: ethers.utils.parseEther("0.02") }))
            .to.be.revertedWith("Trying to mint too many tokens")

            await contract.connect(addr1).mint(1, { value: ethers.utils.parseEther("0.01") })

            await expect(contract.connect(addr1).mint(1, { value: ethers.utils.parseEther("0.01") }))
            .to.be.revertedWith("Trying to mint too many tokens")
        })

        it("Wallets can mint no more than 5 during public sale", async () => {
            await helpers.time.increase(86400)

            await expect(contract.connect(addr2).mint(6, { value: ethers.utils.parseEther("0.18") }))
            .to.be.revertedWith("Trying to mint too many tokens")

            await contract.connect(addr2).mint(4, { value: ethers.utils.parseEther("0.12") })

            await expect(contract.connect(addr2).mint(2, { value: ethers.utils.parseEther("0.06") }))
            .to.be.revertedWith("Trying to mint too many tokens")

            await contract.connect(addr2).mint(1, { value: ethers.utils.parseEther("0.03") })

            await expect(contract.connect(addr2).mint(1, { value: ethers.utils.parseEther("0.03") }))
            .to.be.revertedWith("Trying to mint too many tokens")
        })
    })

    describe("Base URI must change every day - loops every 3 days:", () => {
        it("Base URI changes every day for 3 days, repeating", async () => {
            await contract.reserve(1)

            let acceptedTokenUris = [
                "https://api.dayone.com/0",
                "https://api.daytwo.com/0",
                "https://api.daythree.com/0"
            ]

            let uriResults = []
            while (uriResults.length < 6) {
                let uri = await contract.tokenURI(0)
                uriResults.push(uri)

                expect(acceptedTokenUris.includes(uri)).to.equal(true)

                await helpers.time.increase(86400)
            }

            // console.log(uriResults)

            expect(uriResults[0]).to.equal(uriResults[3])
            expect(uriResults[1]).to.equal(uriResults[4])
            expect(uriResults[2]).to.equal(uriResults[5])
        })
    })
})