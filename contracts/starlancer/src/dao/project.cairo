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
    fn get_project(self: @TContractState, project_index: u32) -> Project;
    fn close_project(ref self: TContractState, project_index: u32);
    fn reopen_project(ref self: TContractState, project_index: u32);
    fn update_project(ref self: TContractState, project_index: u32, project: Project);
    fn change_task_status(
        ref self: TContractState, project_index: u32, task_index: u32, status: TaskStatus
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
        project_managers: LegacyMap<ContractAddress, bool>,
        // project_index, task_manager
        task_managers: LegacyMap<(u32, ContractAddress), bool>,
        // project_index, code_reviewer
        code_reviewers: LegacyMap<(u32, ContractAddress), bool>,
        // project_index, project details
        projects: LegacyMap<u32, Project>,
        // project_index, task_index
        project_tasks: LegacyMap<(u32, u32), Task>,
        count_project: u32,
        // project_index, counter
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
                if (i >= len_code_reviewer) {
                    break;
                }
                self.code_reviewers.write((count_project, *code_reviewers.at(i)), true);
                i += 1;
            };
            self.count_project.write(count_project + 1);
            self
                .emit(
                    CreateProject {
                        creator: get_caller_address(), project_index: count_project + 1
                    }
                );
        }


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

        fn get_project(self: @ComponentState<TContractState>, project_index: u32) -> Project {
            self.projects.read(project_index)
        }

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
    }

    #[generate_trait]
    impl DAOProjectInternalImpl<
        TContractState, +HasComponent<TContractState>
    > of DAOProjectInternalImplTrait<TContractState> {
        fn _assert_is_project_manager(self: @ComponentState<TContractState>) {
            assert(self.project_managers.read(get_caller_address()), Errors::NOT_PROJECT_MANAGER);
        }

        fn _assert_is_task_manager(self: @ComponentState<TContractState>, project_index: u32) {
            assert(
                self.task_managers.read((project_index, get_caller_address())),
                Errors::NOT_TASK_MANAGER
            );
        }

        fn _assert_is_code_reviewer(self: @ComponentState<TContractState>, project_index: u32) {
            assert(
                self.code_reviewers.read((project_index, get_caller_address())),
                Errors::NOT_CODE_REVIEWER
            );
        }

        fn _allow_changing_task_status(self: @ComponentState<TContractState>, project_index: u32) {
            let caller_address: ContractAddress = get_caller_address();
            assert(
                self.project_managers.read(caller_address)
                    || self.code_reviewers.read((project_index, caller_address))
                    || self.task_managers.read((project_index, caller_address)),
                Errors::NOT_ALLOW_CHANGING_STATUS
            );
        }

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
                                break;
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
