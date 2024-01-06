use starknet::ContractAddress;
use starlancer::types::{Task, MemberRoles, ProjectRoles, DAOStatistics, DAODetail};

#[starknet::interface]
trait IDAO<TContractState> {
    fn stop_dao(ref self: TContractState);
    fn active_dao(ref self: TContractState);
    fn pay_member(ref self: TContractState, member_index: u32);
    fn create_assign_task(
        ref self: TContractState, assignee: ContractAddress, project_index: u32, task: Task
    );

    fn accept_candidate(
        ref self: TContractState,
        job_index: u32,
        candidate_index: u32,
        start_date: u128,
        end_date: u128
    );

    fn get_member_roles(self: @TContractState, address: ContractAddress) -> MemberRoles;
    fn get_project_roles(
        self: @TContractState, address: ContractAddress, project_index: u32
    ) -> ProjectRoles;
    fn get_statistic(self: @TContractState) -> DAOStatistics;
    fn get_dao_detail(self: @TContractState) -> DAODetail;
}

#[starknet::contract]
mod DAO {
    use starknet::{ContractAddress, get_caller_address};
    use starlancer::components::dao::member::member_component;
    use starlancer::components::dao::job::job_component;
    use starlancer::components::dao::project::project_component;
    use starlancer::components::dao::treasury::treasury_component;
    use starlancer::types::{
        Job, Contract, Project, Task, MemberRoles, ProjectRoles, DAOStatistics, DAODetail
    };
    use starlancer::error::Errors;
    component!(path: member_component, storage: members, event: MemberEvent);
    component!(path: job_component, storage: dao_jobs, event: DAOJobsEvent);
    component!(path: project_component, storage: dao_projects, event: DAOProjectsEvent);
    component!(path: treasury_component, storage: dao_treasury, event: DAOTreasuryEvent);

    #[abi(embed_v0)]
    impl DAOMemberImpl = member_component::Member<ContractState>;
    impl DAOMemberInternalImpl = member_component::MemberInternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl DAOJobsImpl = job_component::DAOJobs<ContractState>;
    impl DAOJobsInternalImpl = job_component::DAOJobsInternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl DAOProjectImpl = project_component::DAOProject<ContractState>;
    impl DAOProjectInternalImpl = project_component::DAOProjectInternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl DAOTreasuryImpl = treasury_component::DAOTreasury<ContractState>;
    impl DAOTreasuryInternalImpl = treasury_component::TreasuryInternalImpl<ContractState>;

    #[storage]
    struct Storage {
        owner: ContractAddress,
        dao_detail: DAODetail,
        status: bool,
        #[substorage(v0)]
        members: member_component::Storage,
        #[substorage(v0)]
        dao_jobs: job_component::Storage,
        #[substorage(v0)]
        dao_projects: project_component::Storage,
        #[substorage(v0)]
        dao_treasury: treasury_component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        MemberEvent: member_component::Event,
        DAOJobsEvent: job_component::Event,
        DAOProjectsEvent: project_component::Event,
        DAOTreasuryEvent: treasury_component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        dao_detail: DAODetail,
        treasury_managers: Array<ContractAddress>,
        member_managers: Array<ContractAddress>,
        project_managers: Array<ContractAddress>,
        job_managers: Array<ContractAddress>
    ) {
        DAOTreasuryInternalImpl::_add_treasury_managers(ref self.dao_treasury, treasury_managers);
        DAOProjectInternalImpl::_add_project_managers(ref self.dao_projects, project_managers);
        DAOJobsInternalImpl::_add_job_managers(ref self.dao_jobs, job_managers);
        DAOMemberInternalImpl::_add_member_managers(ref self.members, member_managers);
        self.owner.write(owner);
        self.dao_detail.write(dao_detail);
    }

    #[abi(embed_v0)]
    impl DAOImpl of super::IDAO<ContractState> {
        fn stop_dao(ref self: ContractState) {
            assert(get_caller_address() == self.owner.read(), Errors::NOT_DAO_OWNER);
            assert(self.status.read(), 'Not active DAO');
            self.status.write(false);
        }

        fn active_dao(ref self: ContractState) {
            assert(get_caller_address() == self.owner.read(), Errors::NOT_DAO_OWNER);
            assert(!self.status.read(), 'Not stopped DAO');
            self.status.write(true);
        }

        fn pay_member(ref self: ContractState, member_index: u32) {
            let current_contract: Option<Contract> = DAOMemberImpl::get_member_current_contract(
                @self, member_index
            );

            match current_contract {
                Option::Some(contract) => {
                    let member_address: ContractAddress = DAOMemberImpl::get_member_by_index(
                        @self, member_index
                    );

                    // Calculate billing here
                    let billing_amount: u256 = DAOProjectInternalImpl::_calculate_billing(
                        ref self.dao_projects, member_address, contract
                    );
                    // Do payment

                    DAOTreasuryImpl::pay(
                        ref self, member_address, contract.pay_by_token, billing_amount
                    );
                },
                Option::None => {
                    assert(false, Errors::HAS_NO_CONTRACT);
                }
            }
        }

        fn create_assign_task(
            ref self: ContractState, assignee: ContractAddress, project_index: u32, task: Task
        ) {
            assert(DAOMemberImpl::is_member(@self, assignee), Errors::NOT_MEMBER);
            DAOProjectInternalImpl::_create_task(
                ref self.dao_projects, assignee: assignee, project_index: project_index, task: task
            );
        }

        fn accept_candidate(
            ref self: ContractState,
            job_index: u32,
            candidate_index: u32,
            start_date: u128,
            end_date: u128
        ) {
            let job: Job = DAOJobsImpl::get_job_by_index(@self, job_index);

            let candidate: ContractAddress = DAOJobsImpl::get_job_candidate(
                @self, job_index, candidate_index
            );

            DAOMemberInternalImpl::_add_member(
                ref self.members, candidate, job, start_date, end_date
            );
        }
        fn get_member_roles(self: @ContractState, address: ContractAddress) -> MemberRoles {
            let is_job_manager: bool = self.dao_jobs.job_managers.read(address);
            let is_member_manager: bool = self.members.member_managers.read(address);
            let is_project_manager: bool = self.dao_projects.project_managers.read(address);
            let is_treasury_manager: bool = self.dao_treasury.treasury_managers.read(address);
            let is_member: bool = self.members.member_status.read(address);
            MemberRoles {
                is_job_manager: is_job_manager,
                is_member_manager: is_member_manager,
                is_project_manager: is_project_manager,
                is_treasury_manager: is_treasury_manager,
                is_member: is_member
            }
        }

        fn get_project_roles(
            self: @ContractState, address: ContractAddress, project_index: u32
        ) -> ProjectRoles {
            let is_code_reviewer: bool = self
                .dao_projects
                .code_reviewers
                .read((project_index, address));

            let is_task_manager: bool = self
                .dao_projects
                .task_managers
                .read((project_index, address));
            ProjectRoles { is_code_reviewer: is_code_reviewer, is_task_manager: is_task_manager }
        }

        fn get_statistic(self: @ContractState) -> DAOStatistics {
            let num_jobs: u32 = self.dao_jobs.count_job.read();
            let num_projects: u32 = self.dao_projects.count_project.read();
            let num_members: u32 = self.members.count_members.read();

            DAOStatistics {
                num_members: num_members, num_projects: num_projects, num_jobs: num_jobs
            }
        }

        fn get_dao_detail(self: @ContractState) -> DAODetail {
            self.dao_detail.read()
        }
    }
}
