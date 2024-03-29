use starknet::ContractAddress;
use starlancer::types::{Task, MemberRoles, ProjectRoles, DAOStatistics, DAODetail};

#[starknet::interface]
trait IDAO<TContractState> {
    fn stop_dao(ref self: TContractState);
    fn active_dao(ref self: TContractState);
    fn pay_member(ref self: TContractState, member_index: u32);
    fn get_payment_amount(self: @TContractState, member_index: u32) -> u256;
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
    fn update_dao_detail(ref self: TContractState, dao_detail: DAODetail);
    fn add_project_managers(ref self: TContractState, project_managers: Array<ContractAddress>);
    fn remove_project_managers(ref self: TContractState, project_managers: Array<ContractAddress>);
    fn add_treasury_managers(ref self: TContractState, treasury_managers: Array<ContractAddress>);
    fn remove_treasury_managers(
        ref self: TContractState, treasury_managers: Array<ContractAddress>
    );
    fn add_member_managers(ref self: TContractState, member_managers: Array<ContractAddress>);
    fn remove_member_managers(ref self: TContractState, member_managers: Array<ContractAddress>);
    fn add_job_managers(ref self: TContractState, job_managers: Array<ContractAddress>);
    fn remove_job_managers(ref self: TContractState, job_managers: Array<ContractAddress>);
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
        job_managers: Array<ContractAddress>,
        platform_fee: ContractAddress
    ) {
        DAOTreasuryInternalImpl::_add_treasury_managers(ref self.dao_treasury, treasury_managers);
        DAOTreasuryInternalImpl::_init_platform_fee(ref self.dao_treasury, platform_fee);
        DAOProjectInternalImpl::_add_project_managers(ref self.dao_projects, project_managers);
        DAOJobsInternalImpl::_add_job_managers(ref self.dao_jobs, job_managers);
        DAOMemberInternalImpl::_add_member_managers(ref self.members, member_managers);
        self.owner.write(owner);
        self.dao_detail.write(dao_detail);
    }

    #[abi(embed_v0)]
    impl DAOImpl of super::IDAO<ContractState> {
        // Only the DAO owner can stop it.
        fn stop_dao(ref self: ContractState) {
            assert(get_caller_address() == self.owner.read(), Errors::NOT_DAO_OWNER);
            assert(self.status.read(), 'Not active DAO');
            self.status.write(false);
        }
        // Only the DAO owner can active it.
        fn active_dao(ref self: ContractState) {
            assert(get_caller_address() == self.owner.read(), Errors::NOT_DAO_OWNER);
            assert(!self.status.read(), 'Not stopped DAO');
            self.status.write(true);
        }


        // This public function to get the dev payment amount.
        // This function doesn't change the contract storage.
        fn get_payment_amount(self: @ContractState, member_index: u32) -> u256 {
            let current_contract: Option<Contract> = DAOMemberImpl::get_member_current_contract(
                self, member_index
            );
            let mut billing_amount: u256 = 0;
            match current_contract {
                Option::Some(contract) => {
                    let member_address: ContractAddress = DAOMemberImpl::get_member_by_index(
                        self, member_index
                    );

                    // Calculate a dev's payment amount
                    billing_amount = DAOProjectInternalImpl::_get_payment_amount(
                        self.dao_projects, member_address, contract
                    );
                },
                Option::None => { billing_amount = 0 }
            }

            billing_amount
        }

        // Only treasury managers can pay. 
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
                Option::None => { assert(false, Errors::HAS_NO_CONTRACT); }
            }
        }

        // Create and assign taks to developers (members).
        fn create_assign_task(
            ref self: ContractState, assignee: ContractAddress, project_index: u32, task: Task
        ) {
            assert(DAOMemberImpl::is_member(@self, assignee), Errors::NOT_MEMBER);
            DAOProjectInternalImpl::_create_task(
                ref self.dao_projects, assignee: assignee, project_index: project_index, task: task
            );
        }


        // Only employers can accept a job candidate
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

        // Get member roles in this DAO.
        fn get_member_roles(self: @ContractState, address: ContractAddress) -> MemberRoles {
            let is_job_manager: bool = self.dao_jobs.job_managers.read(address);
            let is_member_manager: bool = self.members.member_managers.read(address);
            let is_project_manager: bool = self.dao_projects.project_managers.read(address);
            let is_treasury_manager: bool = self.dao_treasury.treasury_managers.read(address);
            let is_member: bool = self.members.member_status.read(address);
            let is_whitelisted_contributor: bool = self.dao_treasury.whitelisted_contributors.read(address);
            MemberRoles {
                is_job_manager: is_job_manager,
                is_member_manager: is_member_manager,
                is_project_manager: is_project_manager,
                is_treasury_manager: is_treasury_manager,
                is_member: is_member,
                is_whitelisted_contributor: is_whitelisted_contributor
            }
        }

        // Get roles of a member in a project.
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

        // Extract some statistics.
        fn get_statistic(self: @ContractState) -> DAOStatistics {
            let num_jobs: u32 = self.dao_jobs.count_job.read();
            let num_projects: u32 = self.dao_projects.count_project.read();
            let num_members: u32 = self.members.count_members.read();
            let mut num_tasks: u32 = 0;
            let mut i: u32 = 0;
            loop {
                if (i >= num_projects) {
                    break;
                }

                num_tasks += self.dao_projects.count_project_tasks.read(i);
                i += 1;
            };

            DAOStatistics {
                num_members: num_members, num_projects: num_projects, num_jobs: num_jobs, num_tasks: num_tasks
            }
        }

        // Get the basic information of a DAO.
        fn get_dao_detail(self: @ContractState) -> DAODetail {
            self.dao_detail.read()
        }

        // Only DAO owners can change their's DAO information.
         fn update_dao_detail(ref self: ContractState, dao_detail: DAODetail) {
            assert(get_caller_address() == self.owner.read(), Errors::NOT_DAO_OWNER);
            self.dao_detail.write(dao_detail);
         }
         
        // Manage DAO roles and project roles.
        fn add_project_managers(ref self: ContractState, project_managers: Array<ContractAddress>) {
            assert(get_caller_address() == self.owner.read(), Errors::NOT_DAO_OWNER);

            DAOProjectInternalImpl::_add_project_managers(ref self.dao_projects, project_managers);
        }
        fn remove_project_managers(
            ref self: ContractState, project_managers: Array<ContractAddress>
        ) {
            assert(get_caller_address() == self.owner.read(), Errors::NOT_DAO_OWNER);

            DAOProjectInternalImpl::_remove_project_managers(ref self.dao_projects, project_managers);
        }
        fn add_treasury_managers(
            ref self: ContractState, treasury_managers: Array<ContractAddress>
        ) {

            assert(get_caller_address() == self.owner.read(), Errors::NOT_DAO_OWNER);

            DAOTreasuryInternalImpl::_add_treasury_managers(ref self.dao_treasury, treasury_managers);
        }
        fn remove_treasury_managers(
            ref self: ContractState, treasury_managers: Array<ContractAddress>
        ) {
            assert(get_caller_address() == self.owner.read(), Errors::NOT_DAO_OWNER);

            DAOTreasuryInternalImpl::_remove_treasury_managers(ref self.dao_treasury, treasury_managers);
        }
        fn add_member_managers(ref self: ContractState, member_managers: Array<ContractAddress>) {
            assert(get_caller_address() == self.owner.read(), Errors::NOT_DAO_OWNER);
            DAOMemberInternalImpl::_add_member_managers(ref self.members, member_managers);
        }
        fn remove_member_managers(
            ref self: ContractState, member_managers: Array<ContractAddress>
        ) {
             assert(get_caller_address() == self.owner.read(), Errors::NOT_DAO_OWNER);
            DAOMemberInternalImpl::_remove_member_managers(ref self.members, member_managers)
        }
        fn add_job_managers(ref self: ContractState, job_managers: Array<ContractAddress>) {
            assert(get_caller_address() == self.owner.read(), Errors::NOT_DAO_OWNER);
            DAOJobsInternalImpl::_add_job_managers(ref self.dao_jobs, job_managers)
        }
        fn remove_job_managers(ref self: ContractState, job_managers: Array<ContractAddress>) {
            assert(get_caller_address() == self.owner.read(), Errors::NOT_DAO_OWNER);
            DAOJobsInternalImpl::_remove_job_managers(ref self.dao_jobs, job_managers)
        }
    }
}
