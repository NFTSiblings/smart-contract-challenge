const { expect } = require('chai')
const helpers = require('@nomicfoundation/hardhat-network-helpers')
const { ethers } = require('hardhat')

describe("Practice2", () => {
    beforeEach(async () => {
        [owner, addr1] = await ethers.getSigners()

        practiceTwo = await ethers.getContractFactory("PracticeTwo")
        contract = await practiceTwo.deploy()
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

            await expect(contract.connect(addr1).beginSale())
            .to.be.revertedWith("Caller is not admin")

            await expect(contract.connect(addr1).reserve(1))
            .to.be.revertedWith("Caller is not admin")

            await expect(contract.connect(addr1).withdraw())
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

    describe("Must have a public sale that goes for 48 hours or until all tokens are minted", () => {
        it("Purchasing tokens during sale works correctly", async () => {
            await contract.beginSale()

            expect(await contract.connect(addr1).mint(1, { value: ethers.utils.parseEther("0.01") }))
            .not.to.be.reverted

            expect(await contract.balanceOf(addr1.address)).to.equal(1)
            expect(await contract.ownerOf(0)).to.equal(addr1.address)
        })

        it("Sale automatically concludes after 48 hours", async () => {
            await contract.beginSale()
            await helpers.time.increase(259200)

            await expect(contract.connect(addr1).mint(1, { value: ethers.utils.parseEther("0.03") }))
            .to.be.revertedWith("Sale is not available now")
        })

        it("Sale concludes if all tokens are minted", async () => {
            await contract.beginSale()

            await contract.reserve(1000)
            await expect(contract.connect(addr1).mint(1, { value: ethers.utils.parseEther("0.03") }))
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

    describe("Tokens must cost 0.01 Ether", () => {
        it("Mint function accepts the correct amount of Ether", async () => {
            await contract.beginSale()

            // Sending no ether value
            await expect(contract.connect(addr1).mint(1))
            .to.be.revertedWith("Incorrect amount of Ether sent")

            // Sending the price of one token when trying to purchase two
            await expect(contract.connect(addr1).mint(2, { value: ethers.utils.parseEther("0.01") }))
            .to.be.revertedWith("Incorrect amount of Ether sent")

            // Correct amount when purchasing one token
            await expect(contract.connect(addr1).mint(1, { value: ethers.utils.parseEther("0.01") }))

            // Correct amount when purchasing two tokens
            await expect(contract.connect(addr1).mint(2, { value: ethers.utils.parseEther("0.02") }))
        })
    })

    describe("Sale must have a limit of 5 token mints per wallet", () => {
        it("Wallets can mint no more than 5 tokens", async () => {
            await contract.beginSale()

            await expect(contract.connect(addr1).mint(6, { value: ethers.utils.parseEther("0.06") }))
            .to.be.revertedWith("Trying to mint too many tokens")

            await contract.connect(addr1).mint(4, { value: ethers.utils.parseEther("0.04") })

            await expect(contract.connect(addr1).mint(2, { value: ethers.utils.parseEther("0.02") }))
            .to.be.revertedWith("Trying to mint too many tokens")

            await contract.connect(addr1).mint(1, { value: ethers.utils.parseEther("0.01") })

            await expect(contract.connect(addr1).mint(1, { value: ethers.utils.parseEther("0.01") }))
            .to.be.revertedWith("Trying to mint too many tokens")
        })
    })

    describe("Must have a withdrawal function for admins to withdraw funds from the contract", () => {
        it("Withdraw function works correctly", async () => {
            await contract.beginSale()
            await contract.connect(addr1).mint(5, { value: ethers.utils.parseEther("0.05") })

            let balance = await contract.balance;

            expect(await contract.withdraw())
            .to.changeEtherBalances([owner, contract], [balance, 0 - balance]);
        })
    })

    describe("Token metadata should be returned on-chain", () => {
        beforeEach(async () => {
            await contract.reserve(1)
            tokenId = 0

            uri = await contract.tokenURI(tokenId)
            metadata = JSON.parse(uri.substring(27))
        })

        it("Token metadata is in correct format", async () => {
            expect(uri.substring(0, 27)).to.equal("data:application/json;utf8,")
        })

        it("Token metadata has correct attributes", async () => {
            expect(metadata.hasOwnProperty("name")).to.equal(true)
            expect(metadata.hasOwnProperty("description")).to.equal(true)
            expect(metadata.hasOwnProperty("created_by")).to.equal(true)
            expect(metadata.hasOwnProperty("image")).to.equal(true)
            expect(metadata.hasOwnProperty("animation")).to.equal(true)
        })

        it("The image url and animation url for each token should use the standard base URI method", async () => {
            expect(metadata.image).to.equal("https://api.images.com/" + tokenId)
            expect(metadata.animation).to.equal("https://api.animations.com/" + tokenId)
        })
    })
})