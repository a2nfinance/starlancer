use core::serde::Serde;
use snforge_std::{
    declare, ContractClassTrait, start_prank, stop_prank, start_warp, stop_warp, env::var,
    ContractClass, get_class_hash, cheatcodes
};
use starknet::ContractAddress;

fn deploy_dao_contract(
    name: felt252,
    owner: ContractAddress,
    treasury_managers: Array<ContractAddress>,
    member_managers: Array<ContractAddress>,
    project_managers: Array<ContractAddress>,
    job_managers: Array<ContractAddress>
) -> ContractAddress {
    let contract = declare(name);
    let mut calldata = ArrayTrait::new();
    owner.serialize(ref calldata);
    treasury_managers.serialize(ref calldata);
    member_managers.serialize(ref calldata);
    project_managers.serialize(ref calldata);
    job_managers.serialize(ref calldata);

    // Precalculate the address to obtain the contract address before the constructor call (deploy) itself
    let contract_address = contract.precalculate_address(@calldata);

    start_prank(cheatcodes::CheatTarget::One(contract_address), owner);
    let deployedContract = contract.deploy(@calldata).unwrap();
    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    deployedContract
}

fn deploy_erc20(
    name: felt252, initial_supply: felt252, recipient: ContractAddress,
) -> ContractAddress {
    let contract = declare('MockERC20');
    let mut calldata = ArrayTrait::new();
    initial_supply.serialize(ref calldata);
    recipient.serialize(ref calldata);

    // Precalculate the address to obtain the contract address before the constructor call (deploy) itself
    let contract_address = contract.precalculate_address(@calldata);

    start_prank(cheatcodes::CheatTarget::One(contract_address), recipient);
    let deployedContract = contract.deploy(@calldata).unwrap();
    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    deployedContract
}
