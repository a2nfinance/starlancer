use starknet::ContractAddress;
fn get_mock_addresses() -> (
    ContractAddress, ContractAddress, ContractAddress, ContractAddress, ContractAddress,
) {
    let caller: ContractAddress = starknet::contract_address_const::<0x01>();
    let treasury_manager: ContractAddress = starknet::contract_address_const::<0x02>();
    let member_manager: ContractAddress = starknet::contract_address_const::<0x03>();
    let project_manager: ContractAddress = starknet::contract_address_const::<0x04>();
    let job_manager: ContractAddress = starknet::contract_address_const::<0x05>();

    return (caller, treasury_manager, member_manager, project_manager, job_manager);
}

fn get_mock_dev_accounts() -> (ContractAddress, ContractAddress) {
    let acc1: ContractAddress = starknet::contract_address_const::<0x06>();
    let acc2: ContractAddress = starknet::contract_address_const::<0x07>();
    return (acc1, acc2);
}

fn get_mock_whitelisted_contributors() -> (ContractAddress, ContractAddress) {
    let acc1: ContractAddress = starknet::contract_address_const::<0x08>();
    let acc2: ContractAddress = starknet::contract_address_const::<0x09>();
    return (acc1, acc2);
}

fn get_mock_project_roles() -> (ContractAddress, ContractAddress) {
    let task_manager: ContractAddress = starknet::contract_address_const::<0x10>();
    let code_reviewer: ContractAddress = starknet::contract_address_const::<0x11>();
    return (task_manager, code_reviewer);
}

fn get_mock_platform_fee_roles() -> (ContractAddress, ContractAddress) {
    let admin: ContractAddress = starknet::contract_address_const::<0x12>();
    let fee_recipient: ContractAddress = starknet::contract_address_const::<0x13>();
    return (admin, fee_recipient);
}
