export interface NetworkConfig {
    [networkName: string]: {
        blockConfirmations: number
        vrfCoordinator: string
        keyHash: string
        subscriptionId: number
        callbackGasLimit: number
        interval: number
    }
}

export interface LocalNetworkConfig {
    blockConfirmations: number
    keyHash: string
    callbackGasLimit: number
    interval: number
    subscriptionAmount: string
}
