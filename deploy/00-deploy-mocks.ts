import { network } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"

import { HardhatRuntimeEnvironment } from "hardhat/types"

import { isLocalNetwork, mockArgs } from "../helper-hardhat-config"

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments,
}: HardhatRuntimeEnvironment) => {
    if (!isLocalNetwork) return

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const { baseFee, gasPriceLink } = mockArgs

    log("=====================================================================")
    log(`Development network(${network.name}) detected! Deploying mocks...`)
    await deploy("VRFCoordinatorV2Mock", {
        from: deployer,
        log: true,
        args: [baseFee, gasPriceLink],
    })
    log("=====================================================================")
}

func.tags = ["mocks"]
export default func
