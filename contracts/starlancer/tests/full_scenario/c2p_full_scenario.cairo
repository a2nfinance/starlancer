use starlancer::components::dao::project::IDAOProjectDispatcherTrait;
use core::option::OptionTrait;
use starlancer::components::dao::member::IMemberDispatcherTrait;
use starlancer::components::dao::treasury::ITreasuryDispatcherTrait;
use core::traits::Into;
use starlancer::contracts::dao_contract::IDAODispatcherTrait;
use starlancer::contracts::dao_factory::IDAOFactoryDispatcherTrait;
use starlancer::components::dao::job::IDAOJobsDispatcherTrait;
use core::serde::Serde;
use snforge_std::{
    declare, ContractClassTrait, start_prank, stop_prank, start_warp, stop_warp, env::var,
    ContractClass, get_class_hash, cheatcodes
};
use starknet::{ContractAddress, get_contract_address, ClassHash};
use super::super::utils::mock_data::{
    get_mock_addresses, get_mock_whitelisted_contributors, get_mock_dev_accounts,
    get_mock_project_roles
};
use starlancer::contracts::dao_factory::IDAOFactoryDispatcher;
use starlancer::contracts::dao_contract::IDAODispatcher;
use starlancer::components::dao::job::IDAOJobsDispatcher;
use starlancer::components::dao::treasury::ITreasuryDispatcher;
use starlancer::components::dao::project::IDAOProjectDispatcher;
use starlancer::components::dao::member::IMemberDispatcher;

use starlancer::types::{
    DAODetail, MemberRoles, Job, ContractType, Contract, Project, Task, TaskStatus, TextStruct
};

// ERC 20
use openzeppelin::token::erc20::interface::IERC20DispatcherTrait;
use openzeppelin::token::erc20::interface::IERC20Dispatcher;


// This test does steps:
// 0. Deploy a mock ERC-20 token
// 1. Deploy a DAO factory
// 2. Create a new DAO using DAOFactory
// 3. Fund DAO treasury
// 4. Create a new job
// 5. Apply job, the user becomes a candidate
// 6. Accept candidate, user become a DAO member with a contract
// 7. Create a project by project manager
// 8. Create a new task and assign to dev
// 9. Change task status to completes (By code reviewer)
// 10. Pay dev by a treasury manager
fn get_textstruct_test(value: felt252) -> TextStruct {
    TextStruct {text0: value, text1: '', text2: '', text3: '', text4: '', text5: ''}
}
fn deploy_mock_erc20() -> ContractAddress {
    let (caller, _, _, _, _) = get_mock_addresses();
    let erc20_contract = declare('MockERC20');
    let mut calldata = ArrayTrait::new();
    let initital_supply: u256 = 2000_u256;
    initital_supply.serialize(ref calldata);
    caller.serialize(ref calldata);

    let contract_address = erc20_contract.precalculate_address(@calldata);

    start_prank(cheatcodes::CheatTarget::One(contract_address), caller);
    let deployed_contract = erc20_contract.deploy(@calldata).unwrap();
    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    deployed_contract
}


fn deploy_dao_factory() -> ContractAddress {
    let (caller, _, _, _, _) = get_mock_addresses();
    let dao_factory_contract = declare('DAOFactory');
    let dao_contract = declare('DAO');
    let dao_contract_hash: ClassHash = dao_contract.class_hash;
    let mut calldata = ArrayTrait::new();

    dao_contract_hash.serialize(ref calldata);
    caller.serialize(ref calldata);

    let contract_address = dao_factory_contract.precalculate_address(@calldata);

    start_prank(cheatcodes::CheatTarget::One(contract_address), caller);
    let deployed_contract = dao_factory_contract.deploy(@calldata).unwrap();
    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    deployed_contract
}

fn create_dao(dao_factory_address: ContractAddress) -> ContractAddress {
    let (caller, treasury_manager, member_manager, project_manager, job_manager) =
        get_mock_addresses();
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
    stop_prank(cheatcodes::CheatTarget::One(dao_factory_address));
    deployed_contract
}

fn fund(
    treasury_manager: ContractAddress,
    dao_address: ContractAddress,
    caller: ContractAddress,
    erc20_dispatcher: IERC20Dispatcher,
    erc20_contract_address: ContractAddress
) {
    let treasury_dispatcher: ITreasuryDispatcher = ITreasuryDispatcher {
        contract_address: dao_address
    };

    println!(" 3.1. Add a whitelisted contributor");

    start_prank(cheatcodes::CheatTarget::One(dao_address), treasury_manager);

    treasury_dispatcher.add_whitelisted_contributor(caller);
    stop_prank(cheatcodes::CheatTarget::One(dao_address));

    println!(" 3.2. Approve smart contract for token transfer (1_u256)");

    start_prank(cheatcodes::CheatTarget::One(erc20_contract_address), caller);

    erc20_dispatcher.approve(dao_address, 20_u256);

    stop_prank(cheatcodes::CheatTarget::One(erc20_contract_address));

    println!(" 3.3. Send fund to the created DAO (1_u256)");

    start_prank(cheatcodes::CheatTarget::One(dao_address), caller);

    treasury_dispatcher.fund(erc20_contract_address, 20_u256);

    stop_prank(cheatcodes::CheatTarget::One(dao_address));

    println!(" 3.4. Check token balance");
    let token_balance: u256 = treasury_dispatcher.get_token_balance(erc20_contract_address);

    assert(token_balance == 20_u256, 'Fail to fund');
}

fn create_job(
    dao_job_dispatcher: IDAOJobsDispatcher,
    dao_address: ContractAddress,
    job_manager: ContractAddress,
    erc20_contract_address: ContractAddress
) -> Job {
    start_prank(cheatcodes::CheatTarget::One(dao_address), job_manager);
    dao_job_dispatcher
        .add_job(
            Job {
                creator: job_manager,
                start_date: 0,
                end_date: 100000,
                title: get_textstruct_test('Test job'),
                short_description: get_textstruct_test('Test description'),
                job_detail: get_textstruct_test('Test detail'),
                pay_by_token: erc20_contract_address,
                job_type: ContractType::HOURY,
                fixed_price: 0,
                hourly_rate: 1_u256,
                status: true
            }
        );

    stop_prank(cheatcodes::CheatTarget::One(dao_address));

    let job: Job = dao_job_dispatcher.get_job_by_index(0);
    assert(job.title.text0 == 'Test job', 'Fail to create job');
    job
}

fn apply_job(
    dao_job_dispatcher: IDAOJobsDispatcher,
    dao_address: ContractAddress,
    dev1: ContractAddress,
    job_index: u32
) {
    start_prank(cheatcodes::CheatTarget::One(dao_address), dev1);
    dao_job_dispatcher.apply_job(job_index);
    stop_prank(cheatcodes::CheatTarget::One(dao_address));

    let candidates: Array<ContractAddress> = dao_job_dispatcher.get_job_candidates(job_index);
    let first: ContractAddress = *candidates.at(0);
    assert(first == dev1, 'Fail to apply');
}

fn accept_candidate(
    dao_member_dispatcher: IMemberDispatcher,
    dao_dispatcher: IDAODispatcher,
    dao_address: ContractAddress,
    job_index: u32,
    candidate_index: u32,
    member_manager: ContractAddress
) {
    start_prank(cheatcodes::CheatTarget::One(dao_address), member_manager);
    dao_dispatcher.accept_candidate(job_index, candidate_index, 0, 1000000000);
    stop_prank(cheatcodes::CheatTarget::One(dao_address));
    let contract: Option<Contract> = dao_member_dispatcher.get_member_current_contract(0);
    assert(contract.is_some(), 'Fail to accept candidate');
}

fn create_project(
    dao_project_dispatcher: IDAOProjectDispatcher,
    dao_address: ContractAddress,
    project_manager: ContractAddress,
    task_managers: Array<ContractAddress>,
    code_reviewers: Array<ContractAddress>
) {
    start_prank(cheatcodes::CheatTarget::One(dao_address), project_manager);
    dao_project_dispatcher
        .create_project(
            task_managers,
            code_reviewers,
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
    stop_prank(cheatcodes::CheatTarget::One(dao_address));

    let project: Project = dao_project_dispatcher.get_project(0);
    assert(project.title.text0 == 'Test project', 'Fail to create project');
}

fn create_and_asign_task(
    dao_dispatcher: IDAODispatcher,
    dao_project_dispatcher: IDAOProjectDispatcher,
    dao_address: ContractAddress,
    task_manager: ContractAddress,
    dev1: ContractAddress
) {
    start_prank(cheatcodes::CheatTarget::One(dao_address), task_manager);
    dao_dispatcher
        .create_assign_task(
            dev1,
            0,
            Task {
                creator: task_manager,
                start_date: 0,
                deadline: 100000000,
                title: get_textstruct_test('New Task'),
                short_description: get_textstruct_test('Task short description'),
                task_detail: get_textstruct_test('Task detail url'),
                status: TaskStatus::OPEN,
                estimate: 3
            }
        );
    stop_prank(cheatcodes::CheatTarget::One(dao_address));
    let tasks: Array<Task> = dao_project_dispatcher.get_project_tasks(0);
    let first_task: Task = *tasks.at(0);

    assert(first_task.estimate == 3, 'Fail to create task');
}

fn change_task_status(
    dao_project_dispatcher: IDAOProjectDispatcher,
    dao_address: ContractAddress,
    code_reviewer: ContractAddress
) {
    start_prank(cheatcodes::CheatTarget::One(dao_address), code_reviewer);
    dao_project_dispatcher.change_task_status(0, 0, TaskStatus::COMPLETE);
    stop_prank(cheatcodes::CheatTarget::One(dao_address));

    let tasks: Array<Task> = dao_project_dispatcher.get_project_tasks(0);
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

fn pay_member(
    dao_dispatcher: IDAODispatcher,
    erc20_contract_address: ContractAddress,
    erc20_dispatcher: IERC20Dispatcher,
    dao_address: ContractAddress,
    treasury_manager: ContractAddress,
    dev1: ContractAddress
) {
    start_prank(cheatcodes::CheatTarget::One(dao_address), treasury_manager);
    dao_dispatcher.pay_member(0);
    stop_prank(cheatcodes::CheatTarget::One(dao_address));

    // Check treasury balance
    let treasury_balance: u256 = erc20_dispatcher.balance_of(dao_address);
    let dev1_balance: u256 = erc20_dispatcher.balance_of(dev1);
    assert((treasury_balance + dev1_balance) == 20_u256 && dev1_balance == 3_u256, 'Not paid success');
}

#[test]
fn test_c2p() {
    println!("========================================================================");
    println!("0. Deploy a mock ERC 20 token");
    let (caller, treasury_manager, member_manager, project_manager, job_manager) =
        get_mock_addresses();
    let (con1, con2) = get_mock_whitelisted_contributors();
    let (dev1, dev2) = get_mock_dev_accounts();
    let (task_manager, code_reviewer) = get_mock_project_roles();

    let erc20_contract_address = deploy_mock_erc20();

    let erc20_dispatcher: IERC20Dispatcher = IERC20Dispatcher {
        contract_address: erc20_contract_address
    };

    let caller_balance: u256 = erc20_dispatcher.balance_of(caller);

    assert(caller_balance == 2000_u256, 'Not correct balance');

    println!("1. Deploy a DAO Factory");

    let dao_factory_address = deploy_dao_factory();

    let dao_factory_dispatcher: IDAOFactoryDispatcher = IDAOFactoryDispatcher {
        contract_address: dao_factory_address
    };
    let owner: ContractAddress = dao_factory_dispatcher.get_owner();
    assert(owner == caller, 'DAO Factory & wrong contructor');

    println!("2. Create a new DAO using DAOFactory");
    let dao_address = create_dao(dao_factory_address);

    let dao_dispatcher: IDAODispatcher = IDAODispatcher { contract_address: dao_address };
    let dao_detail: DAODetail = dao_dispatcher.get_dao_detail();

    assert(dao_detail.name.text0 == 'Test DAO', 'Not create DAO success');

    let dao_job_dispatcher: IDAOJobsDispatcher = IDAOJobsDispatcher {
        contract_address: dao_address
    };

    let dao_member_dispatcher: IMemberDispatcher = IMemberDispatcher {
        contract_address: dao_address
    };
    let dao_project_dispatcher: IDAOProjectDispatcher = IDAOProjectDispatcher {
        contract_address: dao_address
    };

    println!("3. Fund DAO treasury");

    fund(treasury_manager, dao_address, caller, erc20_dispatcher, erc20_contract_address);

    println!("4. Create a new job");

    create_job(dao_job_dispatcher, dao_address, job_manager, erc20_contract_address,);

    println!("5. Apply job, an user becomes a candidate");

    apply_job(dao_job_dispatcher, dao_address, dev1, 0);

    println!("6. Accept candidate, user become a DAO member with a contract");

    accept_candidate(dao_member_dispatcher, dao_dispatcher, dao_address, 0, 0, member_manager);

    println!("7. Create a project by project manager");
    create_project(
        dao_project_dispatcher,
        dao_address,
        project_manager,
        array![task_manager],
        array![code_reviewer]
    );

    println!("8. Create a new task and assign to dev");
    create_and_asign_task(dao_dispatcher, dao_project_dispatcher, dao_address, task_manager, dev1);

    println!("9. Change task status to complete (By code reviewer)");
    change_task_status(dao_project_dispatcher, dao_address, code_reviewer);
    println!("10. Pay dev by a treasury manager");
    pay_member(
        dao_dispatcher,
        erc20_contract_address,
        erc20_dispatcher,
        dao_address,
        treasury_manager,
        dev1
    );
    println!("========================================================================");
}

