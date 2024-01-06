use starknet::ContractAddress;
#[starknet::interface]
trait ITreasury<TContractState> {
    fn pay(
        ref self: TContractState, to: ContractAddress, pay_by_token: ContractAddress, amount: u256
    );
    fn fund(ref self: TContractState, token_address: ContractAddress, amount: u256);
    fn add_whitelisted_contributor(ref self: TContractState, contributor: ContractAddress);
    fn remove_whitelisted_contributor(ref self: TContractState, contributor: ContractAddress);
    fn get_token_balance(self: @TContractState, token_address: ContractAddress) -> u256;
}

#[starknet::component]
mod treasury_component {
    use core::traits::Into;
    use openzeppelin::token::erc20::interface::IERC20DispatcherTrait;
    use openzeppelin::token::erc20::interface::IERC20Dispatcher;
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use starlancer::error::Errors;

    #[storage]
    struct Storage {
        token_balances: LegacyMap<ContractAddress, u256>,
        whitelisted_contributors: LegacyMap<ContractAddress, bool>,
        treasury_managers: LegacyMap<ContractAddress, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Pay: Pay,
        Fund: Fund
    }

    #[derive(Drop, starknet::Event)]
    struct Pay {
        #[key]
        to: ContractAddress,
        amount: u256
    }

    #[derive(Drop, starknet::Event)]
    struct Fund {
        #[key]
        from: ContractAddress,
        amount: u256
    }


    #[embeddable_as(DAOTreasury)]
    impl TreasuryImpl<
        TContractState, +HasComponent<TContractState>
    > of super::ITreasury<ComponentState<TContractState>> {
        fn pay(
            ref self: ComponentState<TContractState>,
            to: ContractAddress,
            pay_by_token: ContractAddress,
            amount: u256
        ) {
            self._assert_is_treasury_manager();
            // Payhere

            let mut call_data: Array<felt252> = ArrayTrait::new();
            Serde::serialize(@to, ref call_data);
            Serde::serialize(@amount, ref call_data);

            let erc20_dispatcher: IERC20Dispatcher = IERC20Dispatcher {
                contract_address: pay_by_token
            };
            erc20_dispatcher.transfer(to, amount);

            // emit

            self.emit(Pay { to: to, amount: amount });
        }


        fn fund(
            ref self: ComponentState<TContractState>, token_address: ContractAddress, amount: u256
        ) {
            let caller: ContractAddress = get_caller_address();

            assert(self.whitelisted_contributors.read(caller), Errors::NOT_WHITELISTED_CONTRIBUTOR);

            let current_token_balance: u256 = self.token_balances.read(token_address);

            self.token_balances.write(token_address, current_token_balance + amount);

            let erc20_dispatcher: IERC20Dispatcher = IERC20Dispatcher {
                contract_address: token_address
            };

            erc20_dispatcher.transfer_from(caller, get_contract_address(), amount);

            self.emit(Fund { from: caller, amount: amount });
        }

        fn get_token_balance(
            self: @ComponentState<TContractState>, token_address: ContractAddress
        ) -> u256 {
            self.token_balances.read(token_address)
        }
        fn add_whitelisted_contributor(
            ref self: ComponentState<TContractState>, contributor: ContractAddress
        ) {
            self._assert_is_treasury_manager();
            self.whitelisted_contributors.write(contributor, true);
        }
        fn remove_whitelisted_contributor(
            ref self: ComponentState<TContractState>, contributor: ContractAddress
        ) {
            self._assert_is_treasury_manager();
            self.whitelisted_contributors.write(contributor, false);
        }
    }

    #[generate_trait]
    impl TreasuryInternalImpl<
        TContractState, +HasComponent<TContractState>
    > of TreasuryInternalTrait<TContractState> {
        fn _assert_is_treasury_manager(self: @ComponentState<TContractState>) {
            assert(self.treasury_managers.read(get_caller_address()), Errors::NOT_TREASURY_MANAGER);
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
