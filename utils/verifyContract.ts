import { run } from "hardhat"

export default async (contractAddress: string, args: any[]) => {
    console.log("\nVerifying contract...")

    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (err: any) {
        if (err.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified!")
        } else {
            console.error(err)
        }
    }
}
