import { ethers, network } from "hardhat"

import {
    entryFee,
    isLocalNetwork,
    localNetworkConfig,
    networkConfig,
} from "../helper-hardhat-config"
import { VRFCoordinatorV2Mock } from "../typechain-types/@chainlink/contracts/src/v0.8/mocks/VRFCoordinatorV2Mock"

export default async () => {
    const currentNetwork = networkConfig[network.name] || localNetworkConfig

    let vrfCoordinatorAddress: string
    let subscriptionId: number

    if (isLocalNetwork) {
        const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        )
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = transactionReceipt.events?.[0].args?.[0]
        vrfCoordinatorAddress = vrfCoordinatorV2Mock.address
        await vrfCoordinatorV2Mock.fundSubscription(
            subscriptionId,
            localNetworkConfig.subscriptionAmount
        )
    } else {
        subscriptionId = currentNetwork.subscriptionId
        vrfCoordinatorAddress = currentNetwork.vrfCoordinator
    }

    return {
        subscriptionId,
        args: [
            entryFee,
            vrfCoordinatorAddress,
            currentNetwork.keyHash,
            subscriptionId,
            currentNetwork.callbackGasLimit,
            currentNetwork.interval,
        ],
    }
}
