use core::serde::Serde;
use snforge_std::{
    declare, ContractClassTrait, start_prank, stop_prank, start_warp, stop_warp, env::var,
    ContractClass, get_class_hash, cheatcodes
};
use starknet::ContractAddress;

fn deploy_stream_contract(
    deployer: ContractAddress
) -> ContractAddress {
    let contract = declare('CryptoStream');
    let mut calldata = ArrayTrait::new();

    let contract_address = contract.precalculate_address(@calldata);

    start_prank(cheatcodes::CheatTarget::One(contract_address), deployer);
    let deployedContract = contract.deploy(@calldata).unwrap();
    stop_prank(cheatcodes::CheatTarget::One(contract_address));
    deployedContract
}

fn deploy_erc20(
    initial_supply: felt252, recipient: ContractAddress,
) -> ContractAddress {
    let contract = declare('MockERC20');
    let mut calldata = ArrayTrait::new();
    initial_supply.serialize(ref calldata);
    recipient.serialize(ref calldata);
    let contract_address = contract.precalculate_address(@calldata);

    start_prank(cheatcodes::CheatTarget::One(contract_address), recipient);
    let deployedContract = contract.deploy(@calldata).unwrap();
    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    deployedContract
}
