pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";

contract HelperConfig is Script {
    struct NetworkConfig {
        // address link;
        address router;
        uint64 chainSelector;
        address rmnProxy;
        address tokenAdminRegistry;
        address registryModuleOwnerCustom;
    }

    NetworkConfig public arbitrumSepoliaConfig;
    NetworkConfig public avalancheFujiConfig;

    constructor() {
        // arbitrumSepoliaConfig = getArbitrumSepoliaConfig();
        // avalancheFujiConfig = getAvalancheFujiConfig();
    }

    function getArbitrumSepoliaConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            // link: 0x779877A7B0D9E8603169DdbD7836e478b4624789,
            router: 0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165,
            chainSelector: 3478487238524512106,
            rmnProxy: 0x9527E2d01A3064ef6b50c1Da1C0cC523803BCFF2,
            tokenAdminRegistry: 0x8126bE56454B628a88C17849B9ED99dd5a11Bd2f,
            registryModuleOwnerCustom: 0xE625f0b8b0Ac86946035a7729Aba124c8A64cf69
        });
    }

    function getAvalancheFujiConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            // link: 0x0b9d5d9136855f6fec3c099375e11a84cae46008,
            router: 0xF694E193200268f9a4868e4Aa017A0118C9a8177,
            chainSelector: 14767482510784806043,
            rmnProxy: 0xAc8CFc3762a979628334a0E4C1026244498E821b,
            tokenAdminRegistry: 0xA92053a4a3922084d992fD2835bdBa4caC6877e6,
            registryModuleOwnerCustom: 0x97300785aF1edE1343DB6d90706A35CF14aA3d81
        });
    }
}
