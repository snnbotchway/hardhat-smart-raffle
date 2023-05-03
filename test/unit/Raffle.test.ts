import { expect } from "chai"
import { ethers } from "hardhat"

import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"

import { entryFee, isLocalNetwork, localNetworkConfig } from "../../helper-hardhat-config"
import {
    RaffleState,
    deployRaffle,
    fulfillRandomWords,
    performUpkeep,
    preFulfillRandomWords,
    prePerformUpkeep,
} from "./fixtures"

!isLocalNetwork
    ? describe.skip
    : describe("Raffle Unit Tests", () => {
          describe("Deployment", () => {
              it("Sets the right entryFee", async () => {
                  const { raffle } = await loadFixture(deployRaffle)

                  expect(await raffle.getEntryFee()).to.equal(entryFee)
              })

              it("Has no players initially", async () => {
                  const { raffle } = await loadFixture(deployRaffle)

                  const expectedPlayerCount = 0
                  expect(await raffle.getPlayerCount()).to.equal(expectedPlayerCount)
              })

              it("Sets the raffle to the Open state", async () => {
                  const { raffle } = await loadFixture(deployRaffle)

                  expect(await raffle.getRaffleState()).to.equal(RaffleState.Open)
              })

              it("Sets the right VRF Coordinator address", async () => {
                  const { raffle, vrfCoordinatorV2Mock } = await loadFixture(deployRaffle)

                  expect(await raffle.getVRFCoordinator()).to.equal(vrfCoordinatorV2Mock.address)
              })

              it("Sets the recent winner to address 0", async () => {
                  const { raffle } = await loadFixture(deployRaffle)

                  expect(await raffle.getRecentWinner()).to.equal(ethers.constants.AddressZero)
              })

              it("Sets the right keyHash", async () => {
                  const { raffle } = await loadFixture(deployRaffle)

                  expect(await raffle.getKeyHash()).to.equal(localNetworkConfig.keyHash)
              })

              it("Sets the right callback gas limit", async () => {
                  const { raffle } = await loadFixture(deployRaffle)

                  expect(await raffle.getCallbackGasLimit()).to.equal(
                      localNetworkConfig.callbackGasLimit
                  )
              })

              it("Sets the right interval", async () => {
                  const { raffle } = await loadFixture(deployRaffle)

                  expect(await raffle.getInterval()).to.equal(localNetworkConfig.interval)
              })

              it("Sets the number of words to 1", async () => {
                  const { raffle } = await loadFixture(deployRaffle)

                  expect(await raffle.getNumWords()).to.equal(1)
              })

              it("Sets the request confirmations to 3", async () => {
                  const { raffle } = await loadFixture(deployRaffle)

                  expect(await raffle.getRequestConfirmations()).to.equal(3)
              })

              it("Sets the last timestamp to the deploy timestamp", async () => {
                  const { raffle, deployTimeStamp } = await loadFixture(deployRaffle)

                  const latestTimeStamp = await raffle.getLastTimeStamp()
                  expect(latestTimeStamp).to.be.closeTo(deployTimeStamp, 1)
              })
          })

          describe("Enter Raffle", () => {
              it("Adds the caller to the players", async () => {
                  const { raffle, deployer } = await loadFixture(deployRaffle)

                  await raffle.enterRaffle({ value: entryFee })

                  expect(await raffle.getPlayerCount()).to.equal(1)
                  expect(await raffle.getPlayer(0)).to.equal(deployer.address)
              })

              it("Reverts if msg.value is less than entry fee", async () => {
                  const { raffle } = await loadFixture(deployRaffle)
                  const lessThanEntryFee = (+entryFee - 100).toString()

                  await expect(raffle.enterRaffle({ value: lessThanEntryFee }))
                      .to.be.revertedWithCustomError(raffle, "Raffle__InsufficientEntryFee")
                      .withArgs(lessThanEntryFee)
              })

              it("Reverts if a winner is being picked", async () => {
                  const { raffle } = await loadFixture(deployRaffle)
                  await raffle.enterRaffle({ value: entryFee })
                  await time.increase(localNetworkConfig.interval)
                  await raffle.performUpkeep([])

                  await expect(
                      raffle.enterRaffle({ value: entryFee })
                  ).to.be.revertedWithCustomError(raffle, "Raffle__NotOpen")
              })

              it("Emits the RaffleEntered event", async () => {
                  const { raffle, deployer } = await loadFixture(deployRaffle)

                  await expect(raffle.enterRaffle({ value: entryFee }))
                      .to.emit(raffle, "RaffleEntered")
                      .withArgs(deployer.address)
              })
          })

          describe("Check Upkeep", () => {
              it("Returns true if raffle is open, enough time has passed and has players", async () => {
                  const { raffle } = await loadFixture(deployRaffle)
                  await raffle.enterRaffle({ value: entryFee })
                  await time.increase(localNetworkConfig.interval)

                  const [upkeepNeeded] = await raffle.callStatic.checkUpkeep([])
                  expect(upkeepNeeded).to.be.true
              })

              it("Return false if raffle is picking a winner", async () => {
                  const { raffle } = await loadFixture(deployRaffle)
                  await raffle.enterRaffle({ value: entryFee })
                  await time.increase(localNetworkConfig.interval)
                  await raffle.performUpkeep([])

                  const [upkeepNeeded] = await raffle.callStatic.checkUpkeep([])
                  expect(upkeepNeeded).to.be.false
                  expect(await raffle.getRaffleState()).to.equal(RaffleState.PickingWinner)
              })

              it("Returns false if there's no player", async () => {
                  const { raffle } = await loadFixture(deployRaffle)
                  await time.increase(localNetworkConfig.interval)

                  const [upkeepNeeded] = await raffle.callStatic.checkUpkeep([])
                  expect(upkeepNeeded).to.be.false
                  expect(await raffle.getPlayerCount()).to.equal(0)
              })

              it("Returns false if the interval is not up", async () => {
                  const { raffle } = await loadFixture(deployRaffle)
                  await raffle.enterRaffle({ value: entryFee })

                  const [upkeepNeeded] = await raffle.callStatic.checkUpkeep([])
                  expect(upkeepNeeded).to.be.false
              })
          })

          describe("Perform Upkeep", () => {
              it("Triggers the RandomWordsRequested event on the VRF Coordinator", async () => {
                  const { raffle, vrfCoordinatorV2Mock } = await loadFixture(prePerformUpkeep)
                  const expectedKeyHash = localNetworkConfig.keyHash
                  const expectedRequestId = 1 // The request IDs start from 1
                  const expectedPreSeed = 100 // The preSeeds start from 100
                  const expectedSubscriptionId = await raffle.getSubscriptionId()
                  const expectedRequestConfirmations = await raffle.getRequestConfirmations()
                  const expectedCallbackGasLimit = await raffle.getCallbackGasLimit()
                  const expectedNumWords = await raffle.getNumWords()
                  const expectedMsgSender = raffle.address

                  await expect(raffle.performUpkeep([]))
                      .to.emit(vrfCoordinatorV2Mock, "RandomWordsRequested")
                      .withArgs(
                          expectedKeyHash,
                          expectedRequestId,
                          expectedPreSeed,
                          expectedSubscriptionId,
                          expectedRequestConfirmations,
                          expectedCallbackGasLimit,
                          expectedNumWords,
                          expectedMsgSender
                      )
              })

              it("Sets the Raffle state to PickingWinner", async () => {
                  const { raffle } = await loadFixture(performUpkeep)

                  const finalState = await raffle.getRaffleState()
                  expect(finalState).to.equal(RaffleState.PickingWinner)
              })

              it("Reverts if a winner is being picked", async () => {
                  const { raffle } = await loadFixture(deployRaffle)
                  await raffle.enterRaffle({ value: entryFee })
                  await time.increase(localNetworkConfig.interval)
                  await raffle.performUpkeep([])
                  const expectedRaffleState = RaffleState.PickingWinner
                  const expectedPlayerCount = 1
                  const expectedTimeStamp = await time.latest()
                  const expectedContractBalance = entryFee

                  await expect(raffle.performUpkeep([]))
                      .to.be.revertedWithCustomError(raffle, "Raffle__UpkeepNotNeeded")
                      .withArgs(
                          expectedRaffleState,
                          expectedPlayerCount,
                          expectedTimeStamp + 1, // the block timestamp
                          expectedContractBalance
                      )
              })

              it("Reverts if there's no player", async () => {
                  const { raffle } = await loadFixture(deployRaffle)
                  await time.increase(localNetworkConfig.interval)
                  const expectedRaffleState = RaffleState.Open
                  const expectedPlayerCount = 0
                  const expectedTimeStamp = await time.latest()
                  const expectedContractBalance = 0

                  await expect(raffle.performUpkeep([]))
                      .to.be.revertedWithCustomError(raffle, "Raffle__UpkeepNotNeeded")
                      .withArgs(
                          expectedRaffleState,
                          expectedPlayerCount,
                          expectedTimeStamp + 1, // the block timestamp
                          expectedContractBalance
                      )
              })

              it("Reverts if the interval is not up", async () => {
                  const { raffle } = await loadFixture(deployRaffle)
                  await raffle.enterRaffle({ value: entryFee })
                  const expectedRaffleState = RaffleState.Open
                  const expectedPlayerCount = 1
                  const expectedTimeStamp = await time.latest()
                  const expectedContractBalance = entryFee

                  await expect(raffle.performUpkeep([]))
                      .to.be.revertedWithCustomError(raffle, "Raffle__UpkeepNotNeeded")
                      .withArgs(
                          expectedRaffleState,
                          expectedPlayerCount,
                          expectedTimeStamp + 1, // the block timestamp
                          expectedContractBalance
                      )
              })
          })

          describe("Fulfill Random Words", () => {
              it("Sets the picked winner as the recent winner", async () => {
                  const { raffle, expectedWinner } = await loadFixture(fulfillRandomWords)

                  const finalRecentWinner = await raffle.getRecentWinner()
                  expect(expectedWinner.address).to.equal(finalRecentWinner)
              })

              it("Sets the raffle to the Open state", async () => {
                  const { raffle } = await loadFixture(fulfillRandomWords)

                  const finalState = await raffle.getRaffleState()
                  expect(finalState).to.equal(RaffleState.Open)
              })

              it("Resets the players array", async () => {
                  const { raffle } = await loadFixture(fulfillRandomWords)

                  const expectedPlayerCount = 0
                  const finalPlayerCount = await raffle.getPlayerCount()
                  expect(expectedPlayerCount).to.equal(finalPlayerCount)
              })

              it("Sets the latest timestamp to the block timestamp", async () => {
                  const { raffle } = await loadFixture(fulfillRandomWords)

                  const expectedTimeStamp = await time.latest()
                  const latestTimeStamp = await raffle.getLastTimeStamp()
                  expect(expectedTimeStamp).to.equal(latestTimeStamp)
              })

              it("Sends the winner the contract balance", async () => {
                  const { raffle, randomNumber, vrfCoordinatorV2Mock, expectedWinner, accounts } =
                      await loadFixture(preFulfillRandomWords)
                  const contractBalance = await ethers.provider.getBalance(raffle.address)
                  const totalAmountSent = BigInt(entryFee) * BigInt(accounts.length)

                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWordsWithOverride(1, raffle.address, [
                          randomNumber,
                      ])
                  ).to.changeEtherBalances(
                      [expectedWinner, raffle],
                      [contractBalance, -totalAmountSent]
                  )
              })

              it("Emits the WinnerPicked event", async () => {
                  const { raffle, randomNumber, vrfCoordinatorV2Mock, expectedWinner } =
                      await loadFixture(preFulfillRandomWords)

                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWordsWithOverride(1, raffle.address, [
                          randomNumber,
                      ])
                  )
                      .to.emit(raffle, "WinnerPicked")
                      .withArgs(expectedWinner.address)
              })
          })
      })
