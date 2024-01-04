use starknet::ContractAddress;
use starlancer::dao::job::IDAOJobsDispatcherTrait;
use starlancer::dao::job::IDAOJobsDispatcher;
use starlancer::types::{Job, ContractType};
use snforge_std::{
    declare, ContractClassTrait, start_prank, stop_prank, start_warp, stop_warp, env::var,
    ContractClass, get_class_hash, cheatcodes
};

use super::contract::{deploy_contract, get_important_addresses};


#[test]
fn test_create_job() {
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
    let fake_token_address = starknet::contract_address_const::<0x02>();
    start_prank(cheatcodes::CheatTarget::One(contract_address), job_manager);

    let dao_job_dispatcher: IDAOJobsDispatcher = IDAOJobsDispatcher { contract_address };
    
    dao_job_dispatcher
        .add_job(
            Job {
                creator: project_manager,
                start_date: 0,
                end_date: 100000,
                title: 'Test job',
                short_description: 'Test description',
                job_detail: 'Test detail',
                pay_by_token: fake_token_address,
                job_type: ContractType::HOURY,
                fixed_price: 0,
                hourly_rate: 3000000000000000,
                // true: active, false: closed
                status: true
            }
        );

    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    let job: Job = dao_job_dispatcher.get_job_by_index(0);

    assert(job.title == 'Test job', 'Fail to create job');
}
