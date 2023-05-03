import { expect } from "chai"
import { BigNumber } from "ethers"
import { deployments, ethers } from "hardhat"

import { isLocalNetwork } from "../../helper-hardhat-config"
import { entryFee } from "../../helper-hardhat-config"
import { Raffle } from "../../typechain-types"
import { RaffleState } from "../unit/fixtures"

isLocalNetwork
    ? describe.skip
    : describe("Raffle Staging Tests", () => {
          const deployRaffle = async () => {
              const [deployer] = await ethers.getSigners()

              await deployments.all()
              const raffle: Raffle = await ethers.getContract("Raffle", deployer)

              return { raffle, deployer }
          }

          it("Allows players to enter and picks a winner after the interval and so on", async () => {
              const { raffle, deployer } = await deployRaffle()
              let initialPlayerBalance: BigNumber

              await new Promise<void>(async () => {
                  raffle.on("WinnerPicked", async (winner) => {
                      console.log("Winner Picked:", winner)
                      const expectedPlayerCount = 0
                      const actualPlayerCount = await raffle.getPlayerCount()
                      expect(expectedPlayerCount).to.equal(actualPlayerCount)

                      const expectedRaffleState = RaffleState.Open
                      const actualRaffleState = await raffle.getRaffleState()
                      expect(expectedRaffleState).to.equal(actualRaffleState)

                      const finalPlayerBalance = await deployer.getBalance()
                      expect(finalPlayerBalance).to.equal(initialPlayerBalance.add(entryFee))
                      expect(winner).to.equal(deployer.address)
                      console.log("He got the money back!")

                      console.log("===============================================================")
                      console.log(`${deployer.address} is entering the Raffle again...`)
                      const tx = await raffle.enterRaffle({ value: entryFee })
                      await tx.wait(1)
                      initialPlayerBalance = await deployer.getBalance()
                      console.log("Waiting for the WinnerPicked event...")
                  })

                  console.log("===============================================================")
                  console.log(`${deployer.address} is entering the Raffle...`)
                  const tx = await raffle.enterRaffle({
                      value: entryFee,
                  })
                  await tx.wait(1)
                  console.log("Waiting for the WinnerPicked event...")
                  initialPlayerBalance = await deployer.getBalance()
              })
          })
      })
