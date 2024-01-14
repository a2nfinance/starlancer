use core::serde::Serde;
use snforge_std::{
    declare, ContractClassTrait, start_prank, stop_prank, start_warp, stop_warp, env::var,
    ContractClass, get_class_hash, cheatcodes
};
use starknet::ContractAddress;
use starlancer::types::{DAODetail};
use super::super::utils::mock_data::{get_mock_addresses, get_mock_platform_fee_roles};

fn deploy_dao_contract(
    name: felt252,
    owner: ContractAddress,
    dao_detail: DAODetail,
    treasury_managers: Array<ContractAddress>,
    member_managers: Array<ContractAddress>,
    project_managers: Array<ContractAddress>,
    job_managers: Array<ContractAddress>,
    platform_fee: ContractAddress
) -> ContractAddress {
    let contract = declare(name);
    let mut calldata = ArrayTrait::new();
    owner.serialize(ref calldata);
    dao_detail.serialize(ref calldata);
    treasury_managers.serialize(ref calldata);
    member_managers.serialize(ref calldata);
    project_managers.serialize(ref calldata);
    job_managers.serialize(ref calldata);
    platform_fee.serialize(ref calldata);

    let contract_address = contract.precalculate_address(@calldata);

    start_prank(cheatcodes::CheatTarget::One(contract_address), owner);
    let deployedContract = contract.deploy(@calldata).unwrap();
    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    deployedContract
}

fn deploy_erc20(
    name: felt252, initial_supply: u256, recipient: ContractAddress,
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

fn deploy_platform_fee() -> ContractAddress {
    let (caller, _, _, _, _) = get_mock_addresses();
    let (admin, fee_recipient) = get_mock_platform_fee_roles();
    let rate_fee: u16 = 50;
    let platform_fee_contract = declare('PlatformFee');

    let mut calldata = ArrayTrait::new();
    rate_fee.serialize(ref calldata);
    admin.serialize(ref calldata);
    fee_recipient.serialize(ref calldata);

    let contract_address = platform_fee_contract.precalculate_address(@calldata);

    start_prank(cheatcodes::CheatTarget::One(contract_address), caller);
    let deployed_contract = platform_fee_contract.deploy(@calldata).unwrap();
    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    deployed_contract
}