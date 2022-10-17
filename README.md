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