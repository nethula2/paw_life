# SRI LANKA INSTITUTE OF INFORMATION TECHNOLOGY
## FACULTY OF COMPUTING
### SE2030 – Software Engineering | Year 2 Semester 1
#### Academic Year 2026

---

# FINAL PROJECT REPORT
# PawLife: Enterprise Web-Based Veterinary Clinic, Pet Healthcare & Operational Operations Management System

**Group ID: 2026-Y2-S1-MLB-B6G2-07**

---

### Project Team & Allocated Modules

| Student ID | Student Name | Scrum Role | Functional Subsystem / Module | Allocated Viva Sequence | Workload |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **IT25100618** | **Sanvidu S.D.N** | Product Owner | System Administration & Business Intelligence Module | **UC-01** (Configure RBAC & Audit Trails) | 87 Hours |
| **IT25101709** | **De Silva L.P.B** | Scrum Master | Digital Pet Profile & Health Record (EHR) Module | **UC-02** (Search Pet Profile & Log Consult) | 118 Hours |
| **IT25102521** | **Subasinghe R.A.G.I** | Developer 1 | Appointment Scheduling & Notification Module | **UC-03** (Book Appointment Online) | 61 Hours |
| **IT25103607** | **Balasooriya B.A.H.N** | Developer 2 | Smart Inventory & Medical Supply Chain Module | **UC-04** (Track Medicine Stock Levels) | 74 Hours |
| **IT25101534** | **Alahakoon A.M.B.U** | Developer 3 | Operational Centre & Staff Management Module | **UC-05** (Monitor KPIs & Allocate Shifts) | 83 Hours |
| **IT25103408** | **Warnakulasuriya G.A.D.T.S** | Developer 4 | Pet Grooming & Specialty Care Workflow Module | **UC-06** (Track Grooming Session Progress) | 73 Hours |

**Submission Date:** October 2026  
**Instructor / Evaluator:** Department of Software Engineering, SLIIT

---

## Table of Contents
1. [Cover Page](#cover-page)
2. [Introduction](#2-introduction)
   - 2.1 Project Overview
   - 2.2 Objectives
   - 2.3 Target Users or Stakeholders
   - 2.4 Scope and Limitations
3. [Requirements](#3-requirements)
   - 3.1 Functional Requirements
   - 3.2 Non-Functional Requirements
   - 3.3 Constraints or Assumptions
4. [Design](#4-design)
   - 4.1 System Architecture
   - 4.2 Use Case Model & Allocations
   - 4.3 Database Design & Relational Schema Mapping
   - 4.4 User Interface Architecture & Portal Descriptions
5. [Implementation](#5-implementation)
   - 5.1 Tools and Technologies
   - 5.2 Key Features Developed
   - 5.3 Technical Implementation Highlights
6. [Project Management](#6-project-management)
   - 6.1 Agile Approach & Scrum Sprint Summary
   - 6.2 Task Distribution Among Team Members
   - 6.3 Development Phases and Milestones
7. [Conclusion & Future Work](#7-conclusion--future-work)
   - 7.1 Summary of Achievements
   - 7.2 Challenges Faced & Solutions
   - 7.3 Suggestions for Improvement or Extension
8. [Individual Contribution, Teamwork & Lessons Learned](#8-individual-contribution-teamwork--lessons-learned)
9. [References](#9-references)
10. [Appendix](#10-appendix)
    - 10.1 System Repository & Source Code Structure
    - 10.2 Core REST API Endpoint Mapping Matrix

---

## 2. Introduction

### 2.1 Project Overview
The companion animal healthcare sector has evolved rapidly from small private practices into multi-disciplinary veterinary hospitals offering primary medical care, surgery, pharmaceutical dispensing, grooming salons, and emergency clinical observation. Despite this expansion, many clinics still operate with disconnected software tools or manual paper ledgers. Front-desk staff encounter double-booking clashes; veterinarians face delays retrieving past clinical histories; groomers have no visibility into a pet's medical sensitivities; and managers struggle to forecast revenue or prevent pharmaceutical stock expirations.

**PawLife** is an enterprise-grade, web-based veterinary clinic and operational operations management system engineered to unify all clinic workflows into a single collaborative ecosystem. Built on **Java 17** and **Spring Boot 3** with a responsive **Tailwind CSS** frontend, PawLife connects veterinary surgeons, front-desk coordinators, grooming specialists, inventory storekeepers, clinic operations managers, and pet parents.

### 2.2 Objectives
* **Centralized Role-Based Portal Access:** Implement granular Role-Based Access Control (RBAC) across six staff personas and client users, enforcing data protection boundaries.
* **Automated Conflict-Free Scheduling:** Provide an online appointment booking wizard with an atomic slot conflict prevention engine that eliminates double-bookings.
* **Persistent Electronic Health Records (EHR):** Provide comprehensive digital medical histories, structured consultation note recording, digital prescription cards, and automated annual booster vaccination scheduling (+1 year rule).
* **Live 4-Station Salon Pipeline:** Deploy an interactive terminal queue (`Checked-In` &rarr; `Bathing` &rarr; `Styling` &rarr; `Ready for Pickup`) synchronized in real-time with customer tracking widgets.
* **Smart Supply Chain & Expiry Auditing:** Deliver automated medicine ledgers, automatic stock deduction upon service completion, minimum threshold reorder warnings, and waste scrap tracking.
* **Operational Centre Analytics & Shift Rostering:** Supply managers with live clinic throughput KPI counters, non-overlapping weekly duty rosters, and predictive linear regression revenue forecasts.

### 2.3 Target Users or Stakeholders
1. **Veterinary Officers:** Perform diagnostic examinations, record consultation notes, prescribe medication, and administer preventative vaccines.
2. **Appointments & Front-Desk Coordinators:** Manage client bookings, verify doctor availability, check pets into stations, and handle status transitions.
3. **Grooming Specialists:** Manage the salon queue, update pet station progress, note skin/coat conditions, and notify owners when ready.
4. **Inventory Managers:** Maintain pharmaceutical ledgers, accept shipments, monitor expiration dates, and process reorder requisitions.
5. **Centre Operations Managers:** Review clinic volume, monitor departmental bottlenecks, roster weekly duty shifts, and validate attendance.
6. **System Administrators:** Configure security permissions, inspect immutable audit logs, oversee personnel accounts, and examine revenue analytics.
7. **Pet Parents / Clients:** Schedule appointments online, track live salon styling status, review diagnostic histories, and submit verified feedback.

### 2.4 Scope and Limitations
* **In Scope:** Six dedicated role-specific administrative workspaces, a public customer portal, 13 relational tables in 3NF, multi-database support (MySQL 8 and SQLite), real-time background notification polling (8s cycle), and exportable clinical audit reports.
* **Out of Scope & Limitations:** Payment processing operates in internal verified settlement ledger mode without live third-party bank gateways; notifications operate through real-time in-app audio-visual toast engines rather than external paid SMS providers; requires standard modern web browsers (Chrome, Edge, Firefox).

---

## 3. Requirements

### 3.1 Functional Requirements (FRs)

| Module / Member | Req ID | Functional Requirement Description | Priority |
| :--- | :--- | :--- | :--- |
| **System Admin & BI**<br>*(Sanvidu S.D.N)* | **FR-01** | The system shall authenticate staff and enforce Role-Based Access Control (RBAC) permission matrices for all protected endpoints. | High |
| **System Admin & BI**<br>*(Sanvidu S.D.N)* | **FR-02** | The system shall capture immutable audit trails for every security, clinical, and financial transaction with timestamped user identity. | High |
| **System Admin & BI**<br>*(Sanvidu S.D.N)* | **FR-03** | The system shall calculate monthly clinic revenue growth and compute linear regression trend forecasts (+12.5% projected). | Medium |
| **Pet EHR & Health**<br>*(De Silva L.P.B)* | **FR-04** | The system shall register pet profiles with unique microchip numbers and link them to verified pet owner parent records. | High |
| **Pet EHR & Health**<br>*(De Silva L.P.B)* | **FR-05** | The system shall log clinical consultations with structured symptoms, vitals, primary diagnosis, and treatment instructions. | High |
| **Pet EHR & Health**<br>*(De Silva L.P.B)* | **FR-06** | The system shall issue digital prescriptions and calculate automatic vaccination booster due dates (+1 year standard interval). | High |
| **Appointments Hub**<br>*(Subasinghe R.A.G.I)* | **FR-07** | The system shall provide an online appointment booking wizard with real-time date and slot availability inspection. | High |
| **Appointments Hub**<br>*(Subasinghe R.A.G.I)* | **FR-08** | The system shall enforce an atomic slot conflict prevention engine that rejects double-bookings on identical dates, times, and staff. | High |
| **Appointments Hub**<br>*(Subasinghe R.A.G.I)* | **FR-09** | The system shall transition appointment statuses across 'Pending', 'Confirmed', 'In Progress', 'Completed', and 'Cancelled'. | Medium |
| **Smart Inventory**<br>*(Balasooriya B.A.H.N)* | **FR-10** | The system shall maintain a medical stock ledger tracking batch numbers, expiration dates, unit prices, and quantities on hand. | High |
| **Smart Inventory**<br>*(Balasooriya B.A.H.N)* | **FR-11** | The system shall trigger automated low-stock warnings whenever consumable quantities fall below configured safety reorder thresholds. | High |
| **Smart Inventory**<br>*(Balasooriya B.A.H.N)* | **FR-12** | The system shall identify expired pharmaceutical batches, calculate financial waste, and record audited scrap disposals. | Medium |
| **Operations Hub**<br>*(Alahakoon A.M.B.U)* | **FR-13** | The system shall display real-time clinic throughput KPIs, active appointment counts, and departmental alert monitors. | High |
| **Operations Hub**<br>*(Alahakoon A.M.B.U)* | **FR-14** | The system shall manage weekly staff duty shift allocations and prevent roster overlaps or overtime scheduling clashes. | High |
| **Grooming Care**<br>*(Warnakulasuriya G.)* | **FR-15** | The system shall manage an interactive 4-station salon queue (Checked-in &rarr; Bathing &rarr; Styling &rarr; Ready) with quick status advancement. | High |
| **Grooming Care**<br>*(Warnakulasuriya G.)* | **FR-16** | The system shall provide customer-facing real-time grooming progress trackers and log skin/coat health observations. | Medium |

### 3.2 Non-Functional Requirements (NFRs)
* **Performance:** REST API response times for standard queries (appointment availability, patient search, inventory count) remain under 500ms on standard local network topologies.
* **Usability & UX:** Built on responsive mobile/desktop Tailwind CSS layouts with chunky retro-tactile buttons, color-coded status badges, and non-blocking asynchronous toast notifications.
* **Security & Confidentiality:** Staff authorization boundaries are guarded both at the client-side navigation router and server-side Spring REST controllers. Relational integrity is enforced using foreign key cascade rules.
* **Reliability & Concurrency:** Multi-threaded operations are managed via HikariCP connection pooling; slot booking conflicts are rejected atomically.
* **Portability:** Self-contained executable architecture with bundled Maven wrapper running on Java 17 across Windows, Linux, and macOS.

### 3.3 Constraints and Assumptions
* **Constraints:** Minimum JDK 17 required; uses port 3000; requires a modern JavaScript-enabled browser.
* **Assumptions:** Clinic staff have continuous local network access to the workstation server; pet owners possess a registered phone number or email for profile retrieval.

---

## 4. Design

### 4.1 System Architecture
PawLife is engineered following a clean **3-Tier Model-View-Controller (MVC)** architectural design:
1. **Presentation Layer:** Single-Page Application (SPA) style interface built with semantic HTML5, Tailwind CSS, FontAwesome 6, and specialized vanilla JavaScript ES6 controllers (`dashboard.js`, `appointments.js`, `pet_ehr.js`, `inventory.js`, `operations.js`, `grooming.js`, `admin.js`).
2. **Application / Business Logic Layer:** Spring Boot 3.2.4 running on embedded Apache Tomcat 10.1, exposing structured RESTful endpoints and abstracted through a thread-safe database access layer (`Database.java`).
3. **Data Persistence Layer:** Relational database management system with dual support for **MySQL 8.0 Server** (production schema in `database/pawlife_mysql_workbench.sql`) and **SQLite** (`database/pawlife.db`) managed via HikariCP connection pooling.

### 4.2 Use Case Model & Allocations

```
+----------------------------------------------------------------------------------------+
|                                    PAWLIFE SYSTEM                                     |
|                                                                                        |
|  [System Administrator] ------> (UC-01: Configure RBAC Permissions & Audit Logs)       |
|  [Veterinary Officer]   ------> (UC-02: Search Pet Profile, Consultations & Prescribe) |
|  [Pet Owner / Staff]    ------> (UC-03: Book Veterinary / Grooming Appointment Online) |
|  [Inventory Manager]    ------> (UC-04: Track Medicine Stock Levels & Batch Expiry)    |
|  [Centre Manager]       ------> (UC-05: Monitor Clinic KPIs & Allocate Staff Shifts)   |
|  [Grooming Specialist]  ------> (UC-06: 4-Station Salon Terminal & Live Client Tracker)|
+----------------------------------------------------------------------------------------+
```

### 4.3 Database Design & Relational Schema Mapping
The relational schema reflects Third Normal Form (3NF) normalization derived from the system EER model:

| Table Name | Primary Key | Foreign Key(s) | Business Function |
| :--- | :--- | :--- | :--- |
| **`users`** | `user_id` (PK, AI) | None (Base table) | User identity, password, phone, role, and active status. |
| **`pet_owners`** | `owner_id` (PK, AI) | `user_id` &rarr; `users` | Client NIC, emergency contact, and address. |
| **`veterinarians`** | `vet_id` (PK, AI) | `user_id` &rarr; `users` | Veterinary license registration and specialization. |
| **`grooming_staff`** | `groomer_id` (PK, AI) | `user_id` &rarr; `users` | Grooming specialist certification and seniority. |
| **`inventory_managers`** | `manager_id` (PK, AI) | `user_id` &rarr; `users` | Warehouse inventory clearance code. |
| **`pets`** | `pet_id` (PK, AI) | `owner_id` &rarr; `pet_owners` | Pet species, breed, birthdate, microchip no, allergies. |
| **`appointments`** | `appointment_id` (PK) | `pet_id`, `owner_id` | Booking ledger with date, slot, service type, and status. |
| **`consultations`** | `consultation_id` (PK) | `pet_id`, `vet_id`, `appointment_id` | Clinical examination findings, symptoms, and diagnosis. |
| **`prescriptions`** | `prescription_id` (PK) | `consultation_id` &rarr; `consultations` | Drug names, dosage, duration, and instructions. |
| **`vaccination_records`** | `vaccination_id` (PK) | `pet_id`, `vet_id` | Vaccine batch, administered date, +1 year booster date. |
| **`grooming_sessions`** | `session_id` (PK) | `appointment_id`, `pet_id`, `groomer_id` | 4-station salon queue status and coat notes. |
| **`medical_supplies`** | `supply_id` (PK) | `supplier_id` &rarr; `suppliers` | Medicine batch numbers, expiry dates, stock quantities. |
| **`staff_shifts`** | `shift_id` (PK) | `staff_id` &rarr; `users` | Weekly shift schedule (Morning, Evening, Full Day). |
| **`role_permissions`** | `permission_id` (PK) | None | Granular module CRUD permissions matrix per role. |
| **`audit_logs`** | `log_id` (PK, AI) | `user_id` &rarr; `users` | Immutable audit trail recording user operations. |

### 4.4 User Interface Architecture & Portal Descriptions
* **Public Client Hub (`index.html`):** Clean hero showcase with an interactive multi-step appointment booking wizard, patient search, and client review submission carousel.
* **Staff Command Hub (`dashboard.html`):** Unified administration dashboard with dynamic role-restricted navigation:
  * **Overview Hub:** Quick operational KPIs, recent alerts, and direct action shortcuts.
  * **Appointments Hub (UC-03):** Status-filtered booking table (`Pending`, `Confirmed`, `Completed`, `Cancelled`), conflict-free slot inspector, and staff assigner.
  * **Patients & EHR Hub (UC-02):** Visual pet profile cards, microchip search bar, consultation recorder, and printable digital prescription cards.
  * **Smart Inventory Hub (UC-04):** Categorized pharmaceutical stock ledger, visual capacity bars, batch expiry alerts, and replenishment receiving forms.
  * **Grooming Salon Hub (UC-06):** 4-station visual queue (`Checked-In`, `Bathing`, `Styling`, `Ready`) with instant station progression triggers.
  * **Operational Centre Hub (UC-05):** Daily throughput metrics, weekly duty roster grid with overlap protection, and on-duty staff directory.
  * **System Administration Hub (UC-01):** Interactive RBAC permission checkboxes, immutable audit log table, and linear regression revenue visualizer.

---

## 5. Implementation

### 5.1 Tools and Technologies Used
* **Backend Runtime:** Java 17 LTS
* **Framework:** Spring Boot 3.2.4 (Spring MVC, Spring JDBC, Embedded Tomcat 10.1)
* **Build System:** Apache Maven 3.9.6 (Bundled in `.maven/`)
* **Databases:** Oracle MySQL 8.0 Server (Primary live database) & SQLite (`pawlife.db` development fallback)
* **Connection Pool:** HikariCP 5.1.0
* **Frontend:** HTML5, CSS3, Tailwind CSS CDN, FontAwesome 6
* **Client Scripting:** JavaScript (ES6+, Fetch API, AudioContext for notifications)
* **IDE & Tools:** Visual Studio Code, MySQL Workbench 8.0 CE, Git

### 5.2 Key Features Developed
1. **Atomic Double-Booking Prevention Engine:** The `AppointmentController` verifies slot availability against active bookings for matching dates, time slots, and assigned officers before persisting appointments, guaranteeing zero scheduling overlaps.
2. **Member-Aware Routing & Self-Healing Authorization:** Frontend controller `dashboard.js` dynamically evaluates user credentials on login, automatically directing team members (such as Subasinghe R.A.G.I to the Appointments Hub) to their designated module and self-healing legacy cached roles.
3. **Dialect-Agnostic SQL Architecture:** `Database.java` abstracts query execution using Spring's `JdbcTemplate`, supporting standard SQL `CURRENT_TIMESTAMP`, nullable date formats, and MySQL `PIPES_AS_CONCAT` session mode.
4. **Live Audio-Visual Polling Engine:** Background poller inspects newly scheduled appointments and inventory alerts every 8 seconds, generating synthetic web audio chimes and non-intrusive toast banners.
5. **Automated Vaccination Booster Calculator:** Upon recording a vaccination, the system automatically computes and persists the +1 year booster due date.

---

## 6. Project Management

### 6.1 Agile Approach & Scrum Sprint Summary
The development of PawLife was executed following the **Agile Scrum** framework across three structured sprints:

* **Sprint 1 (Weeks 4 – 7): Architecture, Security & Core High-Priority Stories**
  * Configured Spring Boot backend and HikariCP connection pooling.
  * Designed the normalized 3NF relational database schema.
  * Developed RBAC authentication gateways and immutable audit logging (Sanvidu).
  * Built pet profile registration and microchip lookup (De Silva).
  * Implemented online appointment booking and slot conflict detection (Subasinghe).
  * Created basic medical inventory stock ledgers (Balasooriya).
  * Established the operations overview layout (Alahakoon).

* **Sprint 2 (Weeks 8 – 11): Operational Workflows, Clinical EHR & Grooming Pipeline**
  * Built structured consultation logger and digital prescription cards (De Silva).
  * Developed weekly staff duty rostering with shift overlap prevention (Alahakoon).
  * Implemented minimum stock threshold warnings and usage deductions (Balasooriya).
  * Developed 4-station salon terminal queue and coat observation notes (Warnakulasuriya).
  * Built appointment status tracking and customer booking history (Subasinghe).
  * Implemented linear regression monthly revenue forecasting (Sanvidu).

* **Sprint 3 (Weeks 12 – 14): System Integration, Hardening & Live Verification**
  * Integrated dual-database compatibility (MySQL 8.0 Workbench and SQLite).
  * Implemented cache-busting versioning (`?v=3.5`) and zero-cache HTTP headers.
  * Integrated real-time audio notification poller and client grooming tracker widget.
  * Conducted comprehensive end-to-end integration tests and prepared documentation.

### 6.2 Task Distribution Among Team Members

| Member Name & ID | Scrum Role | Deliverables & User Stories | Workload |
| :--- | :--- | :--- | :--- |
| **Sanvidu S.D.N**<br>*(IT25100618)* | Product Owner | RBAC security engine, Admin console, Immutable audit logging, Revenue analytics & Linear regression forecasting. | 87 Hours |
| **De Silva L.P.B**<br>*(IT25101709)* | Scrum Master | Pet EHR module, Multi-parameter patient search, Clinical consultation logger, Digital prescriptions, Booster engine. | 118 Hours |
| **Subasinghe R.A.G.I**<br>*(IT25102521)* | Developer 1 | Online appointment booking wizard, Atomic slot conflict prevention engine, Booking status lifecycle, Member routing. | 61 Hours |
| **Balasooriya B.A.H.N**<br>*(IT25103607)* | Developer 2 | Smart inventory ledger, Batch number & expiry tracker, Automated reorder warnings, Stock deduction audit trail. | 74 Hours |
| **Alahakoon A.M.B.U**<br>*(IT25101534)* | Developer 3 | Operational Centre dashboard, Daily throughput KPI monitors, Weekly staff duty rostering & shift conflict detector. | 83 Hours |
| **Warnakulasuriya G.A.D.T.S**<br>*(IT25103408)* | Developer 4 | Grooming salon module, 4-station interactive terminal queue, Live customer pet grooming tracker widget, Coat notes. | 73 Hours |

---

## 7. Conclusion & Future Work

### 7.1 Summary of Achievements
PawLife successfully delivers a production-ready, enterprise-grade veterinary clinic and operations management platform. All six sequence use cases (UC-01 through UC-06) have been implemented, tested, and verified. Key achievements include the elimination of double-booking errors through atomic validation, comprehensive clinical EHR record keeping with automated booster scheduling, real-time salon tracking, and seamless live synchronization with MySQL Workbench.

### 7.2 Challenges Faced & Solutions
1. **SQL Dialect Variations:** Transitioning between SQLite and MySQL 8.0 revealed syntax differences in date types and string concatenation. Resolved by standardizing on `CURRENT_TIMESTAMP`, making date columns nullable, and setting `sessionVariables=sql_mode='PIPES_AS_CONCAT'`.
2. **Shared Persona Routing:** Initially, shared administrative roles in legacy records caused navigation conflicts. Resolved by introducing identity-aware frontend routing that verifies student credentials and routes users directly to their designated workspace.
3. **Aggressive Browser Caching:** Browsers cached older JavaScript bundles during testing. Resolved by introducing query versioning (`?v=3.5`) and disabling Spring Boot static resource cache headers.

### 7.3 Suggestions for Improvement or Extension
* **Telemedicine Video Consultations:** Integrate WebRTC video triage to enable remote pre-appointment consultations.
* **IoT Smart Collar Integration:** Stream biometric telemetry (resting heart rate, GPS activity) from smart pet collars directly into the Pet EHR dashboard.
* **AI-Assisted Diagnostic Triage:** Incorporate machine learning models to suggest preliminary differential diagnoses based on clinical symptom history.
* **Native Mobile Apps:** Build cross-platform Flutter applications for pet owners to receive instant push alerts when their pet finishes grooming.

---

## 8. Individual Contribution, Teamwork & Lessons Learned

| Member Name & ID | Specific Role & Responsibilities | Challenges Faced | How Overcome | Key Lessons Learned | Reflection on Project |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sanvidu S.D.N**<br>*(IT25100618)* | **Product Owner & System Admin Lead.**<br>Implemented RBAC security matrices, immutable audit logs, BI revenue analytics, and linear regression forecasting models. | Coordinating backlog priorities across six modules and ensuring no authorization leaks between roles. | Built unified security filters and dynamic permission matrices configurable through the admin portal. | Mastered software architecture governance, backlog prioritization, and cross-module API consistency. | Collaborative synergy was excellent. Establishing the security foundation early prevented major integration issues. |
| **De Silva L.P.B**<br>*(IT25101709)* | **Scrum Master & Pet EHR Lead.**<br>Developed patient search, clinical consultation logger, digital prescription cards, and annual booster vaccination engine. | Managing detailed clinical data structures and prescription histories without slow queries. | Normalized consultation tables, indexed pet microchip numbers, and created structured modal forms. | Gained deep expertise in clinical data modeling, agile scrum facilitation, and relational query design. | The team maintained high sprint momentum. The EHR module provides a clean, clinical-grade medical record. |
| **Subasinghe R.A.G.I**<br>*(IT25102521)* | **Developer 1 (UC-03 Lead).**<br>Engineered online appointment scheduling wizard, atomic slot conflict engine, booking status transitions, and member routing. | Preventing simultaneous slot conflicts and ensuring accurate routing to the Appointments Hub. | Implemented concurrency checks in SQL queries and identity-aware frontend routing logic. | Learned race condition prevention in scheduling systems and clean RESTful error status handling. | My module is the central gateway for clients. Ensuring zero slot collisions proved essential to system reliability. |
| **Balasooriya B.A.H.N**<br>*(IT25103607)* | **Developer 2 (UC-04 Lead).**<br>Developed smart inventory ledger, batch number & expiry date tracker, automated low-stock warnings, and waste scrap reporting. | Synchronizing inventory deductions across both clinical consultations and salon usage. | Built automated service-level deduction methods linked to completed appointment workflows. | Understood the importance of batch expiration auditing and automated reorder alerts in healthcare. | The inventory ledger functioned reliably. Automating expiry audits provided significant operational value. |
| **Alahakoon A.M.B.U**<br>*(IT25101534)* | **Developer 3 (UC-05 Lead).**<br>Constructed Centre Operations hub, daily clinic throughput KPI counters, weekly duty rostering, and shift conflict validation. | Validating weekly duty rosters to prevent double-booking staff across overlapping shifts. | Created custom client and server validation algorithms checking time non-intersection before saving. | Acquired practical experience in resource scheduling algorithms, UI data visualization, and clinic metrics. | The operational hub unifies data from all modules. Close collaboration was key to building accurate KPI views. |
| **Warnakulasuriya G.A.D.T.S**<br>*(IT25103408)* | **Developer 4 (UC-06 Lead).**<br>Built pet grooming workflow, 4-station salon terminal queue, live customer grooming progress widget, and coat condition notes. | Providing real-time station transition visibility to pet owners without manual page refreshes. | Implemented asynchronous client-side polling and state management to update station indicators. | Learned event-driven UI development, asynchronous API polling techniques, and grooming workflow modeling. | The live salon tracker significantly enhances client satisfaction. Cross-module handoffs worked smoothly. |

---

## 9. References

All external literature, frameworks, standards, and technical specifications referenced in this project follow the **IEEE Referencing Style**:

1. I. Sommerville, *Software Engineering*, 10th ed. Boston, MA, USA: Pearson, 2016.
2. R. S. Pressman and B. R. Maxim, *Software Engineering: A Practitioner's Approach*, 9th ed. New York, NY, USA: McGraw-Hill Education, 2020.
3. K. Beck et al., "Manifesto for Agile Software Development," Agile Alliance, 2001. [Online]. Available: https://agilemanifesto.org/.
4. K. Schwaber and J. Sutherland, "The Scrum Guide: The Definitive Guide to Scrum: The Rules of the Game," Scrum.org, Nov. 2020. [Online]. Available: https://scrumguides.org/.
5. Spring Boot Documentation Team, "Spring Boot Reference Documentation (Version 3.2.4)," VMware Tanzu, Mar. 2024. [Online]. Available: https://docs.spring.io/spring-boot/docs/3.2.4/reference/html/.
6. Oracle Corporation, "MySQL 8.0 Reference Manual," Oracle Corporation, 2024. [Online]. Available: https://dev.mysql.com/doc/refman/8.0/en/.
7. B. Brett and B. Hikari, "HikariCP: Fast, simple, reliable JDBC connection pool," GitHub Repository, 2024. [Online]. Available: https://github.com/brettwooldridge/HikariCP.
8. Tailwind Labs, "Tailwind CSS: A utility-first CSS framework for rapid UI development," Tailwind Labs Inc., 2024. [Online]. Available: https://tailwindcss.com/docs.
9. ISO/IEC/IEEE, "Systems and software engineering -- Requirements engineering," ISO/IEC/IEEE 29148:2018 Standard, Nov. 2018.
10. ISO/IEC/IEEE, "Systems and software engineering -- Architecture description," ISO/IEC/IEEE 42010:2011 Standard, Dec. 2011.
11. E. Gamma, R. Helm, R. Johnson, and J. Vlissides, *Design Patterns: Elements of Reusable Object-Oriented Software*. Reading, MA, USA: Addison-Wesley, 1994.
12. R. T. Fielding, "Architectural Styles and the Design of Network-based Software Architectures," Ph.D. dissertation, Dept. Inf. Comput. Sci., Univ. California, Irvine, CA, USA, 2000.

---

## 10. Appendix

### 10.1 System Repository & Source Code Structure
```text
Paw_Life/
├── pom.xml                                   # Maven build descriptor and dependencies
├── run.bat                                   # One-click startup script for Windows
├── PawLife_Final_Report_SE2030.docx          # Formatted Final Report (Word / PDF format)
├── PawLife_Final_Report_SE2030.md            # Markdown version of Final Report
├── src/main/java/com/pawlife/
│   ├── PawLifeApplication.java              # Application bootstrap & configuration
│   ├── Database.java                         # Thread-safe JDBC abstraction layer
│   ├── AppointmentController.java            # UC-03 Scheduling & slot conflict engine
│   ├── PetController.java                    # UC-02 EHR, clinical consults & prescriptions
│   ├── InventoryController.java              # UC-04 Stock tracking & batch expiry
│   ├── OperationsController.java             # UC-05 Duty rosters & throughput KPIs
│   ├── GroomingController.java               # UC-06 4-station salon queue pipeline
│   ├── AdminController.java                  # UC-01 RBAC security & audit trails
│   └── CustomerController.java               # Client portal & feedback handler
├── src/main/resources/
│   ├── application.properties               # MySQL & SQLite datasource configuration
│   └── static/                               # Spring Boot static web resources
├── public/                                   # Live web assets
│   ├── index.html                            # Public website & booking wizard
│   ├── dashboard.html                        # Role-aware staff management portal
│   └── js/                                   # Client-side JavaScript modules
└── database/
    ├── pawlife_mysql_workbench.sql           # MySQL Workbench production database script
    ├── pawlife_schema.sql                    # Relational schema DDL definition
    └── pawlife.db                            # SQLite database file
```

### 10.2 Core REST API Endpoint Mapping Matrix

| HTTP Method | Endpoint URI | Target Subsystem | Security Clearance |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authentication Gateway | Public / All Personas |
| `GET` | `/api/appointments` | Appointments Hub (UC-03) | Appointments Manager, Admin |
| `POST` | `/api/appointments/book` | Appointments Hub (UC-03) | Pet Owner, Front Desk |
| `GET` | `/api/appointments/available-slots` | Appointments Hub (UC-03) | Public / All Personas |
| `GET` | `/api/pets` | Digital Pet EHR (UC-02) | Veterinary Officer, Admin |
| `POST` | `/api/pets` | Digital Pet EHR (UC-02) | Veterinary Officer, Pet Owner |
| `POST` | `/api/consultations` | Digital Pet EHR (UC-02) | Veterinary Officer Only |
| `GET` | `/api/inventory/supplies` | Smart Inventory (UC-04) | Inventory Manager, Admin |
| `POST` | `/api/inventory/batch` | Smart Inventory (UC-04) | Inventory Manager Only |
| `GET` | `/api/operations/dashboard-kpis` | Operational Centre (UC-05) | Centre Manager, Admin |
| `POST` | `/api/operations/shifts` | Operational Centre (UC-05) | Centre Manager Only |
| `GET` | `/api/grooming/queue` | Grooming Care (UC-06) | Grooming Staff, Admin |
| `POST` | `/api/grooming/transition` | Grooming Care (UC-06) | Grooming Staff Only |
| `GET` | `/api/admin/audit-logs` | System Admin & BI (UC-01) | System Administrator Only |
| `PUT` | `/api/admin/roles/{role}` | System Admin & BI (UC-01) | System Administrator Only |

---
*End of Report — Prepared for SLIIT SE2030 Software Engineering Evaluation, October 2026.*
