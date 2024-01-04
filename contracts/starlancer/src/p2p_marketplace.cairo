use starlancer::types::{Job, Task, TaskStatus};
#[starknet::interface]
trait IP2PJobsMarketplace<TContractState> {
    fn create_job_task(ref self: TContractState, local_job_index: u32, task: Task);
    fn get_job_payment_amount(self: @TContractState, local_job_index: u32) -> u256;
    fn pay_dev(ref self: TContractState, local_job_index: u32);
    fn change_job_task_status(
        ref self: TContractState, local_job_index: u32, task_index: u32, status: TaskStatus
    );
}

#[starknet::contract]
mod P2PJobsMarketplace {
    use openzeppelin::token::erc20::interface::IERC20DispatcherTrait;
    use starknet::{ContractAddress, get_caller_address};
    use starlancer::types::{Job, Task, TaskStatus};
    use starlancer::p2p::job::job_component;
    use starlancer::p2p::task::task_component;
    use openzeppelin::token::erc20::interface::IERC20Dispatcher;

    component!(path: job_component, storage: p2p_jobs, event: P2PJobEvent);
    component!(path: task_component, storage: p2p_tasks, event: P2PTaskEvent);

    #[abi(embed_v0)]
    impl P2PJobImpl = job_component::P2PJob<ContractState>;
    impl P2PJobInternalImpl = job_component::P2PJobInternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl P2PTaskImpl = task_component::P2PTask<ContractState>;
    impl P2PTaskInternalImpl = task_component::P2PTaskInternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        p2p_jobs: job_component::Storage,
        #[substorage(v0)]
        p2p_tasks: task_component::Storage
    }
    
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        P2PJobEvent: job_component::Event,
        P2PTaskEvent: task_component::Event
    }


    #[abi(embed_v0)]
    impl P2PJobsMarketplaceImpl of super::IP2PJobsMarketplace<ContractState> {
        fn create_job_task(ref self: ContractState, local_job_index: u32, task: Task) {
            P2PJobInternalImpl::_assert_is_employer(@self.p2p_jobs, local_job_index);
            let (global_index, _): (u32, Job) = P2PJobInternalImpl::_get_job_from_local_index(
                @self.p2p_jobs, get_caller_address(), local_job_index
            );
            P2PTaskInternalImpl::_create_task(ref self.p2p_tasks, global_index, task);
        }

        fn change_job_task_status(
            ref self: ContractState, local_job_index: u32, task_index: u32, status: TaskStatus
        ) {
            P2PJobInternalImpl::_assert_is_employer(@self.p2p_jobs, local_job_index);
            let (global_index, _): (u32, Job) = P2PJobInternalImpl::_get_job_from_local_index(
                @self.p2p_jobs, get_caller_address(), local_job_index
            );
            P2PTaskInternalImpl::_change_task_status(
                ref self.p2p_tasks, global_index, task_index, status
            );
        }

        fn get_job_payment_amount(self: @ContractState, local_job_index: u32) -> u256 {
            let (global_index, job): (u32, Job) = P2PJobInternalImpl::_get_job_from_local_index(
                self.p2p_jobs, get_caller_address(), local_job_index
            );
            P2PTaskInternalImpl::_get_payment_amount(self.p2p_tasks, global_index, job)
        }

        fn pay_dev(ref self: ContractState, local_job_index: u32) {
            P2PJobInternalImpl::_assert_is_employer(@self.p2p_jobs, local_job_index);
            let (global_index, job): (u32, Job) = P2PJobInternalImpl::_get_job_from_local_index(
                @self.p2p_jobs, get_caller_address(), local_job_index
            );
            let total_amount: u256 = P2PTaskInternalImpl::_calculate_billing(
                ref self.p2p_tasks, local_job_index, job
            );
            let candidate_index: u32 = self
                .p2p_jobs
                .accepted_candidate
                .read((get_caller_address(), local_job_index));
            let dev: ContractAddress = self
                .p2p_jobs
                .candidates
                .read((global_index, candidate_index));

            // Transfer here

            let token_address: Option<ContractAddress> =
                starknet::contract_address_try_from_felt252(
                job.pay_by_token
            );

            match token_address {
                Option::Some(address) => {
                    let erc20_dispatcher: IERC20Dispatcher = IERC20Dispatcher {
                        contract_address: address
                    };
                    erc20_dispatcher.transfer_from(job.creator, dev, total_amount);
                },
                Option::None => { assert(false, 'Token address is not correct'); },
            }
        }
    }
}
