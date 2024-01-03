use core::traits::Into;
use core::serde::Serde;
use starlancer::dao_contract::IDAODispatcherTrait;
use starlancer::dao_contract::IDAODispatcher;
use starlancer::types::{MemberRoles};

use snforge_std::{
    declare, ContractClassTrait, start_prank, stop_prank, start_warp, stop_warp, env::var,
    ContractClass, get_class_hash, cheatcodes
};

use starknet::ContractAddress;


use super::contract::{deploy_contract, get_important_addresses};

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

