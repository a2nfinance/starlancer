use core::serde::Serde;
use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, starknet::Store)]
enum TaskStatus {
    OPEN,
    ASSIGNED,
    PENDING,
    TESTING,
    REVIEWING,
    COMPLETE,
    CANCELLED
}

#[derive(Copy, Drop, Serde, starknet::Store)]
enum ContractType {
    FIXED_PRICE,
    HOURY
}

#[derive(Copy, Drop, Serde, starknet::Store)]
struct Job {
    creator: ContractAddress,
    start_date: u128,
    end_date: u128,
    title: felt252,
    short_description: felt252,
    job_detail: felt252,
    // true: open, false: closed,
    job_type: ContractType,
    fixed_price: u256,
    hourly_rate: u256,
    pay_by_token: ContractAddress,
    status: bool
}

#[derive(Copy, Drop, Serde, starknet::Store)]
struct Project {
    creator: ContractAddress,
    start_date: u128,
    end_date: u128,
    title: felt252,
    short_description: felt252,
    project_detail: felt252,
    // true: active, false: closed
    status: bool
}

#[derive(Copy, Drop, Serde, starknet::Store)]
struct Task {
    creator: ContractAddress,
    start_date: u128,
    deadline: u128,
    title: felt252,
    short_description: felt252,
    task_detail: felt252,
    // hours
    estimate: u16,
    status: TaskStatus,
}
#[derive(Copy, Drop, Serde, starknet::Store)]
struct Contract {
    start_date: u128,
    end_date: u128,
    contract_type: ContractType,
    fixed_price: u256,
    hourly_rate: u256,
    pay_by_token: ContractAddress,
    status: bool,
}

#[derive(Drop, Serde)]
struct MemberRoles {
    is_job_manager: bool,
    is_member_manager: bool,
    is_project_manager: bool,
    is_treasury_manager: bool,
    is_member: bool
}

#[derive(Drop, Serde)]
struct ProjectRoles {
    is_code_reviewer: bool,
    is_task_manager: bool,
}

#[derive(Drop, Serde)]
struct DAOStatistics {
    num_projects: u32,
    num_members: u32,
    num_jobs: u32
}


#[derive(Copy, Drop, Serde, starknet::Store)]
struct DAODetail {
    name: felt252,
    short_description: felt252,
    detail: felt252,
    social_networks: felt252
}
