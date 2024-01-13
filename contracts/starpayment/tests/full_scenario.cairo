use core::option::OptionTrait;
use core::traits::Into;
use starpayment::stream_contract::ICryptoStreamDispatcher;
use starpayment::stream_contract::ICryptoStreamDispatcherTrait;
use starpayment::types::Stream;
use core::serde::Serde;

// ERC 20
use openzeppelin::token::erc20::interface::IERC20DispatcherTrait;
use openzeppelin::token::erc20::interface::IERC20Dispatcher;

use snforge_std::{
    declare, ContractClassTrait, start_prank, stop_prank, start_warp, stop_warp, env::var,
    ContractClass, get_class_hash, cheatcodes
};
use starknet::{ContractAddress, get_contract_address, ClassHash};
use super::utils::mock_data::{get_mock_addresses};

use super::utils::contract_deployer::{deploy_stream_contract};

fn deploy_mock_erc20() -> ContractAddress {
    let (deployer, sender, _,) = get_mock_addresses();
    let erc20_contract = declare('MockERC20');
    let mut calldata = ArrayTrait::new();
    let initial_supply: u256 = 2000_000_000_000_000_000_000_000_000_u256;
    initial_supply.serialize(ref calldata);
    sender.serialize(ref calldata);

    let contract_address = erc20_contract.precalculate_address(@calldata);

    start_prank(cheatcodes::CheatTarget::One(contract_address), deployer);
    let deployed_contract = erc20_contract.deploy(@calldata).unwrap();
    stop_prank(cheatcodes::CheatTarget::One(contract_address));

    deployed_contract
}

#[test]
fn test_crypto_stream() {
    println!("========================================================================");
    println!("0. Deploy a mock ERC 20 token");
    let (deployer, sender, recipient) = get_mock_addresses();
    let erc20_contract_address = deploy_mock_erc20();

    let erc20_dispatcher: IERC20Dispatcher = IERC20Dispatcher {
        contract_address: erc20_contract_address
    };

    let caller_balance: u256 = erc20_dispatcher.balance_of(sender);

    assert(caller_balance == 2000_000_000_000_000_000_000_000_000_u256, 'Not correct balance');

    println!("1. Deploy stream contract");

    let stream_contract_address = deploy_stream_contract(deployer);

    let stream_dispatcher: ICryptoStreamDispatcher = ICryptoStreamDispatcher {
        contract_address: stream_contract_address
    };

    println!("2. Create a stream");
    start_prank(cheatcodes::CheatTarget::One(stream_contract_address), sender);
    stream_dispatcher
        .new_stream(
            Stream {
                index: 0,
                title: 'New stream',
                sender: sender,
                recipient: recipient,
                start_date: 0,
                unlock_amount_each_time: 1000,
                // s,min,h,week,month,y
                unlock_type: 1,
                unlock_every: 10,
                unlock_number: 10,
                // 0: only sender, 1: only recipient, 2: both, 3: no one
                cancel_previlege: 0,
                transfer_previlege: 0,
                pay_by_token: erc20_contract_address,
                prepaid: 0,
                // 1: active, 2: cancel
                status: 1
            }
        );

    
    stop_prank(cheatcodes::CheatTarget::One(stream_contract_address));
    let streams: Array<Stream> = stream_dispatcher.get_sender_streams(sender, 0, 10);
    assert(*streams.at(0).title == 'New stream'.into(), 'New stream success');

    println!("3. Fund a stream");
    start_prank(cheatcodes::CheatTarget::One(erc20_contract_address), sender);

    erc20_dispatcher.approve(stream_contract_address, 100000);

    stop_prank(cheatcodes::CheatTarget::One(erc20_contract_address));

    start_prank(cheatcodes::CheatTarget::One(stream_contract_address), sender);
    stream_dispatcher.send_fund(erc20_contract_address, 100000, 0);
    stop_prank(cheatcodes::CheatTarget::One(stream_contract_address));

    let (current_fund, balance) = stream_dispatcher.get_stream_token_info(0);
    assert(current_fund == 100000, 'Incorrect fund');
    assert(balance == 100000, 'Incorrect fund');
}
