import fs from "fs-extra"
import { ethers, network } from "hardhat"
import path from "path"

const contractName = "Raffle"
const clientFolderName = "nextjs-smart-raffle"
let constantsPath: string

export default async () => {
    if (!process.env.UPDATE_CLIENT) return

    console.log("Updating Client...")
    constantsPath = path.resolve(__dirname, `../../${clientFolderName}/constants/`)
    const contract = await ethers.getContract(contractName)

    writeAbi()
    writeAddress(contract.address)
    console.log("Client updated successfully!")
}

const writeAbi = () => {
    const abiDir = path.resolve(
        __dirname,
        `../artifacts/contracts/${contractName}.sol/${contractName}.json`
    )
    const abi = fs.readJSONSync(abiDir, "utf8").abi
    fs.outputJSONSync(path.resolve(constantsPath, "abi.json"), abi)
}

const writeAddress = (address: string) => {
    const addressesFile = path.resolve(constantsPath, "contractAddresses.json")

    const contractAddresses = getCurrentAddresses(addressesFile)
    const updatedAddresses = updateAddresses(contractAddresses, address)

    fs.outputJSONSync(addressesFile, updatedAddresses)
}

const getCurrentAddresses = (addressesFile: string) => {
    fs.ensureFileSync(addressesFile)
    let contractAddresses = {}

    try {
        contractAddresses = fs.readJSONSync(addressesFile)
    } catch (error) {
        if (!(error instanceof SyntaxError)) {
            console.log(error)
            process.exit(1)
        }
    }

    return contractAddresses
}

const updateAddresses = (contractAddresses: any, newAddress: string) => {
    const chainId = network.config.chainId!.toString()

    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId].includes(newAddress)) {
            contractAddresses[chainId].push(newAddress)
        }
    } else {
        contractAddresses[chainId] = [newAddress]
    }

    return contractAddresses
}