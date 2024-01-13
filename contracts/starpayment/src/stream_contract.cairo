use starpayment::types::{Stream};
use starknet::{ContractAddress};

#[starknet::interface]
trait ICryptoStream<TContractState> {
    fn new_stream(ref self: TContractState, stream: Stream);
    fn cancel_stream(ref self: TContractState, stream_index: u64);
    fn transfer_stream(ref self: TContractState, stream_index: u64, new_recipient: ContractAddress);
    fn withdraw_stream(ref self: TContractState, stream_index: u64);
    fn send_fund(
        ref self: TContractState, token_address: ContractAddress, amount: u256, stream_index: u64
    );
    fn get_recipient_streams(
        self: @TContractState, recipient: ContractAddress, offset: u64, page_size: u64
    ) -> Array<Stream>;
    fn get_sender_streams(
        self: @TContractState, sender: ContractAddress, offset: u64, page_size: u64
    ) -> Array<Stream>;

    fn get_stream_token_info(self: @TContractState, stream_index: u64 ) -> (u256, u256);
}

#[starknet::contract]
mod CryptoStream {
    use starpayment::stream_contract::ICryptoStream;
    use core::traits::TryInto;
    use core::traits::Into;
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starpayment::types::{Stream};
    use openzeppelin::token::erc20::interface::IERC20DispatcherTrait;
    use openzeppelin::token::erc20::interface::IERC20Dispatcher;
    #[storage]
    struct Storage {
        streams: LegacyMap::<u64, Stream>,
        count_streams: u64,
        // Local stream index, recipient address
        streams_of_recipient: LegacyMap::<(u64, ContractAddress), u64>,
        // Local stream index, sender address
        streams_of_sender: LegacyMap::<(u64, ContractAddress), u64>,
        count_recipient_streams: LegacyMap::<ContractAddress, u64>,
        count_sender_streams: LegacyMap::<ContractAddress, u64>,
        // index, token, amount
        total_stream_fund: LegacyMap::<(u64, ContractAddress), u256>,
        stream_balance: LegacyMap::<(u64, ContractAddress), u256>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CreateStream: CreateStream,
        CancelStream: CancelStream,
        WithdrawStream: WithdrawStream,
        TransferStream: TransferStream
    }

    #[derive(Drop, starknet::Event)]
    struct CreateStream {
        #[key]
        index: u64,
        #[key]
        sender: ContractAddress,
        #[key]
        recipient: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct CancelStream {
        #[key]
        index: u64,
        #[key]
        caller: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct TransferStream {
        #[key]
        index: u64,
        #[key]
        caller: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct WithdrawStream {
        #[key]
        index: u64,
        #[key]
        recipient: ContractAddress,
        #[key]
        amount: u256
    }

    #[abi(embed_v0)]
    impl CryptoStreamImpl of super::ICryptoStream<ContractState> {
        fn new_stream(ref self: ContractState, stream: Stream) {
            let count_streams: u64 = self.count_streams.read();
            let count_recipient_streams: u64 = self.count_recipient_streams.read(stream.recipient);
            let count_sender_streams: u64 = self.count_recipient_streams.read(stream.sender);
            self
                .streams
                .write(
                    count_streams,
                    Stream {
                        index: count_streams,
                        title: stream.title,
                        sender: stream.sender,
                        recipient: stream.recipient,
                        start_date: stream.start_date,
                        unlock_amount_each_time: stream.unlock_amount_each_time,
                        // s,h,min,week,month,y
                        unlock_type: stream.unlock_type,
                        unlock_every: stream.unlock_every,
                        unlock_number: stream.unlock_number,
                        // 0: only sender, 1: only recipient, 2: both, 3: no one
                        cancel_previlege: stream.cancel_previlege,
                        transfer_previlege: stream.transfer_previlege,
                        pay_by_token: stream.pay_by_token,
                        prepaid: stream.prepaid,
                        // 1: active, 2: cancel
                        status: 1
                    }
                );
            self
                .streams_of_recipient
                .write((count_recipient_streams, stream.recipient), count_streams);
            self.streams_of_sender.write((count_sender_streams, stream.sender), count_streams);
            self.count_streams.write(count_streams + 1);
            self.count_recipient_streams.write(stream.recipient, count_recipient_streams + 1);
            self.count_sender_streams.write(stream.sender, count_sender_streams + 1);
        }
        fn cancel_stream(ref self: ContractState, stream_index: u64) { // Check previlege
            // Change status
            self._assert_cancel_previlege(stream_index);
            let stream: Stream = self.streams.read(stream_index);
            self.withdraw_stream(stream_index);
            let balance: u256 = self.stream_balance.read((stream_index, stream.pay_by_token));
            let amount: u256 = self._calculate_available_amount(stream_index);
            if (balance > amount) {
                let erc20_dispatcher: IERC20Dispatcher = IERC20Dispatcher {
                    contract_address: stream.pay_by_token
                };
                // refund sender
                erc20_dispatcher.transfer(stream.sender, balance - amount);
            }
            self
                .streams
                .write(
                    stream_index,
                    Stream {
                        index: stream_index,
                        title: stream.title,
                        sender: stream.sender,
                        recipient: stream.recipient,
                        start_date: stream.start_date,
                        unlock_amount_each_time: stream.unlock_amount_each_time,
                        // s,h,min,week,month,y
                        unlock_type: stream.unlock_type,
                        unlock_every: stream.unlock_every,
                        unlock_number: stream.unlock_number,
                        // 0: only sender, 1: only recipient, 2: both, 3: no one
                        cancel_previlege: stream.cancel_previlege,
                        transfer_previlege: stream.transfer_previlege,
                        pay_by_token: stream.pay_by_token,
                        prepaid: stream.prepaid,
                        // 1: active, 2: cancel
                        status: 2
                    }
                );

            self.emit(CancelStream { index: stream_index, caller: get_caller_address() });
        }
        fn transfer_stream(
            ref self: ContractState, stream_index: u64, new_recipient: ContractAddress
        ) { // Check previlege
            // Change status
            self._assert_transfer_previlege(stream_index);
            let stream: Stream = self.streams.read(stream_index);
            assert(stream.recipient != new_recipient, 'Same recipient');
            self.withdraw_stream(stream_index);

            self
                .streams
                .write(
                    stream_index,
                    Stream {
                        index: stream_index,
                        title: stream.title,
                        sender: stream.sender,
                        recipient: new_recipient,
                        start_date: stream.start_date,
                        unlock_amount_each_time: stream.unlock_amount_each_time,
                        // s,h,min,week,month,y
                        unlock_type: stream.unlock_type,
                        unlock_every: stream.unlock_every,
                        unlock_number: stream.unlock_number,
                        // 0: only sender, 1: only recipient, 2: both, 3: no one
                        cancel_previlege: stream.cancel_previlege,
                        transfer_previlege: stream.transfer_previlege,
                        pay_by_token: stream.pay_by_token,
                        prepaid: stream.prepaid,
                        // 1: active, 2: cancel
                        status: 1
                    }
                );

            self.emit(TransferStream { index: stream_index, caller: get_caller_address() });
        }
        fn withdraw_stream(ref self: ContractState, stream_index: u64) {
            let stream: Stream = self.streams.read(stream_index);
            let balance: u256 = self.stream_balance.read((stream_index, stream.pay_by_token));
            let amount: u256 = self._calculate_available_amount(stream_index);
            assert(stream.recipient == get_caller_address(), 'Not recipient');
            assert(balance >= amount, 'Balance < amount');
            let erc20_dispatcher: IERC20Dispatcher = IERC20Dispatcher {
                contract_address: stream.pay_by_token
            };

            erc20_dispatcher.transfer(stream.recipient, amount);
            self.stream_balance.write((stream_index, stream.pay_by_token), balance - amount);
            self
                .emit(
                    WithdrawStream {
                        index: stream_index, recipient: stream.recipient, amount: amount
                    }
                );
        }

        fn send_fund(
            ref self: ContractState, token_address: ContractAddress, amount: u256, stream_index: u64
        ) {
            assert(amount > 0, 'Amount<=0');
            let stream: Stream = self.streams.read(stream_index);
            assert(stream.sender == get_caller_address(), 'Not sender');
            assert(stream.pay_by_token == token_address, 'Not correct token');
            let current_fund: u256 = self.total_stream_fund.read((stream_index, token_address));
            let current_balance: u256 = self.stream_balance.read((stream_index, token_address));
            self.total_stream_fund.write((stream_index, token_address), current_fund + amount);
            self.stream_balance.write((stream_index, token_address), current_balance + amount);
        }

        fn get_recipient_streams(
            self: @ContractState, recipient: ContractAddress, offset: u64, page_size: u64
        ) -> Array<Stream> {
            let mut streams: Array<Stream> = ArrayTrait::new();
            let mut i: u64 = 0;
            loop {
                if (i >= offset + page_size) {
                    break;
                }
                if (offset + i < self.count_recipient_streams.read(recipient)) {
                    let stream: Stream = self
                        .streams
                        .read(self.streams_of_recipient.read((offset + i, recipient)));
                    streams.append(stream);
                    i += 1;
                } else {
                    break;
                }
            };
            streams
        }

        fn get_sender_streams(
            self: @ContractState, sender: ContractAddress, offset: u64, page_size: u64
        ) -> Array<Stream> {
            let mut streams: Array<Stream> = ArrayTrait::new();
            let mut i: u64 = 0;
            loop {
                if (i >= offset + page_size) {
                    break;
                }
                if (offset + i < self.count_sender_streams.read(sender)) {
                    let stream: Stream = self
                        .streams
                        .read(self.streams_of_sender.read((offset + i, sender)));
                    streams.append(stream);
                    i += 1;
                } else {
                    break;
                }
            };
            streams
        }

        fn get_stream_token_info(self: @ContractState, stream_index: u64 ) -> (u256, u256) {
            let stream: Stream = self.streams.read(stream_index);
            let current_fund: u256 = self.total_stream_fund.read((stream_index, stream.pay_by_token));
            let current_balance: u256 = self.stream_balance.read((stream_index, stream.pay_by_token));

            (current_fund, current_balance)
        }
    }

    #[generate_trait]
    impl CryptoStreamInternalImpl of InternalFunctionsTrait {
        fn _calculate_available_amount(self: @ContractState, stream_index: u64) -> u256 {
            let mut amount: u256 = 0;
            let stream: Stream = self.streams.read(stream_index);
            let unlock_number: u64 = stream.unlock_number;
            let start_date: u64 = stream.start_date;
            let diff_timestamp: u64 = (get_block_timestamp() - start_date);
            if (diff_timestamp <= 0) {
                return 0;
            }
            let mut available_unlock: u64 = diff_timestamp
                / self._convert_unlock_every_to_second(stream.unlock_every, stream.unlock_type);

            if (available_unlock >= unlock_number) {
                available_unlock = unlock_number;
            }

            let withdrew_amount: u256 = self
                .total_stream_fund
                .read((stream_index, stream.pay_by_token))
                - self.stream_balance.read((stream_index, stream.pay_by_token));

            let total_unlock_amount = available_unlock.into() * stream.unlock_amount_each_time;
            let prepaid = stream.prepaid;
            if (withdrew_amount > 0) {
                amount = total_unlock_amount + prepaid - withdrew_amount;
            } else {
                amount = total_unlock_amount + prepaid;
            }
            amount
        }
        fn _convert_unlock_every_to_second(
            self: @ContractState, unlock_every: u64, unlock_type: u8
        ) -> u64 {
            if (unlock_type == 1) {
                return unlock_every * 60;
            }

            if (unlock_type == 2) {
                return unlock_every * 3600;
            }

            if (unlock_type == 3) {
                return unlock_every * 3600 * 24;
            }

            if (unlock_type == 4) {
                return unlock_every * 3600 * 24 * 7;
            }

            if (unlock_type == 5) {
                return unlock_every * 3600 * 24 * 30;
            }

            if (unlock_type == 6) {
                return unlock_every * 3600 * 24 * 365;
            }

            unlock_every
        }

        fn _assert_cancel_previlege(self: @ContractState, stream_index: u64) {
            let stream: Stream = self.streams.read(stream_index);
            let caller_address: ContractAddress = get_caller_address();
            let cancel_previlege: u8 = stream.cancel_previlege;
            if (cancel_previlege == 0) {
                assert(caller_address == stream.sender, 'Not sender');
            }

            if (cancel_previlege == 1) {
                assert(caller_address == stream.recipient, 'Not recipient');
            }

            if (cancel_previlege == 3) {
                assert(
                    caller_address == stream.recipient || caller_address == stream.sender,
                    'Not sender or recipient'
                );
            }

            if (cancel_previlege == 4) {
                assert(false, 'No one can cancel');
            }
        }

        fn _assert_transfer_previlege(self: @ContractState, stream_index: u64) {
            let stream: Stream = self.streams.read(stream_index);
            let caller_address: ContractAddress = get_caller_address();
            let transfer_previlege: u8 = stream.transfer_previlege;
            if (transfer_previlege == 0) {
                assert(caller_address == stream.sender, 'Not sender');
            }

            if (transfer_previlege == 1) {
                assert(caller_address == stream.recipient, 'Not recipient');
            }

            if (transfer_previlege == 3) {
                assert(
                    caller_address == stream.recipient || caller_address == stream.sender,
                    'Not sender or recipient'
                );
            }

            if (transfer_previlege == 4) {
                assert(false, 'No one can transfer');
            }
        }
    }
}
