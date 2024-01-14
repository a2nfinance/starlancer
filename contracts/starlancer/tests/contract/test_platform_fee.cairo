use snforge_std::{
    declare, ContractClassTrait, start_prank, stop_prank, start_warp, stop_warp, env::var,
    ContractClass, get_class_hash, cheatcodes
};
use starknet::{ContractAddress, get_contract_address, ClassHash};
use starlancer::contracts::platform_fee::IPlatformFeeDispatcher;
use starlancer::contracts::platform_fee::IPlatformFeeDispatcherTrait;
use super::super::utils::mock_data::{get_mock_addresses, get_mock_platform_fee_roles, get_mock_dev_accounts};
use super::super::utils::contract_deployer::{deploy_platform_fee};

#[test]
fn test_deploy_platform_fee() {
    let platform_fee_address: ContractAddress = deploy_platform_fee();
    let platform_fee_dispatcher: IPlatformFeeDispatcher = IPlatformFeeDispatcher {
        contract_address: platform_fee_address
    };
    let rate_fee: u16 = platform_fee_dispatcher.get_rate_fee(0);
    assert(rate_fee == 50, 'Not correct fee setup');
}

#[test]
fn test_change_rate_fee() {
    let (admin, _) = get_mock_platform_fee_roles();
    let platform_fee_address: ContractAddress = deploy_platform_fee();
    let platform_fee_dispatcher: IPlatformFeeDispatcher = IPlatformFeeDispatcher {
        contract_address: platform_fee_address
    };
    start_prank(cheatcodes::CheatTarget::One(platform_fee_address), admin);
    platform_fee_dispatcher.set_rate_fee(20);
    stop_prank(cheatcodes::CheatTarget::One(platform_fee_address));
    let rate_fee: u16 = platform_fee_dispatcher.get_rate_fee(0);
    assert(rate_fee == 20, 'Not correct fee setup');
}

#[test]
fn test_apply_discount_for_employer() {
    let (admin, _) = get_mock_platform_fee_roles();
    let (dev1, dev2) = get_mock_dev_accounts();
    let platform_fee_address: ContractAddress = deploy_platform_fee();
    let platform_fee_dispatcher: IPlatformFeeDispatcher = IPlatformFeeDispatcher {
        contract_address: platform_fee_address
    };

    start_prank(cheatcodes::CheatTarget::One(platform_fee_address), admin);
    platform_fee_dispatcher.set_user_fee_discount(dev1, 10);
    stop_prank(cheatcodes::CheatTarget::One(platform_fee_address));
    let rate_fee: u16 = platform_fee_dispatcher.get_discounted_rate_fee(dev2, dev1);
    assert(rate_fee == 40, 'Not correct discounted fee');
}