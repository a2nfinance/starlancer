use core::traits::Into;
use starlancer::contracts::dao_contract::IDAODispatcherTrait;
use starlancer::contracts::dao_factory::IDAOFactoryDispatcherTrait;
use core::serde::Serde;
use snforge_std::{
    declare, ContractClassTrait, start_prank, stop_prank, start_warp, stop_warp, env::var,
    ContractClass, get_class_hash, cheatcodes
};
use starknet::{ContractAddress, get_contract_address, ClassHash};
use super::super::utils::mock_data::{get_mock_addresses, get_mock_platform_fee_roles};
use super::super::utils::contract_deployer::{deploy_platform_fee};
use starlancer::contracts::dao_factory::IDAOFactoryDispatcher;
use starlancer::contracts::dao_contract::IDAODispatcher;
use starlancer::types::{DAODetail, MemberRoles, TextStruct};

fn get_textstruct_test(value: felt252) -> TextStruct {
    TextStruct { text0: value, text1: '', text2: '', text3: '', text4: '', text5: '' }
}


fn deploy_dao_factory() -> ContractAddress {
    let (caller, _, _, _, _) = get_mock_addresses();
    let platform_fee: ContractAddress = deploy_platform_fee();
    let dao_factory_contract = declare('DAOFactory');
    let dao_contract = declare('DAO');
    let dao_contract_hash: ClassHash = dao_contract.class_hash;
    let mut calldata = ArrayTrait::new();

    dao_contract_hash.serialize(ref calldata);
    caller.serialize(ref calldata);
    platform_fee.serialize(ref calldata);

    let contract_address = dao_factory_contract.precalculate_address(@calldata);

    start_prank(cheatcodes::CheatTarget::One(contract_address), caller);
    let deployed_contract = dao_factory_contract.deploy(@calldata).unwrap();
    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    deployed_contract
}

#[test]
fn test_deploy_dao_factory() {
    let (caller, _, _, _, _) = get_mock_addresses();
    let dao_factory_address: ContractAddress = deploy_dao_factory();
    let dao_factory_dispatcher: IDAOFactoryDispatcher = IDAOFactoryDispatcher {
        contract_address: dao_factory_address
    };
    start_prank(cheatcodes::CheatTarget::One(dao_factory_address), caller);
    let owner: ContractAddress = dao_factory_dispatcher.get_owner();
    stop_prank(cheatcodes::CheatTarget::One(dao_factory_address));

    assert(owner == caller, 'DAO Factory & wrong contructor');
}

#[test]
fn test_create_dao() {
    let (caller, treasury_manager, member_manager, project_manager, job_manager) =
        get_mock_addresses();
    let dao_factory_address: ContractAddress = deploy_dao_factory();
    let dao_factory_dispatcher: IDAOFactoryDispatcher = IDAOFactoryDispatcher {
        contract_address: dao_factory_address
    };
    start_prank(cheatcodes::CheatTarget::One(dao_factory_address), caller);
    let deployed_contract = dao_factory_dispatcher
        .create_dao(
            DAODetail {
                name: get_textstruct_test('Test DAO'),
                detail: get_textstruct_test('https://google.com'),
                short_description: get_textstruct_test('Short description'),
                social_networks: get_textstruct_test('social networks'),
            },
            array![treasury_manager],
            array![member_manager],
            array![project_manager],
            array![job_manager]
        );
    let dao_dispatcher: IDAODispatcher = IDAODispatcher { contract_address: deployed_contract };
    let dao_detail: DAODetail = dao_dispatcher.get_dao_detail().into();
    stop_prank(cheatcodes::CheatTarget::One(dao_factory_address));

    assert(dao_detail.name.text0 == 'Test DAO', 'Not create DAO success');
}

