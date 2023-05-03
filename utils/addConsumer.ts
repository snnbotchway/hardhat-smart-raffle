import { ethers } from "hardhat"
import { DeployResult } from "hardhat-deploy/types"

import { VRFCoordinatorV2Mock } from "../typechain-types"

export default async (subscriptionId: number, contract: DeployResult) => {
    const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract(
        "VRFCoordinatorV2Mock"
    )
    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, contract.address)
}
