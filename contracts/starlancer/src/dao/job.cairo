use starknet::ContractAddress;
use core::{Array};
use starlancer::types::Job;


#[starknet::interface]
trait IDAOJobs<TContractState> {
    fn get_job_by_index(self: @TContractState, index: u32) -> Job;
    fn get_jobs(self: @TContractState, job_index: u32, offset: u32, page_size: u32) -> Array<Job>;
    fn get_job_candidates(self: @TContractState, job_index: u32) -> Array<ContractAddress>;
    fn get_job_candidate(self: @TContractState, job_index: u32, candidate_index: u32) -> ContractAddress;
    fn apply_job(ref self: TContractState, job_index: u32);
    fn add_job(ref self: TContractState, job: Job);
    fn close_job(ref self: TContractState, job_index: u32);
    fn reopen_job(ref self: TContractState, job_index: u32, start_date: u128, end_date: u128);
}

#[starknet::component]
mod job_component {
    use core::traits::Into;
    use starknet::{ContractAddress, get_caller_address};
    use core::{Array, ArrayTrait};
    use starlancer::types::Job;
    use starlancer::error::Errors;

    #[storage]
    struct Storage {
        job_managers: LegacyMap<ContractAddress, bool>,
        jobs: LegacyMap::<u32, Job>,
        candidates: LegacyMap::<(u32, u32), ContractAddress>,
        count_job: u32,
        count_job_candidates: LegacyMap<u32, u32>
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ApplyJob: ApplyJob,
        AlreadyApplied: AlreadyApplied,
        AddJob: AddJob,
        CloseJob: CloseJob,
        ReopenJob: ReopenJob,
        AddJobManager: AddJobManager,
        RemoveJobManager: RemoveJobManager
    }

    #[derive(Drop, starknet::Event)]
    struct AddJob {
        #[key]
        job_index: u32,
        creator: ContractAddress
    }
    #[derive(Drop, starknet::Event)]
    struct AlreadyApplied {
        #[key]
        job_index: u32,
        candidate: ContractAddress
    }
    #[derive(Drop, starknet::Event)]
    struct ApplyJob {
        #[key]
        job_index: u32,
        candidate: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct CloseJob {
        #[key]
        job_index: u32,
    }

    #[derive(Drop, starknet::Event)]
    struct ReopenJob {
        #[key]
        job_index: u32,
        start_date: u128,
        end_date: u128
    }

    #[derive(Drop, starknet::Event)]
    struct AddJobManager {
        job_manager: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct RemoveJobManager {
        job_manager: ContractAddress,
    }

    #[embeddable_as(DAOJobs)]
    impl DAOJobsImpl<
        TContractState, +HasComponent<TContractState>
    > of super::IDAOJobs<ComponentState<TContractState>> {
        fn get_job_by_index(self: @ComponentState<TContractState>, index: u32) -> Job {
            let job: Job = self.jobs.read(index);
            job
        }
        fn get_jobs(
            self: @ComponentState<TContractState>, job_index: u32, offset: u32, page_size: u32
        ) -> Array<Job> {
            let mut jobs: Array<Job> = ArrayTrait::new();
            let mut i: u32 = 0;
            loop {
                if (i >= offset + page_size) {
                    break;
                }
                if (offset + i < self.count_job.read()) {
                    let job: Job = self.jobs.read(offset + i);
                    jobs.append(job);
                    i += 1;
                } else {
                    break;
                }
            };
            jobs
        }

        fn get_job_candidates(
            self: @ComponentState<TContractState>, job_index: u32
        ) -> Array<ContractAddress> {
            let mut candidates: Array<ContractAddress> = ArrayTrait::new();
            let mut i: u32 = 0;
            let number_of_candidates: u32 = self.count_job_candidates.read(job_index);

            loop {
                if (i >= number_of_candidates) {
                    break;
                }
                let candidate: ContractAddress = self.candidates.read((job_index, i));
                candidates.append(candidate);
                i += 1;
            };
            candidates
        }

        fn get_job_candidate(self:@ComponentState<TContractState>, job_index: u32, candidate_index: u32) -> ContractAddress {
            self.candidates.read((job_index, candidate_index))
        }

        fn apply_job(ref self: ComponentState<TContractState>, job_index: u32) {
            let number_of_candidates: u32 = self.count_job_candidates.read(job_index);
            let mut is_applied: bool = false;

            let mut i: u32 = 0;

            loop {
                if (i >= number_of_candidates) {
                    break;
                }

                let candidate: ContractAddress = self.candidates.read((job_index, i));
                if (candidate == get_caller_address()) {
                    is_applied = true;
                    break;
                }

                i += 1;
            };

            if (!is_applied) {
                self.candidates.write((job_index, number_of_candidates), get_caller_address());
                self.count_job_candidates.write(job_index, number_of_candidates + 1);
                self.emit(ApplyJob { job_index: job_index, candidate: get_caller_address() });
            } else {
                self.emit(AlreadyApplied { job_index: job_index, candidate: get_caller_address() });
            }
        }

        fn add_job(ref self: ComponentState<TContractState>, job: Job) {
            self._assert_is_job_manager();
            let count_job: u32 = self.count_job.read();
            self
                .jobs
                .write(
                    count_job,
                    Job {
                        creator: get_caller_address(),
                        start_date: job.start_date,
                        end_date: job.end_date,
                        title: job.title,
                        short_description: job.short_description,
                        job_detail: job.job_detail,
                        job_type: job.job_type,
                        fixed_price: job.fixed_price,
                        hourly_rate: job.hourly_rate,
                        pay_by_token: job.pay_by_token,
                        status: true
                    }
                );
            self.count_job.write(count_job + 1);
        }

        fn close_job(ref self: ComponentState<TContractState>, job_index: u32) {
            self._assert_is_job_manager();
            let job: Job = self.jobs.read(job_index);
            assert(job.status, Errors::NOT_ACTIVE_JOB);
            self
                .jobs
                .write(
                    job_index,
                    Job {
                        creator: job.creator,
                        start_date: job.start_date,
                        end_date: job.end_date,
                        title: job.title,
                        short_description: job.short_description,
                        job_detail: job.job_detail,
                        job_type: job.job_type,
                        fixed_price: job.fixed_price,
                        hourly_rate: job.hourly_rate,
                        pay_by_token: job.pay_by_token,
                        status: false
                    }
                )
        }

        fn reopen_job(
            ref self: ComponentState<TContractState>,
            job_index: u32,
            start_date: u128,
            end_date: u128
        ) {
            self._assert_is_job_manager();
            let job: Job = self.jobs.read(job_index);
            assert(!job.status, Errors::NOT_CLOSED_JOB);
            self
                .jobs
                .write(
                    job_index,
                    Job {
                        creator: job.creator,
                        start_date: start_date,
                        end_date: end_date,
                        title: job.title,
                        short_description: job.short_description,
                        job_detail: job.job_detail,
                        job_type: job.job_type,
                        fixed_price: job.fixed_price,
                        hourly_rate: job.hourly_rate,
                        pay_by_token: job.pay_by_token,
                        status: true
                    }
                )
        }
    }

    #[generate_trait]
    impl DAOJobsInternalImpl<
        TContractState, +HasComponent<TContractState>
    > of DAOJobsInternalImplTrait<TContractState> {
        fn _assert_is_job_manager(self: @ComponentState<TContractState>) {
            assert(self.job_managers.read(get_caller_address()), Errors::NOT_JOB_MANAGER);
        }

        fn _add_job_managers(
            ref self: ComponentState<TContractState>, job_managers: Array<ContractAddress>
        ) {
            let len: u32 = job_managers.len().into();

            if (len > 0) {
                let mut i: u32 = 0;
                loop {
                    if (i >= len) {
                        break;
                    }
                    self.job_managers.write(*job_managers.at(i), true);
                    i += 1;
                }
            }
        }

        fn _remove_job_managers(
            ref self: ComponentState<TContractState>, job_managers: Array<ContractAddress>
        ) {
            let len: u32 = job_managers.len().into();

            if (len > 0) {
                let mut i: u32 = 0;
                loop {
                    if (i >= len) {
                        break;
                    }
                    self.job_managers.write(*job_managers.at(i), false);
                    i += 1;
                }
            }
        }
    }
}

