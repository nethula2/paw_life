# PawLife: Web-Based Pet Care Management System


---

##  Team Members & Module Workload Allocation

| Student ID | Member Name | Scrum Role | Assigned Functional Module | Primary Viva Sequence Function | Functional Deliverables |
|---|---|---|---|---|---|
| **IT25100618** | **Sanvidu S.D.N** | Product Owner | **System Admin & Business Intelligence** | Configure RBAC Permissions (UC-01) | Full RBAC Matrix, Master Role Lock, Audit Logs, R Statistical Analytics |
| **IT25101709** | **De Silva L.P.B** | Scrum Master | **Digital Pet Profile & Health Record (EHR)** | Search Pet Profile & Log Consultation (UC-02) | Pet Search/EHR, Consultation Logger, Auto-Calculated Next Due Date, Digital Rx |
| **IT25102521** | **Subasinghe R.A.G.I** | Developer 1 | **Appointment Scheduling & Notifications** | Book Appointment Online (UC-03) | Real-time Slot Availability, Double-Booking Conflict Engine (409), Notifications |
| **IT25103607** | **Balasooriya B.A.H.N** | Developer 2 | **Smart Inventory & Supply Chain** | Track Medicine Stock Levels (UC-04) | Batch & Expiry Tracking, Future Expiry Validation, Low-Stock Threshold Triggers, Stock Deduction |
| **IT25101534** | **Alahakoon A.M.B.U** | Developer 3 | **Operational Centre & Staff Management** | Monitor Dashboard & Allocate Shifts (UC-05) | Manager Operations Dashboard, Overdue Alerts, Weekly Staff Shifts & Conflict Detector |
| **IT25103408** | **Warnakulasuriya G.A.D.T.S** | Developer 4 | **Pet Grooming & Specialty Care Workflow** | Track Grooming Session Progress (UC-06) | Station Terminal Queue, Stage Transitions, Observation Notes, Owner Push Alert |

---

## Quick Start Instructions

### 1. Run .\run_java_server.bat on vs code and open this via the browser - http://localhost:3000 

---

## System Feature Demonstration Guide

The top bar features an **"Evaluate Role" Switcher** allowing you and the examiners to switch between personas with a single click:

### 1. Sanvidu S.D.N (IT25100618) - System Admin & Business Intelligence
- Click **"Sanvidu (Admin & BI)"** in the top bar.
- **RBAC Matrix (UC-01)**: View permissions across modules. Try editing permissions for the `Admin` role — notice the system displays: *"Cannot edit default master roles"*, enforcing administrative security integrity.
- **Save Changes**: Edit permissions for `Centre Manager` and click **"Save Changes"**. Notice the live toast confirmation and instant entry in the **Audit Trail**.
- **R Analytics Engine**: Click **"Run R Analytics Engine"** or **"Recompute in R"** to showcase real-time execution of `analytics/bi_analytics.R`, revenue aggregations, linear predictive forecasting (+12.5%), and the R-generated visualization chart!

### 2. De Silva L.P.B (IT25101709) - Digital Pet Profile & EHR
- Click **"De Silva (Pet EHR)"** in the top bar.
- **Search (UC-02)**: Search for `"Buddy"` to view matching profiles. Search for a non-existent name to observe the clean message *"No records match search criteria"*.
- **EHR & Timeline**: Click **"View Health Record"** on Buddy. View the complete Electronic Health Record, past diagnoses, allergies, and vaccination history.
- **Consultation Logging**: Click **"Consult"** or **"Log Consultation"**. Test leaving Diagnosis empty to trigger the mandatory clinical field validation alert. Fill in diagnosis and treatment notes to append to the health timeline.
- **Vaccination Auto-Calculation (PBI-11)**: Click **"Add Vaccine Record"**, choose today's date — notice the next booster date is automatically computed to +1 year!
- **Digital Prescription**: Click **"Download Rx"** to view and print the official digitally verified prescription card.

### 3. Subasinghe R.A.G.I (IT25102521) - Appointment Scheduling & Notifications
- Click **"Subasinghe (Booking)"** in the top bar.
- **Online Booking (UC-03)**: Select a pet, service category, and date.
- **Slot Availability Engine**: Notice how already-reserved slots are automatically crossed out and locked in real time.
- **Double-Booking Prevention (409 Conflict)**: When an attempt is made to reserve an already booked slot, the system rejects it with an instant conflict alert and prompts for an alternative slot.
- **Notifications**: Check the notification bell in the header to see booking confirmations and reminders.

### 4. Balasooriya B.A.H.N (IT25103607) - Smart Inventory & Supply Chain
- Click **"Balasooriya (Stock)"** in the top bar.
- **Stock Tracking (UC-04)**: Search items by name, category, or batch number. Toggle the **"Low Stock Only"** filter.
- **Receive Batch**: Click **"Receive New Stock Batch"**. Test setting an expiry date in the past to witness the validation alert: *"Expiry date must be in the future"*.
- **Threshold Triggers**: Add a batch or click **"Deduct Use"** to decrease inventory below the minimum threshold, immediately triggering an automated low-stock reorder warning banner.

### 5. Alahakoon A.M.B.U (IT25101534) - Operational Centre & Staff Management
- Click **"Alahakoon (Centre Ops)"** in the top bar.
- **Dashboard KPIs (UC-05)**: View real-time counters for Today's Appointments, Active Grooming, Overdue Vaccinations, Low-Stock items, and Revenue.
- **Alert Center**: Review the automated operational alert banners scanning for overdue vaccinations and stock shortages.
- **Shift Scheduling & Conflict Detection**: Click **"Allocate Staff Shift"**. Try assigning an overlapping shift to an already scheduled staff member on the same date to see the conflict modal preventing schedule overlap.

### 6. Warnakulasuriya G.A.D.T.S (IT25103408) - Pet Grooming Workflow
- Click **"Warnakulasuriya (Grooming)"** in the top bar.
- **Station Terminal Queue (UC-06)**: View the 4 sequential columns: `1. Checked-in` &rarr; `2. Bathing Station` &rarr; `3. Scissor & Styling` &rarr; `4. Ready for Pick-up`.
- **Workflow Progression**: Click **"Start Bathing"**, **"Move to Styling"**, or **"Mark Ready"**. Log coat condition and behavioral notes.
- **Automated Owner Alert**: When advancing a pet to **"Ready for Pick-up"**, the system automatically dispatches an SMS/Push notification alert to the pet owner!
- **Pet Owner Live Tracker**: Click the eye icon to view the live animated progress bar on the Pet Owner Portal.

---

## Database Architecture & SQL Schema

- **Relational SQL DDL Script**: [`database/pawlife_schema.sql`](file:///c:/Users/sanvi/Desktop/Paw_Life/database/pawlife_schema.sql) strictly matches your team's **EER Diagram**.
- **Realistic Seed Data**: [`database/seed_data.sql`](file:///c:/Users/sanvi/Desktop/Paw_Life/database/seed_data.sql) populates all 6 personas, realistic clinical history, appointments, and inventory records.
- **Local Relational DB**: [`database/pawlife.db`](file:///c:/Users/sanvi/Desktop/Paw_Life/database/pawlife.db) runs seamlessly offline for foolproof presentations during the viva.
