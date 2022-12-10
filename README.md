# Practice Smart Contract #1

**Requirements**

- Must be compatible with ERC721
- Must be able to add multiple contract admins, who can access admin-only functions
- Contract must be pausable by admins (no transfers, mints or burns when contract is paused)
- Must support EIP2981 NFT Royalty Standard
- Must have a private sale that goes for 24 hours (only addresses on an allowlist can mint during this sale)
- Must have a public sale that goes for 48 hours or until all tokens are minted
- Must have a maximum supply of 1000
- Tokens must cost 0.01 Ether during the private sale and 0.03 during the public sale
- Must have a wallet cap (limit per wallet) of 2 for the private sale, and 5 for the public sale
- Base URI must change every day - loops every 3 days:

[ https://api.dayone.com/, https://api.daytwo.com/, https://api.daythree.com/ ]

**Tips**

- You can learn more about EIP2981 [here](https://eips.ethereum.org/EIPS/eip-2981)
- You may choose to import OpenZeppelin’s ERC721 implementation
- Inheriting from an interface such as IERC721 or IEIP2981 is a good way to make sure that you have correctly implemented that ERC standard
- This [unix time converter website](https://www.epochconverter.com/) is a helpful tool for dealing with timestamps in solidity





# Practice Smart Contract #2

************************Requirements************************

*Blue Text = Same requirement as Practice Smart Contract #1*

- Must use ERC721A by Chiru Labs
- Must be able to add multiple contract admins, who can access admin-only functions
- Contract must be pausable by admins (no transfers, mints or burns when contract is paused)
- Must support EIP2981 NFT Royalty Standard
- Must have a public sale that goes for 48 hours or until all tokens are minted
- Must have a maximum supply of 1000
- Tokens must cost 0.01 Ether
- Sale must have a limit of 5 token mints per wallet
- Must have a withdrawal function for admins to withdraw funds from the contract
- Token metadata should be returned on-chain, including the following attributes:
    - Token name (`name`)
    - Token description (`description`)
    - Creator name (`created_by`)
    - Image url (`image`)
    - Animation url (`animation`)
    - A custom attribute which shows how many times that token has been transferred
- The image url and animation url for each token should use the standard base URI method, e.g. [https://api.images.com/](https://api.images.com/) & [https://api.animations.com/](https://api.animation.com/), followed by the token ID

********Tips********

- This smart contract will not have a private sale
- You can read about ERC721A [here](https://www.erc721a.org/)
- ERC721A can be imported into your solidity file via npm using this line:
    
    ```jsx
    import "erc721a/contracts/ERC721A.sol";
    ```
    
- ERC721A has a lot of helpful functions built in - there’s no need to add extensions like `ERC721Burnable` or `ERC721Enumerable`. Have a look through the code and you’ll find lots of internal functions which are helpful for developers. You can view the code for ERC721A at it’s [Github repo](https://github.com/chiru-labs/ERC721A)
- ERC721A automatically increments the token ID when minting new tokens - the mint function now takes a number of tokens to mint instead of the token ID as an argument: `_mint(address to, uint256 quantity)`
- This [tips for ERC721A document](https://www.notion.so/Tips-for-using-ERC721A-f040d5953f0f413896064902d9850179) will help too!
- Learn more about how marketplaces like OpenSea read custom metadata [here](https://docs.opensea.io/docs/2-adding-metadata), and [here](https://docs.opensea.io/docs/contract-level-metadata)
- Learn how to add custom attributes to your token’s metadata [here](https://docs.opensea.io/docs/metadata-standards)
- Here is an example of [a contract which returns metadata on-chain](https://etherscan.io/address/0xa832cab9e0fbf72ede28095a56a4fca866d97dd6#code) using the `tokenURI` function: the important code spans from line 86 to 104
- You can choose the name and description for the tokens
- Check that the json metadata for each token is correctly formatted with this helpful [website](https://jsonformatter.curiousconcept.com/#)