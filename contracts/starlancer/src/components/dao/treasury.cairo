use starknet::ContractAddress;
#[starknet::interface]
trait ITreasury<TContractState> {
    fn pay(
        ref self: TContractState, to: ContractAddress, pay_by_token: ContractAddress, amount: u256
    );
    fn fund(ref self: TContractState, token_address: ContractAddress, amount: u256);
    fn add_whitelisted_contributor(ref self: TContractState, contributor: ContractAddress);
    fn remove_whitelisted_contributor(ref self: TContractState, contributor: ContractAddress);
    fn is_whitedlisted_contributor(self: @TContractState, user: ContractAddress) -> bool;
    fn get_token_balance(self: @TContractState, token_address: ContractAddress) -> u256;
}

#[starknet::component]
mod treasury_component {
    use core::traits::Into;
    use openzeppelin::token::erc20::interface::IERC20DispatcherTrait;
    use openzeppelin::token::erc20::interface::IERC20Dispatcher;
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use starlancer::error::Errors;
    use starlancer::contracts::platform_fee::IPlatformFeeDispatcherTrait;
    use starlancer::contracts::platform_fee::IPlatformFeeDispatcher;

    #[storage]
    struct Storage {
        // Store token balance of a DAO. Key: token address, value: amount.
        token_balances: LegacyMap<ContractAddress, u256>,
        // Store whitelisted contributors
        whitelisted_contributors: LegacyMap<ContractAddress, bool>,
        // Store treasury managers
        treasury_managers: LegacyMap<ContractAddress, bool>,
        // Store the address of PlatformFee contract.
        platform_fee: ContractAddress
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

        // Only treasury managers can pay developers based on their completed tasks.
        // This action inlcude two steps:
        // - Send an amount of ERC20 token to the developer.
        // - Send an amount of ERC20 token to the PlatformFee contract.
        // The service fee can be different for each token or DAO.
        fn pay(
            ref self: ComponentState<TContractState>,
            to: ContractAddress,
            pay_by_token: ContractAddress,
            amount: u256
        ) {
            self._assert_is_treasury_manager();

            let erc20_dispatcher: IERC20Dispatcher = IERC20Dispatcher {
                contract_address: pay_by_token
            };

            let platform_fee_dispatcher: IPlatformFeeDispatcher = IPlatformFeeDispatcher {
                contract_address: self.platform_fee.read()
            };

            let discounted_rate_fee: u16 = platform_fee_dispatcher
                .get_discounted_rate_fee(pay_by_token, get_contract_address());
            let fee: u256 = amount * discounted_rate_fee.into() / 10000;
            let balance: u256 = erc20_dispatcher.balance_of(get_contract_address());

            assert(balance > fee + amount, Errors::NOT_ENOUGH_BALANCE);

            erc20_dispatcher.transfer(to, amount);
            
            if (fee > 0) {
                erc20_dispatcher.transfer(self.platform_fee.read(), fee);
            }

            // emit
            self.emit(Pay { to: to, amount: amount });
        }


        // Only whitelisted contributors can fund the DAO.
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

        // Get a token balance.
        fn get_token_balance(
            self: @ComponentState<TContractState>, token_address: ContractAddress
        ) -> u256 {
            self.token_balances.read(token_address)
        }
        
        // Only treasury managers can add whitelisted_contributors.
        fn add_whitelisted_contributor(
            ref self: ComponentState<TContractState>, contributor: ContractAddress
        ) {
            self._assert_is_treasury_manager();
            self.whitelisted_contributors.write(contributor, true);
        }

        // Only treasury managers can remove whitelisted_contributors.
        fn remove_whitelisted_contributor(
            ref self: ComponentState<TContractState>, contributor: ContractAddress
        ) {
            self._assert_is_treasury_manager();
            self.whitelisted_contributors.write(contributor, false);
        }

        // Whether an account address is in whitelisted contributors
        fn is_whitedlisted_contributor(self: @ComponentState<TContractState>, user: ContractAddress) -> bool {
            self.whitelisted_contributors.read(user)
        }
    }

    #[generate_trait]
    impl TreasuryInternalImpl<
        TContractState, +HasComponent<TContractState>
    > of TreasuryInternalTrait<TContractState> {

        // Initial the platform_fee contract address
        fn _init_platform_fee(ref self: ComponentState<TContractState>, platform_fee: ContractAddress) {
            self.platform_fee.write(platform_fee);
        }

        // Whether the caller is a treasury manager
        fn _assert_is_treasury_manager(self: @ComponentState<TContractState>) {
            assert(self.treasury_managers.read(get_caller_address()), Errors::NOT_TREASURY_MANAGER);
        }

        // Only the DAO admin can add treasury_managers.
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

        // Only the DAO admin can remove treasury_managers.
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
