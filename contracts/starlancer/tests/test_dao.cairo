use starlancer::dao_contract::IDAODispatcherTrait;
use core::serde::Serde;
use starlancer::dao::member::IMemberDispatcher;
use starlancer::dao_contract::IDAODispatcher;
use starlancer::types::{DAOStatistics, MemberRoles};
use snforge_std::{
    declare, ContractClassTrait, start_prank, stop_prank, start_warp, stop_warp, env::var,
    ContractClass, get_class_hash, cheatcodes
};
use starknet::ContractAddress;

fn deploy_contract(
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

    start_prank(cheatcodes::CheatTarget::One(contract_address), owner.try_into().unwrap());
    let deployedContract = contract.deploy(@calldata).unwrap();
    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    deployedContract
}

fn get_important_addresses() -> (
    ContractAddress, ContractAddress, ContractAddress, ContractAddress, ContractAddress,
) {
    let caller: ContractAddress = 0x048242eca329a05af1909fa79cb1f9a4275ff89b987d405ec7de08f73b85588f
        .try_into()
        .unwrap();
    let project_manager: ContractAddress = caller;
    let job_manager: ContractAddress = caller;
    let member_manager: ContractAddress = caller;
    let treasury_manager: ContractAddress = caller;
    return (caller, project_manager, job_manager, member_manager, treasury_manager);
}

#[test]
fn test_deploy_dao() {
    let (caller, project_manager, job_manager, member_manager, treasury_manager) =
        get_important_addresses();
    let contract_address = deploy_contract(
        'DAO',
        caller,
        array![treasury_manager],
        array![member_manager],
        array![project_manager],
        array![job_manager]
    );
    let dao_dispatcher: IDAODispatcher = IDAODispatcher { contract_address };

    let member_roles: MemberRoles = dao_dispatcher.get_member_roles(job_manager);

    assert(member_roles.is_job_manager, 'Is not job manager');
}
