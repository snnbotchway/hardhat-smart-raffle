export default (size: number) => {
    let randomNumber = ""
    for (let i = 0; i < size; i++) {
        randomNumber = randomNumber.concat((Math.floor(Math.random() * 9) + 1).toString())
    }
    return BigInt(randomNumber)
}
