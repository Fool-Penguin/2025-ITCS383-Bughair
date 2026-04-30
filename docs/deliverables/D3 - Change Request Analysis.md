# D3: Change Request Analysis

To create **D3: Change Request Analysis**, you must break down the three mandatory features (the Native Android App and the two features from your Product Owner) into at least **8 specific Change Requests (CRs)**. These must be documented in a file named `D3_CHANGE_REQUESTS.md`.

---

## Requirements for D3

You must distribute your 8 change requests across the following four maintenance types:

*   **Corrective (2):** Fixing discovered bugs or errors.
*   **Adaptive (2):** Changing the system to work in a new environment (e.g., adapting the backend for the Android app).
*   **Perfective (2):** Adding new functionalities or improving existing ones.
*   **Preventive (2):** Improving code to prevent future issues or making it easier to maintain.

---

## Change Request Table Template

Each of the 8 requests must follow this specific schema:

| Attribute | Description |
| :--- | :--- |
| **Associated Feature** | [Name of the feature this CR belongs to] |
| **Description** | [Detailed explanation of the specific change] |
| **Maintenance Type** | [Corrective / Adaptive / Perfective / Preventive] |
| **Priority** | [e.g., Low, Medium, High] |
| **Severity** | [e.g., Low, Medium, High, Critical] |
| **Time to Implement** | [Estimated time, e.g., 2 person-days] |
| **Verification Method** | [How you will prove it works, e.g., Unit Testing, UI Inspection] |

---

## Example Drafts for your 8 CRs

Since **Feature 1** is the Native Android App, several of your CRs will likely stem from that. Below are examples you can adapt based on your specific project and the features requested by your Product Owner.

### 1. Adaptive (For Feature 1)
*   **Associated Feature:** Mobile Client App
*   **Description:** Update the backend API authentication logic to support JWT tokens sent from a mobile client header instead of relying on web session cookies.
*   **Maintenance Type:** Adaptive

### 2. Corrective (Bug Fix)
*   **Associated Feature:** [Original Feature Name]
*   **Description:** Fixed a bug where the search results returned an empty list if the query contained special characters.
*   **Maintenance Type:** Corrective

### 3. Perfective (For Feature 2 or 3)
*   **Associated Feature:** [PO Requested Feature]
*   **Description:** Implement a "Dark Mode" toggle in the Android UI as requested by the Product Owner to improve user experience.
*   **Maintenance Type:** Perfective

### 4. Preventive (Code Improvement)
*   **Associated Feature:** Entire Project
*   **Description:** Refactor the database connection logic into a Singleton pattern to prevent memory leaks and redundant connection openings in the new mobile environment.
*   **Maintenance Type:** Preventive

---

## Next Steps for your Group:

1.  **Contact your Product Owner group** (see the group pair table in the sources) to get the requirements for Features 2 and 3.
2.  **Define at least 2 CRs** for each of the 4 types mentioned above.
3.  **Ensure you have 8 tables** in total inside your `D3_CHANGE_REQUESTS.md` file.
