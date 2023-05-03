import "dotenv/config"
import "hardhat-deploy"
import "hardhat-gas-reporter"
import "solidity-coverage"

import { HardhatUserConfig } from "hardhat/config"

import "@nomicfoundation/hardhat-toolbox"

import "@nomiclabs/hardhat-etherscan"
import "@nomiclabs/hardhat-solhint"

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || ""
const PRIVATE_KEY =
    process.env.PRIVATE_KEY || "1111111111111111111111111111111111111111111111111111111111111111"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

const config: HardhatUserConfig = {
    solidity: "0.8.18",
    networks: {
        localhost: {
            url: "http://localhost:8545",
            chainId: 31337,
        },
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: true,
        outputFile: "gasReport.txt",
        noColors: true,
        currency: "GHS",
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "MATIC",
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    mocha: {
        timeout: 3600000,
    },
}

export default config
