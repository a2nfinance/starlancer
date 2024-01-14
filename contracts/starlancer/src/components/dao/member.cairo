use starknet::ContractAddress;
use starlancer::types::{Job, Contract};

#[starknet::interface]
trait IMember<TContractState> {
    fn disable_member(ref self: TContractState, member: ContractAddress);
    fn update_contract(
        ref self: TContractState, member_index: u32, contract_index: u32, contract: Contract
    );
    fn new_member_contract(ref self: TContractState, member_index: u32, contract: Contract);
    fn is_member(self: @TContractState, address: ContractAddress) -> bool;
    fn get_members(self: @TContractState, offset: u32, page_size: u32) -> Array<ContractAddress>;
    fn get_member_contract_history(self: @TContractState, member_index: u32) -> Array<Contract>;
    fn get_member_current_contract(self: @TContractState, member_index: u32) -> Option<Contract>;
    fn get_member_by_index(self: @TContractState, member_index: u32) -> ContractAddress;
}

#[starknet::component]
mod member_component {
    use core::array::ArrayTrait;
    use starknet::{ContractAddress, get_caller_address};
    use starlancer::types::{Contract, Job, ContractType};
    use starlancer::error::Errors;
    #[storage]
    struct Storage {
        // Store list of member (developer) managers
        member_managers: LegacyMap<ContractAddress, bool>,
        // Store members. Key: member index, value: member address
        members: LegacyMap<u32, ContractAddress>,
        // member => active or inactive
        member_status: LegacyMap<ContractAddress, bool>,
        // Store a history of contracts. Key: (member_index, contract_index), value: contract
        member_contract_history: LegacyMap<(u32, u32), Contract>,
        // Num of member contracts. member index => number of contracts
        count_member_contracts: LegacyMap<u32, u32>,
        // Num of members
        count_members: u32,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        AddMember: AddMember,
        DisableMember: DisableMember,
        UpdateContract: UpdateContract,
        NewMemberContract: NewMemberContract
    }

    #[derive(Drop, starknet::Event)]
    struct AddMember {
        member: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct DisableMember {
        member: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct UpdateContract {
        member: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct NewMemberContract {
        member: ContractAddress,
        contract_index: u32
    }


    #[embeddable_as(Member)]
    impl MemberImpl<
        TContractState, +HasComponent<TContractState>
    > of super::IMember<ComponentState<TContractState>> {

        // Only member managers can renew a develop contract of a member.
        fn new_member_contract(
            ref self: ComponentState<TContractState>, member_index: u32, contract: Contract
        ) {
            self._assert_is_member_manager();
            let member: ContractAddress = self.members.read(member_index);
            assert(self.member_status.read(member), Errors::MEMBER_NOT_ACTIVE);

            // New member contract here
            let count_member_contracts: u32 = self.count_member_contracts.read(member_index);

            self.member_contract_history.write((member_index, count_member_contracts), contract);

            self.count_member_contracts.write(member_index, count_member_contracts + 1);

            self.emit(NewMemberContract { member: member, contract_index: 1 });
        }

        // Only member managers can deactive developers
        fn disable_member(ref self: ComponentState<TContractState>, member: ContractAddress) {
            self._assert_is_member_manager();
            self.member_status.write(member, false);
            self.emit(DisableMember { member: member })
        }

        // Only member managers can change a developer contract
        // This function is useful if the contract changes after a salary negotiation.
        // Salary payment will be affected by completed tasks after the contract changed.
        fn update_contract(
            ref self: ComponentState<TContractState>,
            member_index: u32,
            contract_index: u32,
            contract: Contract
        ) {
            self._assert_is_member_manager();
            let member: ContractAddress = self.members.read(member_index);
            assert(self.member_status.read(member), Errors::MEMBER_NOT_ACTIVE);

            // Change contract here
            self.member_contract_history.write((member_index, contract_index), contract);
            // Emit
            self.emit(UpdateContract { member });
        }

        // Whether an account address is a member (developer) or not.
        fn is_member(self: @ComponentState<TContractState>, address: ContractAddress) -> bool {
            self.member_status.read(address)
        }

        // Get a list of DAO developers with pagination options.
        fn get_members(
            self: @ComponentState<TContractState>, offset: u32, page_size: u32
        ) -> Array<ContractAddress> {
            let mut members: Array<ContractAddress> = ArrayTrait::new();
            let mut i: u32 = 0;
            loop {
                if (i >= offset + page_size) {
                    break;
                }
                if (offset + i < self.count_members.read()) {
                    let member: ContractAddress = self.members.read(offset + i);
                    members.append(member);
                    i += 1;
                } else {
                    break;
                }
            };
            members
        }

        // Get a contracts history of a developer.
        fn get_member_contract_history(
            self: @ComponentState<TContractState>, member_index: u32
        ) -> Array<Contract> {
            let mut contracts: Array<Contract> = ArrayTrait::new();
            let mut i: u32 = 0;
            let count_member_contracts: u32 = self.count_member_contracts.read(member_index);
            loop {
                if (i >= count_member_contracts) {
                    break;
                }
                let contract: Contract = self.member_contract_history.read((member_index, i));
                contracts.append(contract);
                i += 1;
            };
            contracts
        }

        // Get the current contract of a developer.
        fn get_member_current_contract(
            self: @ComponentState<TContractState>, member_index: u32
        ) -> Option<Contract> {
            let count_member_contracts: u32 = self.count_member_contracts.read(member_index);
            let mut current_index: u32 = 0;
            if count_member_contracts > 0 {
                current_index = count_member_contracts - 1;
                Option::Some(self.member_contract_history.read((member_index, current_index)))
            } else {
                Option::None
            }
           
        }
        
        // Get a developer address by a member index.
        fn get_member_by_index(
            self: @ComponentState<TContractState>, member_index: u32
        ) -> ContractAddress {
            self.members.read(member_index)
        }
    }

    #[generate_trait]
    impl MemberInternalImpl<
        TContractState, +HasComponent<TContractState>
    > of MemberInternalTrait<TContractState> {

        // Only member managers can add a member (developer).
        // If the member address is existing, this action will be fail.
        fn _add_member(
            ref self: ComponentState<TContractState>,
            candidate: ContractAddress,
            job: Job,
            start_date: u128,
            end_date: u128
        ) {
            assert(!self.member_status.read(candidate), Errors::MEMBER_EXISTED);
            self._assert_is_member_manager();
          
            let current_contract: Contract = Contract {
                start_date: start_date,
                end_date: end_date,
                contract_type: job.job_type,
                fixed_price: job.fixed_price,
                hourly_rate: job.hourly_rate,
                pay_by_token: job.pay_by_token,
                status: true
            };

            let count_members: u32 = self.count_members.read();

            self.member_contract_history.write((count_members, 0), current_contract);

            self.members.write(count_members, candidate);
            self.member_status.write(candidate, true);
            self.count_member_contracts.write(count_members, 1);

            self.count_members.write(count_members + 1);

            self.emit(AddMember { member: candidate });
        }
        
        // Whether the caller is a member manager.
        fn _assert_is_member_manager(self: @ComponentState<TContractState>) {
            assert(self.member_managers.read(get_caller_address()), Errors::NOT_MEMBER_MANAGER);
        }

        // Only the DAO admin can add member managers.
        fn _add_member_managers(
            ref self: ComponentState<TContractState>, member_managers: Array<ContractAddress>
        ) {
            let len: u32 = member_managers.len().into();

            if (len > 0) {
                let mut i: u32 = 0;
                loop {
                    if (i >= len) {
                        break;
                    }
                    self.member_managers.write(*member_managers.at(i), true);
                    i += 1;
                }
            }
        }

        // Only the DAO admin can remove member managers.
        fn _remove_member_managers(
            ref self: ComponentState<TContractState>, member_managers: Array<ContractAddress>
        ) {
            let len: u32 = member_managers.len().into();

            if (len > 0) {
                let mut i: u32 = 0;
                loop {
                    if (i >= len) {
                        break;
                    }
                    self.member_managers.write(*member_managers.at(i), false);
                    i += 1;
                }
            }
        }
    }
}
