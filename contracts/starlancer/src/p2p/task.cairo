use starknet::ContractAddress;
use starlancer::types::{Task};
#[starknet::interface]
trait IP2PTask<TContractState> {
    fn get_job_tasks(self: @TContractState, job_index: u32) -> Array<Task>;
}

#[starknet::component]
mod task_component {
    use starlancer::p2p::task::IP2PTask;
use starlancer::types::{Task, Job};
    #[storage]
    struct Storage {
        job_tasks: LegacyMap::<(u32, u32), Task>,
        count_job_tasks: LegacyMap::<u32, u32>,
    }

    #[embeddable_as(DAOJobs)]
    impl P2PTaskImpl<
        TContractState, +HasComponent<TContractState>
    > of super::IP2PTask<ComponentState<TContractState>> {
        fn get_job_tasks(self: @ComponentState<TContractState>, job_index: u32) -> Array<Task> {
            let mut tasks: Array<Task> = ArrayTrait::new();
            let mut i: u32 = 0;
            let count_job_tasks: u32 = self.count_job_tasks.read(job_index);
            loop {
                if (i >= count_job_tasks) {
                    break;
                }
                let task: Task = self.job_tasks.read((job_index, i));
                tasks.append(task);
                i += 1;
            };

            tasks
        }
    }

    #[generate_trait]
    impl P2PTaskInternalImpl<
        TContractState, +HasComponent<TContractState>
    > of P2PTaskInternalImplTrait<TContractState> {
        fn _calculate_billing(
            self: @ComponentState<TContractState>, job_index: u32, job: Job
        ) -> u256 {
            let mut total_amount: u256 = 0;
            let mut i: u32 = 0;
            let count_job_tasks: u32 = self.count_job_tasks.read(job_index);
            loop {
                if (i >= count_job_tasks) {
                    break;
                }
                let task: Task = self.job_tasks.read((job_index, i));
                
                i += 1;
            };

            total_amount
        }

        fn _create_task(ref self: ComponentState<TContractState>, job_index: u32, task: Task) {}
    }
}
