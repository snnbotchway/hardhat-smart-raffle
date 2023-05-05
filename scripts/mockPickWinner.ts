import { BigNumber } from "ethers"
import { ethers } from "hardhat"

import { isLocalNetwork } from "../helper-hardhat-config"
import { Raffle, VRFCoordinatorV2Mock } from "../typechain-types"

async function mockKeepers() {
    if (!isLocalNetwork) {
        console.log("Not a local network! Exiting...")
        process.exit(1)
    }

    const raffle: Raffle = await ethers.getContract("Raffle")
    const [upkeepNeeded] = await raffle.callStatic.checkUpkeep([])

    if (upkeepNeeded) {
        const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        )

        await new Promise<void>(async () => {
            vrfCoordinatorV2Mock.once("RandomWordsRequested", async (_, requestId) => {
                console.log("Coordinator created a new request with ID:", requestId.toString())
                await mockVrf(requestId, raffle, vrfCoordinatorV2Mock)
            })

            const tx = await raffle.performUpkeep([])
            console.log("Perform Upkeep called successfully")
            await tx.wait(1)
            console.log("Waiting for the random number...")
        })
    } else {
        console.log("No upkeep needed!")
    }
}

async function mockVrf(
    requestId: BigNumber,
    raffle: Raffle,
    vrfCoordinatorV2Mock: VRFCoordinatorV2Mock
) {
    console.log("Fulfilling random words...")

    await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, raffle.address)
    console.log("Random words fulfilled!")

    const recentWinner = await raffle.getRecentWinner()
    console.log(`The winner is: ${recentWinner}`)
}

mockKeepers().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
