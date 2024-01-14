use starknet::ContractAddress;
use starlancer::components::dao::project::IDAOProjectDispatcherTrait;
use starlancer::components::dao::project::IDAOProjectDispatcher;
use starlancer::types::{Job, Project, DAODetail, TextStruct};
use snforge_std::{
    declare, ContractClassTrait, start_prank, stop_prank, start_warp, stop_warp, env::var,
    ContractClass, get_class_hash, cheatcodes
};

use super::super::utils::contract_deployer::{deploy_dao_contract, deploy_platform_fee};
use super::super::utils::mock_data::{get_mock_addresses, get_mock_project_roles};

fn get_textstruct_test(value: felt252) -> TextStruct {
    TextStruct { text0: value, text1: '', text2: '', text3: '', text4: '', text5: '' }
}

#[test]
fn test_create_project() {
    let (caller, project_manager, job_manager, member_manager, treasury_manager) =
        get_mock_addresses();
    let (task_manager, code_reviewer) = get_mock_project_roles();
    let platform_fee: ContractAddress = deploy_platform_fee();
    let contract_address = deploy_dao_contract(
        'DAO',
        caller,
        DAODetail {
            name: get_textstruct_test('Test DAO'),
            detail: get_textstruct_test('https://google.com'),
            short_description: get_textstruct_test('Short description'),
            social_networks: get_textstruct_test('social networks'),
        },
        array![treasury_manager],
        array![member_manager],
        array![project_manager],
        array![job_manager],
        platform_fee
    );

    start_prank(cheatcodes::CheatTarget::One(contract_address), project_manager);

    let dao_project_dispatcher: IDAOProjectDispatcher = IDAOProjectDispatcher { contract_address };
    dao_project_dispatcher
        .create_project(
            array![task_manager],
            array![code_reviewer],
            Project {
                creator: project_manager,
                start_date: 0,
                end_date: 100000000,
                title: get_textstruct_test('Test project'),
                short_description: get_textstruct_test('Test project short description'),
                project_detail: get_textstruct_test('Test project detail'),
                status: true
            }
        );

    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    let project: Project = dao_project_dispatcher.get_project(0);

    assert(project.title.text0 == 'Test project', 'Fail to create project');
}
