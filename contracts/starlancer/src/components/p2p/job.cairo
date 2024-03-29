use starknet::ContractAddress;
use starlancer::types::{Job};

#[starknet::interface]
trait IP2PJob<TContractState> {
    fn get_job_by_index(self: @TContractState, job_index: u32) -> Job;
    fn get_job_by_local_index(
        self: @TContractState, employer: ContractAddress, local_job_index: u32
    ) -> Job;
    fn get_jobs(self: @TContractState, offset: u32, page_size: u32) -> Array<Job>;
    fn get_employer_jobs(
        self: @TContractState, employer: ContractAddress, offset: u32, page_size: u32
    ) -> Array<Job>;
    fn get_job_candidates(self: @TContractState, job_index: u32) -> Array<ContractAddress>;
    fn get_job_candidates_by_local_index(
        self: @TContractState, employer: ContractAddress, local_job_index: u32
    ) -> Array<ContractAddress>;

    fn get_accepted_candidate(
        self: @TContractState, employer: ContractAddress, local_job_index: u32
    ) -> ContractAddress;

    fn get_accepted_candidate_by_global_index(
        self: @TContractState, employer: ContractAddress, job_index: u32
    ) -> ContractAddress;

    fn apply_job(ref self: TContractState, job_index: u32);
    fn add_job(ref self: TContractState, job: Job);
    fn close_job(ref self: TContractState, local_job_index: u32);
    fn reopen_job(ref self: TContractState, local_job_index: u32, start_date: u128, end_date: u128);
    fn accept_candidate(ref self: TContractState, local_job_index: u32, candidate_index: u32);
}

#[starknet::component]
mod job_component {
    use starknet::{ContractAddress, get_caller_address};
    use starlancer::types::{Job};
    use starlancer::error::Errors;

    #[storage]
    struct Storage {
        // Key: global_job_index, value: Job
        jobs: LegacyMap::<u32, Job>,
        // Key: global_job_index, index of an applied candidate, candidate 
        candidates: LegacyMap::<(u32, u32), ContractAddress>,
        // Num of jobs
        count_job: u32,
        // Key: global_job_index, value: num of candidates
        count_job_candidates: LegacyMap<u32, u32>,
        // Key: (employer, index of a job in employer jobs), value: global_job_index
        employer_jobs: LegacyMap::<(ContractAddress, u32), u32>,
        // Key: employer, value: num of the employer's jobs
        count_employer_jobs: LegacyMap::<ContractAddress, u32>,
        // Key: (employer, local job index), value: index of the accepted candidate
        accepted_candidate: LegacyMap<(ContractAddress, u32), u32>,
        // Key: global_job_index, value: accepted_candidate index
        job_accepted_candidate: LegacyMap<u32, ContractAddress>
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ApplyJob: ApplyJob,
        AlreadyApplied: AlreadyApplied,
        AddJob: AddJob,
        CloseJob: CloseJob,
        ReopenJob: ReopenJob,
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

    #[embeddable_as(P2PJob)]
    impl P2PJobImpl<
        TContractState, +HasComponent<TContractState>
    > of super::IP2PJob<ComponentState<TContractState>> {
        // Get job info by global_index
        fn get_job_by_index(self: @ComponentState<TContractState>, job_index: u32) -> Job {
            self.jobs.read(job_index)
        }

        // Get job info by local job index
        fn get_job_by_local_index(
            self: @ComponentState<TContractState>, employer: ContractAddress, local_job_index: u32
        ) -> Job {
            let (_, job): (u32, Job) = self._get_job_from_local_index(employer, local_job_index);
            job
        }

        // Get the accept_candidate address based on the employer and local_job_index
        // local_job_index is the index of a job of the employer's jobs
        fn get_accepted_candidate(
            self: @ComponentState<TContractState>, employer: ContractAddress, local_job_index: u32
        ) -> ContractAddress {
            let candidate_index = self.accepted_candidate.read((employer, local_job_index));

            let global_job_index = self.employer_jobs.read((employer, local_job_index));

            self.candidates.read((global_job_index, candidate_index))
        }

        // Get the accept_candidate address based on a job global_index
        fn get_accepted_candidate_by_global_index(
            self:  @ComponentState<TContractState>, employer: ContractAddress, job_index: u32
        ) -> ContractAddress {
            self.job_accepted_candidate.read(job_index)
        }

        // Get all jobs with pagination options.
        fn get_jobs(
            self: @ComponentState<TContractState>, offset: u32, page_size: u32
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

        // Get the employer's jobs with pagination options.
        fn get_employer_jobs(
            self: @ComponentState<TContractState>,
            employer: ContractAddress,
            offset: u32,
            page_size: u32
        ) -> Array<Job> {
            let mut jobs: Array<Job> = ArrayTrait::new();
            let mut i: u32 = 0;
            let count_employer_jobs: u32 = self.count_employer_jobs.read(employer);
            loop {
                if (i >= offset + page_size) {
                    break;
                }
                if (offset + i < count_employer_jobs) {
                    let job: Job = self.jobs.read(self.employer_jobs.read((employer, offset + i)));
                    jobs.append(job);
                    i += 1;
                } else {
                    break;
                }
            };
            jobs
        }

        // Get all candidates of a job based a global job index.
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

        // Get all candidates of a job based a local job index.
        fn get_job_candidates_by_local_index(
            self: @ComponentState<TContractState>, employer: ContractAddress, local_job_index: u32
        ) -> Array<ContractAddress> {
            let global_job_index: u32 = self.employer_jobs.read((employer, local_job_index));

            self.get_job_candidates(global_job_index)
        }

        // Only new candidates can apply to a job.
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

        // users can create new public jobs.
        fn add_job(ref self: ComponentState<TContractState>, job: Job) {
            let count_job: u32 = self.count_job.read();
            let count_employer_jobs: u32 = self.count_employer_jobs.read(get_caller_address());
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

            self.employer_jobs.write((get_caller_address(), count_employer_jobs), count_job);
            self.count_job.write(count_job + 1);
            self.count_employer_jobs.write(get_caller_address(), count_employer_jobs + 1);
        }

        // Only job creator can close a job.
        // A job can be closed if it's active.
        fn close_job(ref self: ComponentState<TContractState>, local_job_index: u32) {
            self._assert_is_employer(local_job_index);
            let (global_index, job): (u32, Job) = self
                ._get_job_from_local_index(get_caller_address(), local_job_index);

            assert(job.status, Errors::NOT_ACTIVE_JOB);

            self
                .jobs
                .write(
                    global_index,
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

        // Only job creator can reopen closed jobs.
        fn reopen_job(
            ref self: ComponentState<TContractState>,
            local_job_index: u32,
            start_date: u128,
            end_date: u128
        ) {
            self._assert_is_employer(local_job_index);

            let (global_index, job): (u32, Job) = self
                ._get_job_from_local_index(get_caller_address(), local_job_index);

            assert(!job.status, Errors::NOT_CLOSED_JOB);

            self
                .jobs
                .write(
                    global_index,
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

        // Only job creator can accept a candidate.
        // A job can have a candidate at the same time.
        fn accept_candidate(
            ref self: ComponentState<TContractState>, local_job_index: u32, candidate_index: u32
        ) {
            self._assert_is_employer(local_job_index);
            let global_job_index: u32 = self.employer_jobs.read((get_caller_address(), local_job_index));
            self.accepted_candidate.write((get_caller_address(), local_job_index), candidate_index);
            self.job_accepted_candidate.write(global_job_index, self.candidates.read((global_job_index, candidate_index)));
        }
    }

    #[generate_trait]
    impl P2PJobInternalImpl<
        TContractState, +HasComponent<TContractState>
    > of P2PJobInternalImplTrait<TContractState> {

        // Get a job from a local index
        fn _get_job_from_local_index(
            self: @ComponentState<TContractState>, employer: ContractAddress, local_job_index: u32
        ) -> (u32, Job,) {
            let global_job_index: u32 = self.employer_jobs.read((employer, local_job_index));
            let job: Job = self.jobs.read(global_job_index);
            (global_job_index, job,)
        }

        // Whether the caller is a employer or not.
        fn _assert_is_employer(self: @ComponentState<TContractState>, local_job_index: u32) {
            let (_, job): (u32, Job) = self
                ._get_job_from_local_index(get_caller_address(), local_job_index);

            assert(job.creator == get_caller_address(), Errors::NOT_EMPLOYER);
        }
        
    }
}
