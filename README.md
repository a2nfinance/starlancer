## Vision
Create a decentralized job marketplace empowered by blockchain technologies and backed by cryptocurrency payments.
## Description
### 1. Overview

In the wake of the COVID-19 pandemic, remote jobs and the freelancer market have experienced significant growth. In the near future, this market has the full potential to replace on-site jobs. However, if you have ever used traditional freelancer platforms, you can identify four main problems:

- Exorbitant service fees.
- Lack of support for cryptocurrency payments.
- Ease of creating fake reviews and reputations.
- The working process is not transparent and is hard to audit.

Starlancer aims to resolve these issues with a fully on-chain product. With fast transaction completion, low transaction fees, and a Layer 2 solution like Starknet, Starlancer is very well-suited to provide a transparent and auditable working process.

### 2. Demo information

- [Starlancer application](https://starlancer.a2n.finance)
- [Demo video](https://www.youtube.com/watch?v=XdjG1qXedpk)
- [Smart contract addresses & details](https://github.com/a2nfinance/starlancer/tree/master/contracts)
- [Pitch deck](https://www.canva.com/design/DAF5y3n1wOE/X2984P8-gZ7-H8vM4JdH_Q/edit)

### 3. Features:

- **Fully On-Chain:** The Starlancer jobs marketplace is constructed using extensive smart contracts powered by Starknet & Cairo.

- **C2P Marketplace:** This feature enables companies to hire freelancers, with each company functioning as a role-based DAO and incorporating the following features:

    - **Treasury Management:** Each DAO treasury is overseen by treasury managers. They handle funds, maintain whitelisted contributors, and are responsible for salary payments.
    - **Developer Management:** Developer managers are empowered to approve job candidates for becoming company developers. They also have the authority to terminate developer contracts.
    - **Job Management:** This functionality allows job managers to create new jobs, as well as edit and modify job information.
    - **Project Management:** Each DAO includes project managers responsible for initiating and overseeing projects and their respective members. Within a project, two roles support implementation and management:
        - *Task Managers:* They can create tasks, review task status, and make changes.

        - *Code Reviewers:* They can assess coding quality and update task status.

- **P2P Marketplace:**
    - **Job Management:** Employers can create public jobs in the marketplace, and any developer can apply to become a candidate. The employer retains the ability to review and accept candidates.
    - **Task Management:** Each job can comprise multiple tasks, all of which are managed by the employer.

- **Payout Management:** Starlancer supports two types of job contracts—FIXED-PRICE and HOURLY. Payments are automatically calculated using tasks and developer contracts.

- **Low Service Fee:** Starlancer's service fee is governed by a smart contract, with an initial fee rate of 0.2%. However, this smart contract supports discounted fees based on:

    - DAO/Employer account address.
    - Token used for payment.
    - Both discount types can be combined.

- **Cryptocurrency Payment:** In contrast to traditional freelancer platforms, Starlancer allows DAOs and employers to use whitelisted tokens for salary payments. Each job and developer contract can be paid in different tokens.

### 4. How Starlancer works

Starlancer focuses on two main workflows: Companies (DAOs) with developers and employers with developers.

This is a simplified process demonstrating how a DAO works with its developers.

![](frontend/public/docs/c2p.jpg)

- When a candidate is accepted, a contract between the developer and DAO is created. Managers can update, create, and terminate contracts for developers.
- A developer can undertake tasks for multiple projects within a company (DAO).
- Each role in a DAO involves specific steps in the workflow, and the treasury manager will make payments to developers based on completed tasks.

The working process for employers and developers is simpler than the above process. Employers take on all manager roles in this process. Tasks belong to jobs and do not belong to a specific project.

![](frontend/public/docs/p2p.jpg)


### 5. Technical implementation

To develop Starlancer, we follow these steps:

- Research and select ideas.
- Learn the Cairo and Starknet ecosystems.
- Develop smart contracts.
- Write tests.
- Develop UI/UX.
- Update smart contracts to improve UX.
- Fix bugs.

We use OpenZeppelin, Cairo, and Snforge for smart contract development. Additionally, we utilize NextJs, Redux, StarknetJs, and starknet-react for developing the frontend application.

As Starlancer operates fully on-chain, all logic is handled by smart contracts. Our focus lies on the smart contracts architecture:

- **DAOFactory:** This smart contract enables users to register and deploy their DAOs.

- **DAO:** This smart contract comprises four Cairo components. Each component manages its own storage, and the DAO contract serves as a combinator smart contract. The components include:

    - Job component
    - Project component
    - Developer (member) component
    - Treasury component

- **P2PJobsMarketplace:** This smart contract facilitates collaboration between individual employers and freelancers. It consists of two Cairo components:

    - Job component
    - Task component
- **PlatformFee (Service Fee):** This smart contract oversees rate fees, fee payouts, and discounted  fees. A 0.2% service fee is applied to each payment made by DAOs or employers.

- **StarlancerToken:** This token is utilized for incentivizing the community and promoting upcoming features.

The codebase of Starlancer's smart contracts is complex, prompting us to employ automation testing using Snforge. Our test scripts cover:

- **Component Testing:** Each Cairo component undergoes testing with basic use cases.

- **Separate Smart Contract Testing:** Each smart contract is rigorously tested with important use cases.

- **Full Scenario Testing:** A comprehensive test encompasses the entire workflow, from the initial stage to the finish stage.


### 6. Future Development

A blockchain-powered freelancer marketplace is inherently complex, and we have numerous ideas for implementation in the near future.

- **Reputation System:** Enables the tracking of developers and DAOs, monitoring their work and attainment of reputation levels. Incorporates reviewing and reporting features to enhance transparency and accountability.
- **Incentive System:** Facilitates the distribution of rewards to users through our native token or other compatible tokens. Aims to motivate and recognize contributors within the platform.
- **Education & Certification System:**
    - Empowers developers to engage in learning, earning, and obtaining certificates.
    - Supports continuous skill development and credential acquisition.
- **Payment System:** Expands payment options for freelancers, offering alternatives like Crypto streaming or fiat-based payments. Enhances flexibility and accessibility in the financial aspects of freelancing on our platform.

### 7. Conclusion

During the OpenBuild Starknet Hackathon, we had an amazing experience exploring the potentials of Starlancer. Starknet, being a robust blockchain platform, demonstrates significant potential to emerge as a major player in the industry. We take pride in contributing, even in a modest way, to the success of the Starknet ecosystem through Starlancer.

We express our sincere gratitude to the Starknet open-source community and the dedicated support from the Cairo community. Without their invaluable assistance, completing this product within the given time constraints wouldn't have been possible.

We eagerly anticipate making further contributions to the growth and success of the Starknet ecosystem and are enthusiastic about the future possibilities with Starlancer.





