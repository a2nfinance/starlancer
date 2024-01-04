use starknet::ContractAddress;
use starlancer::types::{Task};
#[starknet::interface]
trait IP2PTask<TContractState> {
    fn get_job_tasks(self: @TContractState, job_index: u32) -> Array<Task>;
}

#[starknet::component]
mod task_component {
    use starknet::{get_caller_address, ContractAddress};
    use starlancer::p2p::task::IP2PTask;
    use starlancer::types::{Task, Job, TaskStatus, ContractType};
    #[storage]
    struct Storage {
        // job_index, index of a task of a job, task
        job_tasks: LegacyMap::<(u32, u32), Task>,
        // job_index, number of tasks of a job
        count_job_tasks: LegacyMap::<u32, u32>,
        // job_index, index of a task of a job, paid or not paid
        paid_tasks: LegacyMap::<(u32, u32), bool>
    }


    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CreateTask: CreateTask,
        ChangeTaskStatus: ChangeTaskStatus
    }

    #[derive(Drop, starknet::Event)]
    struct CreateTask {
        #[key]
        creator: ContractAddress,
        #[key]
        job_index: u32,
        task_index: u32
    }

    #[derive(Drop, starknet::Event)]
    struct ChangeTaskStatus {
        #[key]
        job_index: u32,
        #[key]
        task_index: u32,
        status: TaskStatus
    }

    #[embeddable_as(P2PTask)]
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
            ref self: ComponentState<TContractState>, job_index: u32, job: Job
        ) -> u256 {
            let mut total_amount: u256 = 0;
            match job.job_type {
                ContractType::FIXED_PRICE => { total_amount = job.fixed_price; },
                ContractType::HOURY => {
                    let mut i: u32 = 0;
                    let count_job_tasks: u32 = self.count_job_tasks.read(job_index);
                    loop {
                        if (i >= count_job_tasks) {
                            break;
                        }
                        let task: Task = self.job_tasks.read((job_index, i));
                        let is_completed_task = match task.status {
                            TaskStatus::OPEN => false,
                            TaskStatus::ASSIGNED => false,
                            TaskStatus::PENDING => false,
                            TaskStatus::TESTING => false,
                            TaskStatus::REVIEWING => false,
                            TaskStatus::COMPLETE => true,
                            TaskStatus::CANCELLED => false
                        };

                        if (is_completed_task) {
                            let is_paid: bool = self.paid_tasks.read((job_index, i));

                            if (is_paid) {
                                break;
                            }

                            total_amount += task.estimate.into() * job.hourly_rate;
                            self.paid_tasks.write((job_index, i), true);
                        }
                        i += 1;
                    };
                },
            }

            total_amount
        }

        // Need to check jobs owner permission in the main contract
        fn _create_task(ref self: ComponentState<TContractState>, job_index: u32, task: Task) {
            let count_job_tasks: u32 = self.count_job_tasks.read(job_index);
            self
                .job_tasks
                .write(
                    (job_index, count_job_tasks),
                    Task {
                        creator: get_caller_address(),
                        start_date: task.start_date,
                        deadline: task.deadline,
                        title: task.title,
                        short_description: task.short_description,
                        task_detail: task.task_detail,
                        estimate: task.estimate,
                        task_type: task.task_type,
                        status: TaskStatus::OPEN,
                    }
                );

            self.count_job_tasks.write(job_index, count_job_tasks + 1);
            self
                .emit(
                    CreateTask {
                        creator: get_caller_address(),
                        job_index: job_index,
                        task_index: count_job_tasks
                    }
                );
        }

        // Need to check jobs owner permission in the main contract
        fn _change_task_status(
            ref self: ComponentState<TContractState>,
            job_index: u32,
            task_index: u32,
            status: TaskStatus
        ) {
            let task: Task = self.job_tasks.read((job_index, task_index));
            let allow_change_status = match task.status {
                TaskStatus::OPEN => true,
                TaskStatus::ASSIGNED => true,
                TaskStatus::PENDING => true,
                TaskStatus::TESTING => true,
                TaskStatus::REVIEWING => true,
                TaskStatus::COMPLETE => false,
                TaskStatus::CANCELLED => false
            };
            assert(allow_change_status, 'Not allow change status');
            self
                .job_tasks
                .write(
                    (job_index, task_index),
                    Task {
                        creator: get_caller_address(),
                        start_date: task.start_date,
                        deadline: task.deadline,
                        title: task.title,
                        short_description: task.short_description,
                        task_detail: task.task_detail,
                        estimate: task.estimate,
                        task_type: task.task_type,
                        status: status,
                    }
                );
            // emit here
            self
                .emit(
                    ChangeTaskStatus {
                        job_index: job_index, task_index: task_index, status: status
                    }
                )
        }
    }
}
