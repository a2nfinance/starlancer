use starknet::ContractAddress;
fn get_mock_addresses() -> (
    ContractAddress, ContractAddress, ContractAddress
) {
    let deployer: ContractAddress = starknet::contract_address_const::<0x01>();
    let sender: ContractAddress = starknet::contract_address_const::<0x02>();
    let recipient: ContractAddress = starknet::contract_address_const::<0x03>();


    return (deployer, sender, recipient);
}