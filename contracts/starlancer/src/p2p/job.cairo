use starknet::ContractAddress;
use starlancer::types::{Job};
#[starknet::interface]
trait P2PJob<TContractState> {
    fn get_job_by_index(self: @TContractState, index: u32) -> Job;
    fn get_jobs(self: @TContractState, job_index: u32, offset: u32, page_size: u32) -> Array<Job>;
    fn get_job_candidates(self: @TContractState, job_index: u32) -> Array<ContractAddress>;
    fn apply_job(ref self: TContractState, job_index: u32);
    fn add_job(ref self: TContractState, job: Job);
    fn close_job(ref self: TContractState, job_index: u32);
    fn reopen_job(ref self: TContractState, job_index: u32, start_date: u128, end_date: u128);
    fn accept_candidate(ref self: TContractState, job_index: u32, candidate_index: u32);
}
#[starknet::component]
mod job_component {
    use starknet::ContractAddress;
    #[storage]
    struct Storage {
        // global job index, job
        jobs: LegacyMap::<u32, Job>,
        // global job index, index of an applied candidate, candidate 
        candidates: LegacyMap::<(u32, u32), ContractAddress>,
        count_job: u32,
        //  global job index, number of candidates
        count_job_candidates: LegacyMap<u32, u32>,
        // employer, index of a job in employer jobs, global job index
        employer_jobs: LegacyMap::<(ContractAddress, u32), u32>,
        // employer, number of jobs
        count_employer_jobs: LegacyMap::<ContractAddress, u32>,
        // global job index, index of an accepted candidate
        accepted_candidate: LegacyMap<u32, u32>
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
}
