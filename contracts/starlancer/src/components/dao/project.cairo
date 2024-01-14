use starlancer::types::{Project, Task, TaskStatus};
use starknet::{ContractAddress};
#[starknet::interface]
trait IDAOProject<TContractState> {
    fn create_project(
        ref self: TContractState,
        task_managers: Array<ContractAddress>,
        code_reviewers: Array<ContractAddress>,
        project: Project
    );
    fn get_projects(self: @TContractState) -> Array<Project>;
    fn get_project_tasks(self: @TContractState, project_index: u32) -> Array<Task>;
    fn get_member_tasks(self: @TContractState, member: ContractAddress) -> Array<Task>;
    fn get_project(self: @TContractState, project_index: u32) -> Project;
    fn is_paid_task(self: @TContractState, project_index: u32, task_index: u32) -> bool;
    fn close_project(ref self: TContractState, project_index: u32);
    fn reopen_project(ref self: TContractState, project_index: u32);
    fn update_project(ref self: TContractState, project_index: u32, project: Project);
    fn change_task_status(
        ref self: TContractState, project_index: u32, task_index: u32, status: TaskStatus
    );

    fn add_task_managers(
        ref self: TContractState, project_index: u32, task_managers: Array<ContractAddress>
    );
    fn remove_task_managers(
        ref self: TContractState, project_index: u32, task_managers: Array<ContractAddress>
    );
    fn add_code_reviewers(
        ref self: TContractState, project_index: u32, code_reviewers: Array<ContractAddress>
    );
    fn remove_code_reviewers(
        ref self: TContractState, project_index: u32, code_reviewers: Array<ContractAddress>
    );
}

#[starknet::component]
mod project_component {
    use core::num::traits::zero::Zero;
    use core::array::ArrayTrait;
    use core::traits::Into;
    use starknet::{ContractAddress, get_caller_address};
    use starlancer::types::{Project, Task, TaskStatus, Contract, ContractType};
    use starlancer::error::Errors;

    #[storage]
    struct Storage {
        // Store project managers.
        project_managers: LegacyMap<ContractAddress, bool>,
        // project_index, task_manager
        task_managers: LegacyMap<(u32, ContractAddress), bool>,
        // project_index, code_reviewer
        code_reviewers: LegacyMap<(u32, ContractAddress), bool>,
        // key: project_index, value: project details
        projects: LegacyMap<u32, Project>,
        // key: project_index, value: task_index
        project_tasks: LegacyMap<(u32, u32), Task>,
        // Num of projects
        count_project: u32,
        // project_index, num of project tasks
        count_project_tasks: LegacyMap<u32, u32>,
        // (member, member_task_index) (project_index, task_index)
        member_tasks: LegacyMap<(ContractAddress, u32), (u32, u32)>,
        // member, member_task_index
        count_member_tasks: LegacyMap<ContractAddress, u32>,
        // (project_index, task_index)
        paid_tasks: LegacyMap<(u32, u32), bool>
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CreateProject: CreateProject,
        CreateTask: CreateTask,
        CloseProject: CloseProject,
        ReopenProject: ReopenProject,
        UpdateProject: UpdateProject,
        ChangeTaskStatus: ChangeTaskStatus
    }

    #[derive(Drop, starknet::Event)]
    struct CreateProject {
        #[key]
        creator: ContractAddress,
        #[key]
        project_index: u32
    }

    #[derive(Drop, starknet::Event)]
    struct CreateTask {
        #[key]
        creator: ContractAddress,
        #[key]
        project_index: u32,
        #[key]
        task_index: u32
    }

    #[derive(Drop, starknet::Event)]
    struct CloseProject {
        #[key]
        creator: ContractAddress,
        #[key]
        project_index: u32
    }
    #[derive(Drop, starknet::Event)]
    struct ReopenProject {
        #[key]
        creator: ContractAddress,
        #[key]
        project_index: u32
    }

    #[derive(Drop, starknet::Event)]
    struct UpdateProject {
        #[key]
        creator: ContractAddress,
        project_index: u32
    }
    #[derive(Drop, starknet::Event)]
    struct ChangeTaskStatus {
        #[key]
        creator: ContractAddress,
        #[key]
        project_index: u32,
        #[key]
        task_index: u32,
        status: TaskStatus
    }

    #[embeddable_as(DAOProject)]
    impl DAOProjectImpl<
        TContractState, +HasComponent<TContractState>
    > of super::IDAOProject<ComponentState<TContractState>> {

        // Only project managers can create a new project.
        // Initial project information includes:
        // - Task managers
        // - Code reviewers
        // - Project settings.
        fn create_project(
            ref self: ComponentState<TContractState>,
            task_managers: Array<ContractAddress>,
            code_reviewers: Array<ContractAddress>,
            project: Project
        ) {
            self._assert_is_project_manager();
            let count_project: u32 = self.count_project.read();

            self
                .projects
                .write(
                    count_project,
                    Project {
                        creator: get_caller_address(),
                        start_date: project.start_date,
                        end_date: project.end_date,
                        title: project.title,
                        short_description: project.short_description,
                        project_detail: project.project_detail,
                        status: true
                    }
                );
            let mut i: u32 = 0;
            let len_task_managers: u32 = task_managers.len();
            loop {
                if (i >= len_task_managers) {
                    break;
                }
                self.task_managers.write((count_project, *task_managers.at(i)), true);
                i += 1;
            };

            let mut j: u32 = 0;
            let len_code_reviewer: u32 = code_reviewers.len();
            loop {
                if (j >= len_code_reviewer) {
                    break;
                }
                self.code_reviewers.write((count_project, *code_reviewers.at(j)), true);
                j += 1;
            };
            self.count_project.write(count_project + 1);
            self
                .emit(
                    CreateProject {
                        creator: get_caller_address(), project_index: count_project + 1
                    }
                );
        }

        // Get a list of projects.
        fn get_projects(self: @ComponentState<TContractState>) -> Array<Project> {
            let mut projects: Array<Project> = ArrayTrait::new();
            let mut i: u32 = 0;
            let count_project: u32 = self.count_project.read();
            loop {
                if (i >= count_project) {
                    break;
                }

                let project: Project = self.projects.read(i);

                projects.append(project);
                i += 1;
            };
            projects
        }

        // Get a list of project tasks.
        fn get_project_tasks(
            self: @ComponentState<TContractState>, project_index: u32
        ) -> Array<Task> {
            let mut tasks: Array<Task> = ArrayTrait::new();
            let mut i: u32 = 0;
            let count_project_tasks: u32 = self.count_project_tasks.read(project_index);
            loop {
                if (i >= count_project_tasks) {
                    break;
                }

                let task: Task = self.project_tasks.read((project_index, i));

                tasks.append(task);
                i += 1;
            };
            tasks
        }

        // Get a list of project tasks of a developer.
        fn get_member_tasks(self: @ComponentState<TContractState>, member: ContractAddress) -> Array<Task> {
            let mut tasks: Array<Task> = ArrayTrait::new();
            let mut i: u32 = 0;
            let count_member_tasks: u32 = self.count_member_tasks.read(member);
            loop {
                if (i >= count_member_tasks) {
                    break;
                }

                let project_task: (u32, u32) = self.member_tasks.read((member, i));
                let task: Task = self.project_tasks.read(project_task);
                tasks.append(task);
                i += 1;
            };
            tasks
        }


        // Get the information of a project at project_index.
        fn get_project(self: @ComponentState<TContractState>, project_index: u32) -> Project {
            self.projects.read(project_index)
        }

        // Whether a task is paid or not.
        // When a treasury manager does a Dev payment, all completed tasks will be changed to paid tasks.
        fn is_paid_task(self: @ComponentState<TContractState>, project_index: u32, task_index: u32) -> bool {
            self.paid_tasks.read((project_index, task_index))
        }   

        // Only project managers can close an active project
        fn close_project(ref self: ComponentState<TContractState>, project_index: u32) {
            self._assert_is_project_manager();

            let project: Project = self.projects.read(project_index);
            assert(project.status, Errors::NOT_ACTIVE_PROJECT);
            self
                .projects
                .write(
                    project_index,
                    Project {
                        creator: project.creator,
                        start_date: project.start_date,
                        end_date: project.end_date,
                        title: project.title,
                        short_description: project.short_description,
                        project_detail: project.project_detail,
                        // true: active, false: closed
                        status: false
                    }
                );
            self.emit(CloseProject { creator: get_caller_address(), project_index: project_index });
        }

        // Only project managers can update a active project
        fn update_project(
            ref self: ComponentState<TContractState>, project_index: u32, project: Project
        ) {
            self._assert_is_project_manager();
            let current_project: Project = self.projects.read(project_index);
            assert(current_project.status, Errors::NOT_ACTIVE_PROJECT);

            self.projects.write(project_index, project);

            self
                .emit(
                    UpdateProject { creator: get_caller_address(), project_index: project_index }
                );
        }

        // Only project managers can reopen a closed project
        fn reopen_project(ref self: ComponentState<TContractState>, project_index: u32) {
            self._assert_is_project_manager();

            let project: Project = self.projects.read(project_index);
            assert(!project.status, Errors::NOT_CLOSED_PROJECT);

            self
                .projects
                .write(
                    project_index,
                    Project {
                        creator: get_caller_address(),
                        start_date: project.start_date,
                        end_date: project.end_date,
                        title: project.title,
                        short_description: project.short_description,
                        project_detail: project.project_detail,
                        // true: active, false: closed
                        status: true
                    }
                );
            self
                .emit(
                    ReopenProject { creator: get_caller_address(), project_index: project_index }
                );
        }


        // Project managers, task managers, and code_reviewers can change a task status.
        // Task status is an enum with 7 variants.
        // The Starlancer frontend uses task status with 4 variants only (ASSIGNED, REVIEWING, COMPLETE, CANCELLED).
        // If a task status is completed, it can not be changed.
        fn change_task_status(
            ref self: ComponentState<TContractState>,
            project_index: u32,
            task_index: u32,
            status: TaskStatus
        ) {
            self._allow_changing_task_status(project_index);

            let task: Task = self.project_tasks.read((project_index, task_index));
            let mut is_allowed: bool = true;
            is_allowed = match task.status {
                TaskStatus::OPEN => true,
                TaskStatus::ASSIGNED => true,
                TaskStatus::PENDING => true,
                TaskStatus::TESTING => true,
                TaskStatus::REVIEWING => true,
                TaskStatus::COMPLETE => false,
                TaskStatus::CANCELLED => false
            };
            assert(is_allowed, Errors::TASK_COMPLETED);
            self
                .project_tasks
                .write(
                    (project_index, task_index),
                    Task {
                        creator: task.creator,
                        start_date: task.start_date,
                        deadline: task.deadline,
                        title: task.title,
                        short_description: task.short_description,
                        task_detail: task.task_detail,
                        // hours
                        estimate: task.estimate,
                        status: status,
                    }
                )
        }


        // Only project managers can add task managers.
        fn add_task_managers(
            ref self: ComponentState<TContractState>,
            project_index: u32,
            task_managers: Array<ContractAddress>
        ) {
            self._assert_is_project_creator(project_index);
            let len: u32 = task_managers.len().into();

            if (len > 0) {
                let mut i: u32 = 0;
                loop {
                    if (i >= len) {
                        break;
                    }
                    self.task_managers.write((project_index, *task_managers.at(i)), true);
                    i += 1;
                }
            }
        }

        // Only project managers can remove managers.
        fn remove_task_managers(
            ref self: ComponentState<TContractState>,
            project_index: u32,
            task_managers: Array<ContractAddress>
        ) {
            self._assert_is_project_creator(project_index);
            let len: u32 = task_managers.len().into();

            if (len > 0) {
                let mut i: u32 = 0;
                loop {
                    if (i >= len) {
                        break;
                    }
                    self.task_managers.write((project_index, *task_managers.at(i)), false);
                    i += 1;
                }
            }
        }

        // Only project managers can add code_reviewers.
        fn add_code_reviewers(
            ref self: ComponentState<TContractState>,
            project_index: u32,
            code_reviewers: Array<ContractAddress>
        ) {
            self._assert_is_project_creator(project_index);
            let len: u32 = code_reviewers.len().into();

            if (len > 0) {
                let mut i: u32 = 0;
                loop {
                    if (i >= len) {
                        break;
                    }
                    self.code_reviewers.write((project_index, *code_reviewers.at(i)), true);
                    i += 1;
                }
            }
        }

        // Only project managers can remove code_reviewers.
        fn remove_code_reviewers(
            ref self: ComponentState<TContractState>,
            project_index: u32,
            code_reviewers: Array<ContractAddress>
        ) {
            self._assert_is_project_creator(project_index);
            let len: u32 = code_reviewers.len().into();

            if (len > 0) {
                let mut i: u32 = 0;
                loop {
                    if (i >= len) {
                        break;
                    }
                    self.code_reviewers.write((project_index, *code_reviewers.at(i)), false);
                    i += 1;
                }
            }
        }
    }

    #[generate_trait]
    impl DAOProjectInternalImpl<
        TContractState, +HasComponent<TContractState>
    > of DAOProjectInternalImplTrait<TContractState> {

        // Whether the caller is a project manager or not.
        fn _assert_is_project_manager(self: @ComponentState<TContractState>) {
            assert(self.project_managers.read(get_caller_address()), Errors::NOT_PROJECT_MANAGER);
        }

        // Whether the caller is a project creator or not.
        fn _assert_is_project_creator(self: @ComponentState<TContractState>, project_index: u32) {
            let project: Project = self.projects.read(project_index);
            assert(project.creator == get_caller_address(), Errors::NOT_PROJECT_CREATOR);
        }

        // Whether the caller is a task manager or not.
        fn _assert_is_task_manager(self: @ComponentState<TContractState>, project_index: u32) {
            assert(
                self.task_managers.read((project_index, get_caller_address())),
                Errors::NOT_TASK_MANAGER
            );
        }

        // Whether the caller is a code reviewer or not.
        fn _assert_is_code_reviewer(self: @ComponentState<TContractState>, project_index: u32) {
            assert(
                self.code_reviewers.read((project_index, get_caller_address())),
                Errors::NOT_CODE_REVIEWER
            );
        }

        // Whether the caller can change a task status.
        fn _allow_changing_task_status(self: @ComponentState<TContractState>, project_index: u32) {
            let caller_address: ContractAddress = get_caller_address();
            assert(
                self.project_managers.read(caller_address)
                    || self.code_reviewers.read((project_index, caller_address))
                    || self.task_managers.read((project_index, caller_address)),
                Errors::NOT_ALLOW_CHANGING_STATUS
            );
        }


        // Only the DAO admin can add project managers.
        fn _add_project_managers(
            ref self: ComponentState<TContractState>, project_managers: Array<ContractAddress>
        ) {
            let len: u32 = project_managers.len().into();

            if (len > 0) {
                let mut i: u32 = 0;
                loop {
                    if (i >= len) {
                        break;
                    }
                    self.project_managers.write(*project_managers.at(i), true);
                    i += 1;
                }
            }
        }

        // Only the DAO admin can remove project managers.
        fn _remove_project_managers(
            ref self: ComponentState<TContractState>, project_managers: Array<ContractAddress>
        ) {
            let len: u32 = project_managers.len().into();

            if (len > 0) {
                let mut i: u32 = 0;
                loop {
                    if (i >= len) {
                        break;
                    }
                    self.project_managers.write(*project_managers.at(i), false);
                    i += 1;
                }
            }
        }


        // Task managers can create new tasks.
        // A new task will be assigned to the accepted candidate.
        // This action changes some storage variables.
        fn _create_task(
            ref self: ComponentState<TContractState>,
            assignee: ContractAddress,
            project_index: u32,
            task: Task
        ) {
            self._assert_is_task_manager(project_index);
            let project: Project = self.projects.read(project_index);

            assert(project.status, Errors::NOT_ACTIVE_PROJECT);
            let count_project_tasks: u32 = self.count_project_tasks.read(project_index);
            let count_member_tasks: u32 = self.count_member_tasks.read(assignee);

            self
                .project_tasks
                .write(
                    (project_index, count_project_tasks),
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
            self.count_project_tasks.write(project_index, count_project_tasks + 1);
            self
                .member_tasks
                .write((assignee, count_member_tasks), (project_index, count_project_tasks));
            self.count_member_tasks.write(assignee, count_member_tasks + 1);

            self
                .emit(
                    CreateTask {
                        creator: get_caller_address(),
                        project_index: project_index,
                        task_index: count_project_tasks + 1
                    }
                )
        }

        // Get the payment amount of an accepted candidate (a DAO developer, member)
        // The payment amount will be calculated by all completed tasks of the developer.
        fn _get_payment_amount(
            self: @ComponentState<TContractState>, member: ContractAddress, contract: Contract
        ) -> u256 {
            let mut amount: u256 = 0;

            let mut i: u32 = 0;

            match contract.contract_type {
                ContractType::FIXED_PRICE => { amount = contract.fixed_price },
                ContractType::HOURY => {
                    let count_member_tasks: u32 = self.count_member_tasks.read(member);
                    loop {
                        if (i >= count_member_tasks) {
                            break;
                        }
                        let key: (u32, u32) = self.member_tasks.read((member, i));
                        let task: Task = self.project_tasks.read(key);

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
                            
                            let is_paid: bool = self.paid_tasks.read(key);

                            if (is_paid) {
                                i += 1;
                                continue;
                            }

                            let task: Task = self.project_tasks.read(key);

                            amount += task.estimate.into() * contract.hourly_rate;
                        }

                        i += 1;
                    };
                },
            }
            amount
        }


        // Get the payment amount of an accepted candidate (a DAO developer, member)
        // The payment amount will be calculated by all completed tasks of the developer.
        // After the payment process completed, completed tasks will be added to paid tasks.
        // All paid tasks will not be used in the payment calculation process later.
        fn _calculate_billing(
            ref self: ComponentState<TContractState>, member: ContractAddress, contract: Contract
        ) -> u256 {
            let mut amount: u256 = 0;

            let mut i: u32 = 0;

            match contract.contract_type {
                ContractType::FIXED_PRICE => { amount = contract.fixed_price },
                ContractType::HOURY => {
                    let count_member_tasks: u32 = self.count_member_tasks.read(member);
                    loop {
                        if (i >= count_member_tasks) {
                            break;
                        }
                        let key: (u32, u32) = self.member_tasks.read((member, i));
                        let task: Task = self.project_tasks.read(key);

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
                            let is_paid: bool = self.paid_tasks.read(key);

                            if (is_paid) {
                                i += 1;
                                continue;
                            }

                            let task: Task = self.project_tasks.read(key);

                            amount += task.estimate.into() * contract.hourly_rate;
                            self.paid_tasks.write(key, true);
                        }

                        i += 1;
                    };
                },
            }
            amount
        }
    }
}
