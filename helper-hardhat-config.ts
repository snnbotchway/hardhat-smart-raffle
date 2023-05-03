import { ethers, network } from "hardhat"

import { LocalNetworkConfig, NetworkConfig } from "./types/networkConfigs"

export const networkConfig: NetworkConfig = {
    sepolia: {
        blockConfirmations: 6,
        vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        subscriptionId: 1637,
        callbackGasLimit: 200000,
        interval: 60 * 60 * 24,
    },
}
export const localNetworkConfig: LocalNetworkConfig = {
    blockConfirmations: 1,
    keyHash: networkConfig.sepolia.keyHash,
    subscriptionAmount: ethers.utils.parseEther("5").toString(),
    callbackGasLimit: networkConfig.sepolia.callbackGasLimit,
    interval: networkConfig.sepolia.interval,
}

export const entryFee = ethers.utils.parseEther("0.1").toString()

const localNetworks = ["hardhat", "localhost"]
export const isLocalNetwork = localNetworks.includes(network.name)

export const mockArgs = {
    baseFee: ethers.utils.parseEther("0.25"),
    gasPriceLink: 1e9,
}
