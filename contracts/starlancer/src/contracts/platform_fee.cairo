use starknet::ContractAddress;
#[starknet::interface]
trait IPlatformFee<TContractState> {
    fn get_rate_fee(self: @TContractState, rate_fee: u16) -> u16;
    fn set_rate_fee(ref self: TContractState, rate_fee: u16);
    fn get_discounted_rate_fee(
        self: @TContractState, token_address: ContractAddress, user_address: ContractAddress
    ) -> u16;
    fn check_balance(self: @TContractState, token_address: ContractAddress) -> u256;
    fn withdraw_fee(ref self: TContractState, token_address: ContractAddress);
    fn change_fee_recipient(ref self: TContractState, fee_recipient: ContractAddress);
    fn set_token_fee_discount(
        ref self: TContractState, token_address: ContractAddress, discount: u16
    );
    fn set_user_fee_discount(
        ref self: TContractState, user_address: ContractAddress, discount: u16
    );
}

#[starknet::contract]
mod PlatformFee {
    use openzeppelin::token::erc20::interface::IERC20DispatcherTrait;
    use openzeppelin::token::erc20::interface::IERC20Dispatcher;
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use starlancer::error::Errors;
    #[storage]
    struct Storage {
        rate_fee: u16,
        admin: ContractAddress,
        fee_recipient: ContractAddress,
        token_fee_discount: LegacyMap<ContractAddress, u16>,
        user_fee_discount: LegacyMap<ContractAddress, u16>
    }
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        WithdrawFee: WithdrawFee,
    }

    #[derive(Drop, starknet::Event)]
    struct WithdrawFee {
        caller: ContractAddress,
        amount: u256
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        rate_fee: u16,
        admin: ContractAddress,
        fee_recipient: ContractAddress
    ) {
        self.rate_fee.write(rate_fee);
        self.admin.write(admin);
        self.fee_recipient.write(fee_recipient);
    }

    #[abi(embed_v0)]
    impl PlatformFeeImpl of super::IPlatformFee<ContractState> {
        fn get_rate_fee(self: @ContractState, rate_fee: u16) -> u16 {
            self.rate_fee.read()
        }

        fn set_rate_fee(ref self: ContractState, rate_fee: u16) {
            assert(get_caller_address() == self.admin.read(), Errors::NOT_PLATFORM_FEE_ADMIN);
            self.rate_fee.write(rate_fee);
        }
        
        fn get_discounted_rate_fee(
            self: @ContractState, token_address: ContractAddress, user_address: ContractAddress
        ) -> u16 {
            let rate_fee: u16 = self.rate_fee.read();
            let token_fee_discount: u16 = self.token_fee_discount.read(token_address);
            let user_fee_discount: u16 = self.user_fee_discount.read(user_address);

            if (rate_fee > token_fee_discount + user_fee_discount) {
                return rate_fee - (token_fee_discount + user_fee_discount);
            } else {
                return 0;
            }
        }

        fn check_balance(self: @ContractState, token_address: ContractAddress) -> u256 {
            let erc20_dispatcher: IERC20Dispatcher = IERC20Dispatcher {
                contract_address: token_address
            };
            let balance: u256 = erc20_dispatcher.balance_of(get_contract_address());
            balance
        }
        fn withdraw_fee(ref self: ContractState, token_address: ContractAddress) {
            assert(get_caller_address() == self.admin.read(), Errors::NOT_PLATFORM_FEE_ADMIN);
            let erc20_dispatcher: IERC20Dispatcher = IERC20Dispatcher {
                contract_address: token_address
            };
            let balance: u256 = erc20_dispatcher.balance_of(get_contract_address());
            erc20_dispatcher.transfer(self.fee_recipient.read(), balance);
            self.emit(WithdrawFee { caller: get_caller_address(), amount: balance });
        }
        fn change_fee_recipient(ref self: ContractState, fee_recipient: ContractAddress) {
            assert(get_caller_address() == self.admin.read(), Errors::NOT_PLATFORM_FEE_ADMIN);
            self.fee_recipient.write(fee_recipient);
        }
        fn set_token_fee_discount(
            ref self: ContractState, token_address: ContractAddress, discount: u16
        ) {
            assert(get_caller_address() == self.admin.read(), Errors::NOT_PLATFORM_FEE_ADMIN);
            self.token_fee_discount.write(token_address, discount);
        }
        fn set_user_fee_discount(
            ref self: ContractState, user_address: ContractAddress, discount: u16
        ) {
            assert(get_caller_address() == self.admin.read(), Errors::NOT_PLATFORM_FEE_ADMIN);
            self.user_fee_discount.write(user_address, discount);
        }
    }
}
