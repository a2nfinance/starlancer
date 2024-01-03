use starknet::ContractAddress;
#[starknet::interface]
trait ITreasury<TContractState> {
    fn pay(ref self: TContractState, to: ContractAddress, pay_by_token: felt252, amount: u256);
}


#[starknet::component]
mod treasury_component {
    use core::traits::Into;
    use starknet::{ContractAddress, get_caller_address};
    #[storage]
    struct Storage {
        treasury_managers: LegacyMap<ContractAddress, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Pay: Pay,
    }

    #[derive(Drop, starknet::Event)]
    struct Pay {
        #[key]
        to: ContractAddress,
        amount: u256
    }


    #[embeddable_as(DAOTreasury)]
    impl TreasuryImpl<
        TContractState, +HasComponent<TContractState>
    > of super::ITreasury<ComponentState<TContractState>> {
        fn pay(
            ref self: ComponentState<TContractState>,
            to: ContractAddress,
            pay_by_token: felt252,
            amount: u256
        ) {
            self._assert_is_treasury_manager();
            // Payhere

            let mut call_data: Array<felt252> = ArrayTrait::new();
            Serde::serialize(@to, ref call_data);
            Serde::serialize(@amount, ref call_data);

            let token_contract: Option<ContractAddress> =
                starknet::contract_address_try_from_felt252(
                pay_by_token
            );

            match token_contract {
                Option::Some(token_address) => {
                    starknet::call_contract_syscall(
                        token_address, selector!("transfer"), call_data.span()
                    );
                },
                Option::None => { assert(false, 'Incorrect recipient'); }
            }

            // emit

            self.emit(Pay { to: to, amount: amount });
        }
    }

    #[generate_trait]
    impl TreasuryInternalImpl<
        TContractState, +HasComponent<TContractState>
    > of TreasuryInternalTrait<TContractState> {
        fn _assert_is_treasury_manager(self: @ComponentState<TContractState>) {
            assert(self.treasury_managers.read(get_caller_address()), 'Not member manager');
        }

        fn _add_treasury_managers(
            ref self: ComponentState<TContractState>, treasury_managers: Array<ContractAddress>
        ) {
            let len: u32 = treasury_managers.len().into();

            if (len > 0) {
                let mut i: u32 = 0;
                loop {
                    if (i >= len) {
                        break;
                    }
                    self.treasury_managers.write(*treasury_managers.at(i), true);
                    i += 1;
                }
            }
        }

        fn _remove_treasury_managers(
            ref self: ComponentState<TContractState>, treasury_managers: Array<ContractAddress>
        ) {
            let len: u32 = treasury_managers.len().into();

            if (len > 0) {
                let mut i: u32 = 0;
                loop {
                    if (i >= len) {
                        break;
                    }
                    self.treasury_managers.write(*treasury_managers.at(i), false);
                    i += 1;
                }
            }
        }
    }
}
