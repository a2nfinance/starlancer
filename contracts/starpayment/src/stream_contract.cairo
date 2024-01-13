use starpayment::types::{Stream};
use starknet::{ContractAddress};

#[starknet::interface]
trait ICryptoStream<TContractState> {
    fn new_stream(ref self: TContractState, stream: Stream);
    fn cancel_stream(ref self: TContractState, stream_index: u64);
    fn transfer_stream(ref self: TContractState, stream_index: u64);
    fn withdraw_stream(ref self: TContractState, stream_index: u64);
    fn send_fund(ref self: TContractState, token_address: ContractAddress, amount: u256);
    fn get_recipient_streams(
        self: @TContractState, recipient: ContractAddress, offset: u64, page_size: u64
    ) -> Array<Stream>;
    fn get_sender_streams(
        self: @TContractState, sender: ContractAddress, offset: u64, page_size: u64
    ) -> Array<Stream>;
}

#[starknet::contract]
mod CryptoStream {
    use starknet::{ContractAddress};
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
        total_stream_fund: LegacyMap::<(i, ContractAddress), u256>,
        withdrew_stream: LegacyMap::<(i, ContractAddress), u256>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CreateStream: CreateStream
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

    #[abi(embed_v0)]
    impl CryptoStreamImpl of super::ICryptoStream<ContractState> {
        fn new_stream(ref self: ContractState, stream: Stream) {
            let count_streams: u64 = self.count_streams.read();
            let count_recipient_streams: u64 = self.count_recipient_streams.read(stream.recipient);
            let count_sender_streams: u64 = self.count_recipient_streams.read(stream.sender);
            self.streams.write(count_streams, stream);
            self
                .streams_of_recipient
                .write((count_recipient_streams, stream.recipient), count_streams);
            self.streams_of_sender.write((count_sender_streams, stream.sender), count_streams);
            self.count_streams.write(count_streams + 1);
            self.count_recipient_streams.write(stream.recipient, count_recipient_streams + 1);
            self.count_sender_streams.write(stream.sender, count_sender_streams + 1)
        }
        fn cancel_stream(ref self: ContractState, stream_index: u64) {// Check previlege

        // Change status

        }
        fn transfer_stream(ref self: ContractState, stream_index: u64) {// Check previlege

        // Change status
        }
        fn withdraw_stream(ref self: ContractState, stream_index: u64) {// Calculate payment amount
        // Token transfer
        }
        fn send_fund(ref self: ContractState, token_address: ContractAddress, amount: u256) {}
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
                        .read(self.streams_of_recipient.read((offset + i, sender)));
                    streams.append(stream);
                    i += 1;
                } else {
                    break;
                }
            };
            streams
        }
    }
}
