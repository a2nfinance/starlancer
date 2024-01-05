use starknet::ContractAddress;
use starlancer::dao::project::IDAOProjectDispatcherTrait;
use starlancer::dao::project::IDAOProjectDispatcher;
use starlancer::types::{Job, Project};
use snforge_std::{
    declare, ContractClassTrait, start_prank, stop_prank, start_warp, stop_warp, env::var,
    ContractClass, get_class_hash, cheatcodes
};

use starlancer_tests::utils::contract_deployer::{deploy_dao_contract};
use starlancer_tests::utils::mock_data::{get_mock_addresses};

#[test]
fn test_create_project() {
    let (caller, project_manager, job_manager, member_manager, treasury_manager) =
        get_mock_addresses();
    let contract_address = deploy_dao_contract(
        'DAO',
        caller,
        array![treasury_manager],
        array![member_manager],
        array![project_manager],
        array![job_manager]
    );

    start_prank(cheatcodes::CheatTarget::One(contract_address), project_manager);

    let dao_project_dispatcher: IDAOProjectDispatcher = IDAOProjectDispatcher { contract_address };
    dao_project_dispatcher
        .create_project(
            Project {
                creator: project_manager,
                start_date: 0,
                end_date: 100000,
                title: 'Test',
                short_description: 'Test description',
                project_detail: 'Test detail',
                // true: active, false: closed
                status: true
            }
        );

    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    let project: Project = dao_project_dispatcher.get_project(0);

    assert(project.title == 'Test', 'Fail to create project');
}
