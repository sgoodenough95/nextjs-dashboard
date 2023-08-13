require("@nomicfoundation/hardhat-toolbox");
require("hardhat-diamond-abi");
require("dotenv").config();

const { INFURA_API_KEY, PRIV_KEY, OPT_SCAN_API_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  diamondAbi: {
    name: "App",
    strict: false
  },
  networks: {
    ethereum: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [`${PRIV_KEY}`]
    },
    optimisticEthereum: {
      url: `https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [`${PRIV_KEY}`]
    },
    hardhat: {
      forking: {
        url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`
      }
    }
  },
  etherscan: {
    apiKey: {
      optimisticEthereum: `${OPT_SCAN_API_KEY}`
    }
  }
};
