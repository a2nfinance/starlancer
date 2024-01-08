use snforge_std::{
    declare, ContractClassTrait, start_prank, stop_prank, start_warp, stop_warp, env::var,
    ContractClass, get_class_hash, cheatcodes
};
use starknet::{ContractAddress, get_contract_address, ClassHash};
use super::super::utils::mock_data::{
    get_mock_addresses, get_mock_whitelisted_contributors, get_mock_dev_accounts,
    get_mock_project_roles, get_mock_platform_fee_roles
};

use starlancer::contracts::p2p_marketplace::IP2PJobsMarketplaceDispatcher;
use starlancer::contracts::p2p_marketplace::IP2PJobsMarketplaceDispatcherTrait;

use starlancer::components::p2p::job::IP2PJobDispatcher;
use starlancer::components::p2p::job::IP2PJobDispatcherTrait;
use starlancer::components::p2p::task::IP2PTaskDispatcher;
use starlancer::components::p2p::task::IP2PTaskDispatcherTrait;

use starlancer::types::{
    DAODetail, MemberRoles, Job, ContractType, Contract, Project, Task, TaskStatus, TextStruct
};

// ERC 20
use openzeppelin::token::erc20::interface::IERC20DispatcherTrait;
use openzeppelin::token::erc20::interface::IERC20Dispatcher;

// 0. Deploy mock ERC20-Token
// 1. Deploy platform fee
// 2. Deploy p2p marketplace contract
// 3. An employer creates a job
// 4. An user applies to a job
// 5. The employer accepts the candidate
// 6. The employer create a task
// 7. The employer change a task status
// 8. The employer pay dev

fn get_textstruct_test(value: felt252) -> TextStruct {
    TextStruct { text0: value, text1: '', text2: '', text3: '', text4: '', text5: '' }
}

fn deploy_mock_erc20(caller: ContractAddress) -> ContractAddress {
    let erc20_contract = declare('MockERC20');
    let mut calldata = ArrayTrait::new();
    let initital_supply: u256 = 2000_000_000_000_000_000_000_000_000_u256;
    initital_supply.serialize(ref calldata);
    caller.serialize(ref calldata);

    let contract_address = erc20_contract.precalculate_address(@calldata);

    start_prank(cheatcodes::CheatTarget::One(contract_address), caller);
    let deployed_contract = erc20_contract.deploy(@calldata).unwrap();
    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    deployed_contract
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


fn deploy_p2p_marketplace(
    caller: ContractAddress, platform_fee: ContractAddress
) -> ContractAddress {
    let p2p_jobs_marketplace = declare('P2PJobsMarketplace');
    let mut calldata = ArrayTrait::new();
    platform_fee.serialize(ref calldata);

    let contract_address = p2p_jobs_marketplace.precalculate_address(@calldata);

    start_prank(cheatcodes::CheatTarget::One(contract_address), caller);
    let deployed_contract = p2p_jobs_marketplace.deploy(@calldata).unwrap();
    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    deployed_contract
}

fn create_a_job(
    p2p_job_dispatcher: IP2PJobDispatcher,
    employer: ContractAddress,
    erc20_contract_address: ContractAddress,
    p2p_address: ContractAddress,
    job_index: u32
) -> Job {
    start_prank(cheatcodes::CheatTarget::One(p2p_address), employer);
    p2p_job_dispatcher
        .add_job(
            Job {
                creator: employer,
                start_date: 0,
                end_date: 100000,
                title: get_textstruct_test('Test job'),
                short_description: get_textstruct_test('Test description'),
                job_detail: get_textstruct_test('Test detail'),
                pay_by_token: erc20_contract_address,
                job_type: ContractType::HOURY,
                fixed_price: 0,
                hourly_rate: 10000_u256,
                status: true
            }
        );

    stop_prank(cheatcodes::CheatTarget::One(p2p_address));

    let job: Job = p2p_job_dispatcher.get_job_by_index(job_index);
    assert(job.title.text0 == 'Test job', 'Fail to create job');
    job
}

fn apply_job(
    p2p_job_dispatcher: IP2PJobDispatcher,
    p2p_address: ContractAddress,
    dev1: ContractAddress,
    job_index: u32
) {
    start_prank(cheatcodes::CheatTarget::One(p2p_address), dev1);
    p2p_job_dispatcher.apply_job(job_index);
    stop_prank(cheatcodes::CheatTarget::One(p2p_address));

    let candidates: Array<ContractAddress> = p2p_job_dispatcher.get_job_candidates(job_index);
    let first: ContractAddress = *candidates.at(0);
    assert(first == dev1, 'Fail to apply');
}


fn accept_candidate(
    p2p_job_dispatcher: IP2PJobDispatcher,
    p2p_address: ContractAddress,
    local_job_index: u32,
    candidate_index: u32,
    employer: ContractAddress,
    dev1: ContractAddress
) {
    start_prank(cheatcodes::CheatTarget::One(p2p_address), employer);
    p2p_job_dispatcher.accept_candidate(local_job_index, candidate_index);
    stop_prank(cheatcodes::CheatTarget::One(p2p_address));
    let accepted_candidate: ContractAddress = p2p_job_dispatcher
        .get_accepted_candidate(employer, local_job_index);
    assert(accepted_candidate == dev1, 'Fail to accept candidate');
}

fn create_task(
    p2p_dispatcher: IP2PJobsMarketplaceDispatcher,
    p2p_task_dispatcher: IP2PTaskDispatcher,
    p2p_address: ContractAddress,
    employer: ContractAddress,
    local_job_index: u32,
    global_job_index: u32
) {
    start_prank(cheatcodes::CheatTarget::One(p2p_address), employer);
    p2p_dispatcher
        .create_job_task(
            local_job_index,
            Task {
                creator: employer,
                start_date: 0,
                deadline: 100000000,
                title: get_textstruct_test('New Task'),
                short_description: get_textstruct_test('Task short description'),
                task_detail: get_textstruct_test('Task detail url'),
                status: TaskStatus::OPEN,
                estimate: 3
            }
        );
    stop_prank(cheatcodes::CheatTarget::One(p2p_address));
    let tasks: Array<Task> = p2p_task_dispatcher.get_job_tasks(global_job_index);
    let first_task: Task = *tasks.at(0);

    assert(first_task.estimate == 3, 'Fail to create task');
}

fn change_task_status(
    p2p_dispatcher: IP2PJobsMarketplaceDispatcher,
    p2p_task_dispatcher: IP2PTaskDispatcher,
    p2p_address: ContractAddress,
    employer: ContractAddress
) {
    start_prank(cheatcodes::CheatTarget::One(p2p_address), employer);
    p2p_dispatcher.change_job_task_status(0, 0, TaskStatus::COMPLETE);
    stop_prank(cheatcodes::CheatTarget::One(p2p_address));

    let tasks: Array<Task> = p2p_task_dispatcher.get_job_tasks(0);
    let first_task: Task = *tasks.at(0);
    let is_completed_task: bool = match first_task.status {
        TaskStatus::OPEN => false,
        TaskStatus::ASSIGNED => false,
        TaskStatus::PENDING => false,
        TaskStatus::TESTING => false,
        TaskStatus::REVIEWING => false,
        TaskStatus::COMPLETE => true,
        TaskStatus::CANCELLED => false
    };
    assert(is_completed_task, 'Fail to update task status');
}

fn pay_dev(
    erc20_dispatcher: IERC20Dispatcher,
    p2p_dispatcher: IP2PJobsMarketplaceDispatcher,
    p2p_address: ContractAddress,
    erc20_contract_address: ContractAddress,
    employer: ContractAddress,
    dev1: ContractAddress,
    platform_fee: ContractAddress
) {
    start_prank(cheatcodes::CheatTarget::One(erc20_contract_address), employer);
    let total_amount: u256 = p2p_dispatcher.get_job_payment_amount(0);
    erc20_dispatcher.approve(p2p_address, total_amount);
    stop_prank(cheatcodes::CheatTarget::One(erc20_contract_address));

    start_prank(cheatcodes::CheatTarget::One(p2p_address), employer);
    p2p_dispatcher.pay_dev(0);
    stop_prank(cheatcodes::CheatTarget::One(p2p_address));

    let dev1_balance: u256 = erc20_dispatcher.balance_of(dev1);
    let platform_fee_balance: u256 = erc20_dispatcher.balance_of(platform_fee);
    assert(
        dev1_balance == 30000_u256 && platform_fee_balance == 30000 * 50 / 10000, 'Not paid success'
    );
}


#[test]
fn test_p2p_marketplace() {
    println!("========================================================================");
    let (caller, _, _, _, job_manager) = get_mock_addresses();
    let (dev1, dev2) = get_mock_dev_accounts();
    println!("0. Deploy mock ERC20-Token");

    let erc20_contract_address: ContractAddress = deploy_mock_erc20(caller);
    let erc20_dispatcher: IERC20Dispatcher = IERC20Dispatcher {
        contract_address: erc20_contract_address
    };

    println!("1. Deploy platform fee");

    let platform_fee_address = deploy_platform_fee();
    println!("2. Deploy p2p marketplace contract");

    let p2p_address: ContractAddress = deploy_p2p_marketplace(caller, platform_fee_address);

    let p2p_dispatcher: IP2PJobsMarketplaceDispatcher = IP2PJobsMarketplaceDispatcher {
        contract_address: p2p_address
    };
    let p2p_job_dispatcher: IP2PJobDispatcher = IP2PJobDispatcher { contract_address: p2p_address };
    let p2p_task_dispatcher: IP2PTaskDispatcher = IP2PTaskDispatcher {
        contract_address: p2p_address
    };
    println!("3. An employer creates a job");
    // employer1 creates job
    create_a_job(p2p_job_dispatcher, caller, erc20_contract_address, p2p_address, 0);
    // employer2 creates job 
    create_a_job(p2p_job_dispatcher, job_manager, erc20_contract_address, p2p_address, 1);

    println!("4. An user applies to a job");
    apply_job(p2p_job_dispatcher, p2p_address, dev1, 0);

    println!("5. The employer accepts the candidate");

    accept_candidate(p2p_job_dispatcher, p2p_address, 0, 0, caller, dev1);

    println!("6. The employer create a task");
    // employer1 creates task
    create_task(p2p_dispatcher, p2p_task_dispatcher, p2p_address, caller, 0, 0);
    // employer2 creates task
    create_task(p2p_dispatcher, p2p_task_dispatcher, p2p_address, job_manager, 0, 1);

    println!("7. The employer change a task status");

    change_task_status(p2p_dispatcher, p2p_task_dispatcher, p2p_address, caller);

    println!("8. The employer pay dev");

    pay_dev(
        erc20_dispatcher,
        p2p_dispatcher,
        p2p_address,
        erc20_contract_address,
        caller,
        dev1,
        platform_fee_address
    );
    println!("========================================================================");
}
