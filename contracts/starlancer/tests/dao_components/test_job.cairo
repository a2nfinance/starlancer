use starknet::ContractAddress;
use starlancer::components::dao::job::IDAOJobsDispatcherTrait;
use starlancer::components::dao::job::IDAOJobsDispatcher;
use starlancer::types::{Job, ContractType, TextStruct, DAODetail};
use snforge_std::{
    declare, ContractClassTrait, start_prank, stop_prank, start_warp, stop_warp, env::var,
    ContractClass, get_class_hash, cheatcodes
};

use super::super::utils::contract_deployer::{deploy_dao_contract, deploy_platform_fee};
use super::super::utils::mock_data::{get_mock_addresses, get_mock_platform_fee_roles};

fn get_textstruct_test(value: felt252) -> TextStruct {
    TextStruct { text0: value, text1: '', text2: '', text3: '', text4: '', text5: '' }
}


#[test]
fn test_create_job() {
    let (caller, project_manager, job_manager, member_manager, treasury_manager) =
        get_mock_addresses();
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

    let fake_token_address = starknet::contract_address_const::<0x02>();
    start_prank(cheatcodes::CheatTarget::One(contract_address), job_manager);

    let dao_job_dispatcher: IDAOJobsDispatcher = IDAOJobsDispatcher { contract_address };

    dao_job_dispatcher
        .add_job(
            Job {
                creator: job_manager,
                start_date: 0,
                end_date: 100000,
                title: get_textstruct_test('Test job'),
                short_description: get_textstruct_test('Test description'),
                job_detail: get_textstruct_test('Test detail'),
                pay_by_token: fake_token_address,
                job_type: ContractType::HOURY,
                fixed_price: 0,
                hourly_rate: 10000_u256,
                status: true
            }
        );

    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    let job: Job = dao_job_dispatcher.get_job_by_index(0);

    assert(job.title.text0 == 'Test job', 'Fail to create job');
}
