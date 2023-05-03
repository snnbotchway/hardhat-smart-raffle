import { expect } from "chai"
import { deployments, ethers } from "hardhat"

import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"

import { entryFee, localNetworkConfig } from "../../helper-hardhat-config"
import { Raffle, VRFCoordinatorV2Mock } from "../../typechain-types"
import { generateRandomNumber } from "../../utils"

export const deployRaffle = async () => {
    const accounts = await ethers.getSigners()
    const [deployer, otherAccount] = accounts

    await deployments.fixture()
    const deployTimeStamp = await time.latest()

    const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract(
        "VRFCoordinatorV2Mock",
        deployer
    )
    const raffle: Raffle = await ethers.getContract("Raffle", deployer)

    return {
        raffle,
        vrfCoordinatorV2Mock,
        accounts,
        deployer,
        otherAccount,
        deployTimeStamp,
    }
}

export const prePerformUpkeep = async () => {
    const { raffle, accounts, vrfCoordinatorV2Mock } = await loadFixture(deployRaffle)

    for (let account of accounts) {
        await raffle.connect(account).enterRaffle({ value: entryFee })
    }
    await time.increase(localNetworkConfig.interval)
    const initialState = await raffle.getRaffleState()
    expect(initialState).to.equal(0)

    return { raffle, vrfCoordinatorV2Mock, accounts }
}
export const performUpkeep = async () => {
    const { raffle, vrfCoordinatorV2Mock, accounts } = await loadFixture(prePerformUpkeep)

    await raffle.performUpkeep([])

    return { raffle, vrfCoordinatorV2Mock, accounts }
}

export const preFulfillRandomWords = async () => {
    const { raffle, vrfCoordinatorV2Mock, accounts } = await loadFixture(performUpkeep)
    const randomNumber = generateRandomNumber(77) // ChainLink VRF Coordinator generates 77 long numbers
    const playerCount = await raffle.getPlayerCount()
    const indexOfWinner = randomNumber % BigInt(playerCount.toString())
    const expectedWinner = accounts[Number(indexOfWinner)]

    const initialRecentWinner = await raffle.getRecentWinner()
    expect(initialRecentWinner).to.equal(ethers.constants.AddressZero)

    const initialState = await raffle.getRaffleState()
    expect(initialState).to.equal(1) // Picking winner

    return { raffle, expectedWinner, vrfCoordinatorV2Mock, randomNumber, accounts }
}
export const fulfillRandomWords = async () => {
    const { raffle, vrfCoordinatorV2Mock, randomNumber, expectedWinner } = await loadFixture(
        preFulfillRandomWords
    )

    await vrfCoordinatorV2Mock.fulfillRandomWordsWithOverride(1, raffle.address, [randomNumber])

    return { raffle, expectedWinner }
}

export enum RaffleState {
    Open,
    PickingWinner,
}
