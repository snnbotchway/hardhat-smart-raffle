// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

error Raffle__InsufficientEntryFee(uint256);
error Raffle__PickWinnerFailed();
error Raffle__NotOpen();
error Raffle__UpkeepNotNeeded(
    uint256 raffleState,
    uint256 playerCount,
    uint256 blockTimeStamp,
    uint256 contractBalance
);

/**
 * @title A lottery contract
 * @author Solomon Botchway @snnbotchway
 * @notice Anyone can enter and a random winner is chosen after the set interval
 * @dev This contract makes use of Chainlink VRF for randomness
 * @dev It also makes use of Chainlink Automation for picking the winner after the interval
 */
contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    /* Type declarations */
    enum RaffleState {
        Open,
        PickingWinner
    }

    /* State variables */
    address[] private s_players;
    uint256 private s_lastTimeStamp = block.timestamp;
    uint256 private immutable i_entryFee;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_keyHash;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint256 private immutable i_interval;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Lottery variables
    address private s_recentWinner;
    RaffleState private s_raffleState;

    /* Events */
    event RaffleEntered(address indexed player);
    event WinnerPicked(address indexed winner);

    /**
     *
     * @param entryFee The required entry fee for the lottery
     * @param vrfCoordinator The address of the VRF Coordinator
     * @param keyHash  The gas lane key hash value, which is the maximum gas price you are willing
     * to pay for a request in wei. It functions as an ID of the off-chain VRF job that runs in
     * response to requests
     * @param subscriptionId The subscription ID that this contract uses for funding requests
     * @param callbackGasLimit The limit for how much gas to use for the callback request to your
     * contract’s fulfillRandomWords() function
     * @param interval The time to wait between picking winners
     */
    constructor(
        uint256 entryFee,
        address vrfCoordinator,
        bytes32 keyHash,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinator) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_entryFee = entryFee;
        i_keyHash = keyHash;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        i_interval = interval;
        s_raffleState = RaffleState.Open;
    }

    /**
     * @notice To enter the lottery, you must pay the entry fee and the lottery should be open
     */
    function enterRaffle() external payable {
        if (msg.value < i_entryFee) revert Raffle__InsufficientEntryFee(msg.value);
        if (s_raffleState != RaffleState.Open) revert Raffle__NotOpen();

        s_players.push(msg.sender);

        emit RaffleEntered(msg.sender);
    }

    /**
     * @notice method which triggers the picking of a winner between each interval.
     * @dev It is simulated by the keepers to determine whether to execute performUpkeep.
     * @return upkeepNeeded boolean to indicate whether the keeper should call
     * performUpkeep or not.
     */
    function checkUpkeep(
        bytes memory /* checkData */
    ) public view override returns (bool, bytes memory) {
        return (
            s_raffleState == RaffleState.Open &&
                s_players.length > 0 &&
                (block.timestamp - s_lastTimeStamp) > i_interval,
            ""
        );
    }

    /**
     * @dev This function is executed by the keepers when checkUpkeep returns true
     */
    function performUpkeep(bytes calldata /* performData */) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded)
            revert Raffle__UpkeepNotNeeded(
                uint256(s_raffleState),
                s_players.length,
                block.timestamp,
                address(this).balance
            );

        s_raffleState = RaffleState.PickingWinner;

        i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
    }

    /**
     * @notice method which handles the VRF response.
     * @notice the method picks a random winner and sends it the contract balance.
     * @param randomWords the VRF output (The random numbers).
     */
    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        address winner = s_players[randomWords[0] % s_players.length];
        s_recentWinner = winner;
        s_raffleState = RaffleState.Open;
        s_players = new address[](0);
        s_lastTimeStamp = block.timestamp;

        (bool success, ) = payable(winner).call{value: address(this).balance}("");
        if (!success) revert Raffle__PickWinnerFailed();

        emit WinnerPicked(winner);
    }

    function getPlayerCount() public view returns (uint256) {
        return s_players.length;
    }

    function getEntryFee() external view returns (uint256) {
        return i_entryFee;
    }

    function getRecentWinner() external view returns (address) {
        return s_recentWinner;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getVRFCoordinator() public view returns (VRFCoordinatorV2Interface) {
        return i_vrfCoordinator;
    }

    function getKeyHash() public view returns (bytes32) {
        return i_keyHash;
    }

    function getSubscriptionId() public view returns (uint64) {
        return i_subscriptionId;
    }

    function getCallbackGasLimit() public view returns (uint32) {
        return i_callbackGasLimit;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getNumWords() public pure returns (uint32) {
        return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS;
    }
}
