use starknet::ContractAddress;
use starlancer::types::{Task, Job};
#[starknet::interface]
trait IP2PTask<TContractState> {
    fn get_job_tasks(self: @TContractState, job_index: u32) -> Array<Task>;
}

#[starknet::component]
mod task_component {
    use starknet::{get_caller_address, ContractAddress};
    use starlancer::types::{Task, Job, TaskStatus, ContractType};
    use starlancer::error::Errors;

    #[storage]
    struct Storage {
        // Key: (global_job_index, index of a task of a job), value: task
        job_tasks: LegacyMap::<(u32, u32), Task>,
        // Key: global_job_index, value: num of tasks of a job
        count_job_tasks: LegacyMap::<u32, u32>,
        // key (global_job_index, index of a task of a job), value: paid or not paid
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
        // Get all tasks of a job based on global_job_index
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
        // Get a DEV payment amount based on completed tasks.
        // This function doesn't change the contract storage
        fn _get_payment_amount(
            self: @ComponentState<TContractState>, job_index: u32, job: Job
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
                                i += 1;
                                continue;
                            }

                            total_amount += task.estimate.into() * job.hourly_rate;
                        }
                        i += 1;
                    };
                },
            }

            total_amount
        }

        // Get a DEV payment amount based on completed tasks.
        // All completed taks will be changed to paid taks.
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
                                i += 1;
                                continue;
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

        // Create a new task for a job.
        // This private function will be used in the main contract.
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

        // Change a task status.
        // This private function will be used in the main contract.
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
            assert(allow_change_status, Errors::NOT_ALLOW_CHANGING_STATUS);
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
