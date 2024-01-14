use core::traits::Into;

use starknet::ContractAddress;
use starlancer::components::dao::job::IDAOJobsDispatcherTrait;
use starlancer::components::dao::job::IDAOJobsDispatcher;
use starlancer::components::dao::treasury::ITreasuryDispatcher;
use starlancer::components::dao::treasury::ITreasuryDispatcherTrait;
use starlancer::types::{Job, ContractType, TextStruct, DAODetail};
use snforge_std::{
    declare, ContractClassTrait, start_prank, stop_prank, start_warp, stop_warp, env::var,
    ContractClass, get_class_hash, cheatcodes
};

use super::super::utils::contract_deployer::{deploy_dao_contract, deploy_platform_fee, deploy_erc20};
use super::super::utils::mock_data::{get_mock_addresses, get_mock_whitelisted_contributors};


// ERC 20
use openzeppelin::token::erc20::interface::IERC20DispatcherTrait;
use openzeppelin::token::erc20::interface::IERC20Dispatcher;

fn get_textstruct_test(value: felt252) -> TextStruct {
    TextStruct { text0: value, text1: '', text2: '', text3: '', text4: '', text5: '' }
}


#[test]
fn test_fund() {
    println!("========================================================================");
    println!("0. Start to test treasury");
    let (caller, project_manager, job_manager, member_manager, treasury_manager) =
        get_mock_addresses();
    let (mem1, mem2) = get_mock_whitelisted_contributors();
    let platform_fee: ContractAddress = deploy_platform_fee();
    let dao_address = deploy_dao_contract(
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
    let initial_supply: u256 = 2000_000_000_000_000_000_000_000_000_u256;
    let erc20_contract_address: ContractAddress = deploy_erc20('MockERC20', initial_supply, mem1);
    let erc20_dispatcher: IERC20Dispatcher = IERC20Dispatcher {
        contract_address: erc20_contract_address
    };
    println!(" 1. Add a whitelisted contributor");
    let treasury_dispatcher: ITreasuryDispatcher = ITreasuryDispatcher {
        contract_address: dao_address
    };
    start_prank(cheatcodes::CheatTarget::One(dao_address), treasury_manager);

    treasury_dispatcher.add_whitelisted_contributor(mem1);
    stop_prank(cheatcodes::CheatTarget::One(dao_address));

    println!(" 2. Approve smart contract for token transfer (2000_000_000_u256)");

    start_prank(cheatcodes::CheatTarget::One(erc20_contract_address), mem1);

    erc20_dispatcher.approve(dao_address, 2000_000_000_u256);

    stop_prank(cheatcodes::CheatTarget::One(erc20_contract_address));

    println!(" 3. Send fund to the created DAO (2000_000_000_u256)");

    start_prank(cheatcodes::CheatTarget::One(dao_address), mem1);

    treasury_dispatcher.fund(erc20_contract_address, 2000_000_000_u256);

    stop_prank(cheatcodes::CheatTarget::One(dao_address));

    println!(" 4. Check token balance");
    let token_balance: u256 = treasury_dispatcher.get_token_balance(erc20_contract_address);

    assert(token_balance == 2000_000_000_u256, 'Fail to fund');
    println!("========================================================================");
}
