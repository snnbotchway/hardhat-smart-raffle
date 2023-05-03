import { network } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"

import { HardhatRuntimeEnvironment } from "hardhat/types"

import { isLocalNetwork, localNetworkConfig, networkConfig } from "../helper-hardhat-config"
import { addConsumer, getArgs, verifyContract } from "../utils"

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments,
}: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const currentNetwork = networkConfig[network.name] || localNetworkConfig

    const { args, subscriptionId } = await getArgs()

    const raffle = await deploy("Raffle", {
        from: deployer,
        args,
        log: true,
        waitConfirmations: currentNetwork.blockConfirmations,
    })

    if (isLocalNetwork) {
        await addConsumer(subscriptionId, raffle)
    }

    if (!isLocalNetwork && process.env.ETHERSCAN_API_KEY) {
        await verifyContract(raffle.address, args)
    }
    log("=====================================================================")
}

func.tags = ["raffle"]
export default func
