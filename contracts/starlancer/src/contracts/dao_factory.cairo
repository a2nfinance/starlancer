use starlancer::types::{DAODetail};
use starknet::{ContractAddress, ClassHash};

#[starknet::interface]
trait IDAOFactory<TContractState> {
    fn get_owner(self: @TContractState) -> ContractAddress;
    fn create_dao(
        ref self: TContractState,
        dao_detail: DAODetail,
        treasury_managers: Array<ContractAddress>,
        member_managers: Array<ContractAddress>,
        project_managers: Array<ContractAddress>,
        job_managers: Array<ContractAddress>
    ) -> ContractAddress;
    fn update_dao_hash(ref self: TContractState, new_dao_hash: ClassHash);
    fn update_platform_fee(ref self: TContractState, new_platfrom_fee: ContractAddress);
    fn get_all_daos(self: @TContractState) -> Array<ContractAddress>;
    fn get_dao_creator(self: @TContractState, dao_contract: ContractAddress) -> ContractAddress;
}

#[starknet::contract]
mod DAOFactory {
    use core::serde::Serde;
    use starlancer::types::{DAODetail};
    use starknet::{ContractAddress, get_caller_address, ClassHash, SyscallResult};
    use starknet::contract_address::{ContractAddressZero};
    use starknet::syscalls::deploy_syscall;
    use starlancer::error::Errors;

    #[storage]
    struct Storage {
        owner: ContractAddress,
        // Key: dao_index, value: ContractAddress
        daos: LegacyMap<u32, ContractAddress>,
        // Key: dao address, Key: Creator address
        dao_creator: LegacyMap<ContractAddress, ContractAddress>,
        // Num of DAOs.
        count_daos: u32,
        // DAO class hash.
        dao_hash: ClassHash,
        // the address of PlatformFee contract.
        platform_fee: ContractAddress
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CreateDAO: CreateDAO,
        UpdateDAOHash: UpdateDAOHash
    }

    #[derive(Drop, starknet::Event)]
    struct CreateDAO {
        contract_address: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct UpdateDAOHash {
        #[key]
        caller: ContractAddress,
        new_hash: ClassHash
    }

    #[constructor]
    fn constructor(ref self: ContractState, dao_hash: ClassHash, owner: ContractAddress, platform_fee: ContractAddress) {
        self.owner.write(owner);
        self.dao_hash.write(dao_hash);
        self.platform_fee.write(platform_fee);
    }

    #[abi(embed_v0)]
    impl IDAOFactoryImpl of super::IDAOFactory<ContractState> {
        // Get DAO owner.
        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        // Create a DAO from this factory contract.
        fn create_dao(
            ref self: ContractState,
            dao_detail: DAODetail,
            treasury_managers: Array<ContractAddress>,
            member_managers: Array<ContractAddress>,
            project_managers: Array<ContractAddress>,
            job_managers: Array<ContractAddress>
        ) -> ContractAddress {
            
            let mut calldata = ArrayTrait::new();
            get_caller_address().serialize(ref calldata);
            dao_detail.serialize(ref calldata);
            treasury_managers.serialize(ref calldata);
            member_managers.serialize(ref calldata);
            project_managers.serialize(ref calldata);
            job_managers.serialize(ref calldata);
            self.platform_fee.read().serialize(ref calldata);

            let result: SyscallResult<(ContractAddress, Span<felt252>)> = deploy_syscall(
                self.dao_hash.read(), 0, calldata.span(), false
            );

            match result {
                Result::Ok((
                    contract_address, _
                )) => {
                    let count_daos: u32 = self.count_daos.read();
                    self.daos.write(count_daos, contract_address);
                    self.dao_creator.write(contract_address, get_caller_address());
                    self.count_daos.write(count_daos + 1);
                    self.emit(CreateDAO { contract_address: contract_address });
                    return contract_address;
                },
                Result::Err => { return ContractAddressZero::zero(); }
            }
        }

        // Update DAO hash
        fn update_dao_hash(ref self: ContractState, new_dao_hash: ClassHash) {
            assert(get_caller_address() == self.owner.read(), Errors::NOT_DAO_FACTORY_ONWER);

            self.dao_hash.write(new_dao_hash);
            self.emit(UpdateDAOHash { caller: self.owner.read(), new_hash: new_dao_hash });
        }

        // Update the address of PlatformFee contract.
        fn update_platform_fee(ref self: ContractState, new_platfrom_fee: ContractAddress) {
            assert(get_caller_address() == self.owner.read(), Errors::NOT_DAO_FACTORY_ONWER);
            self.platform_fee.write(new_platfrom_fee);
        }

        // Get all DAOs.
        fn get_all_daos(self: @ContractState) -> Array<ContractAddress> {
            let mut daos: Array<ContractAddress> = ArrayTrait::new();
            let count_daos: u32 = self.count_daos.read();
            let mut i: u32 = 0;
            loop {
                if (i >= count_daos) {
                    break;
                }

                daos.append(self.daos.read(i));

                i += 1;
            };

            daos
        }

        // get the creator address of a DAO.
        fn get_dao_creator(self: @ContractState, dao_contract: ContractAddress) -> ContractAddress {
            self.dao_creator.read(dao_contract)
        }
    }
}
