use starknet::{ContractAddress};
#[derive(Copy, Drop, Serde, starknet::Store)]
struct Stream {
    index: u64,
    title: felt252,
    sender: ContractAddress,
    recipient: ContractAddress,
    start_date: u64,
    unlock_amount_each_time: u256,
    // s,h,min,week,month,y
    unlock_type: u8,
    unlock_every: u64,
    unlock_number: u64,
    // 0: only sender, 1: only recipient, 2: both, 3: no one
    cancel_previlege: u8,
    transfer_previlege: u8,
    pay_by_token: ContractAddress,
    prepaid: u256,
    // 1: active, 2: cancel
    status: u8
}