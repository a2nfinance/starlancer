use starknet::{ContractAddress};
#[derive(Copy, Drop, Serde, starknet::Store)]
struct Stream {
    index: u64,
    title: felt252,
    sender: ContractAddress,
    recipient: ContractAddress,
    start_date: u128,
    unlock_amount_each_time: u256,
    // s,h,min,week,month,y
    unlock_type: u8,
    unlock_every: u128,
    unlock_number: u32,
    cancel_previlege: u8,
    transfer_previlege: u8,
    pay_by_token: ContractAddress,
    prepaid: u256,
    status: u8
}