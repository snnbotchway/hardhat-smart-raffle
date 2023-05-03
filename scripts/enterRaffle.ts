import { ethers, getNamedAccounts } from "hardhat"

import { entryFee } from "../helper-hardhat-config"
import { Raffle } from "../typechain-types"

async function main() {
    const { deployer } = await getNamedAccounts()
    const raffle: Raffle = await ethers.getContract("Raffle", deployer)
    console.log(`Got contract Raffle at ${raffle.address}`)
    console.log("Entering raffle...")
    const transactionResponse = await raffle.enterRaffle({
        value: entryFee,
    })
    await transactionResponse.wait()
    console.log("Entered Raffle!")
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
