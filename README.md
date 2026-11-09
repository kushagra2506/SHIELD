# SHIELD — Merchant Risk Intelligence Platform
> **PayU Innovation Challenge** | Fintech Risk & Fraud Analytics Dashboard

SHIELD is a high-performance, dark-themed financial intelligence application designed to detect merchant anomalies, benchmark behavioural patterns against category peers, and inspect directed synthetic network payment flows.

---

## 📋 Prerequisites to Download & Install

Before running the project, make sure you have the following installed on your machine:

1. **Node.js** (Version `18.0.0` or higher, v20+ recommended)
   - Download: [https://nodejs.org/](https://nodejs.org/) (Choose the LTS or Current version)
   - Installing Node.js also automatically installs **npm** (Node Package Manager).
   - Verify installation in your terminal:
     ```bash
     node -v
     npm -v
     ```

2. **A Modern Web Browser**
   - Google Chrome, Microsoft Edge, Brave, Firefox, or Safari.

---

## 🚀 Quick Start Guide

### 1. Open Terminal in the Project Directory
Open your terminal (PowerShell, Command Prompt, or VS Code terminal) and navigate to the project directory:
```bash
cd "c:\Users\kusha\OneDrive\Desktop\Payu hackathon"
```

### 2. Install Dependencies
Run the install command to download all required packages:
```bash
npm install
```
*Dependencies installed include: React 18, Vite, Tailwind CSS, Recharts, React Flow (`reactflow`), PapaParse, and Lucide React icons.*

### 3. Start the Development Server
```bash
npm run dev
```

The terminal will display the local URL:
```
  ➜  Local:   http://localhost:5173/
```

Open your browser and navigate to **[http://localhost:5173/](http://localhost:5173/)**.

---

## 🛠️ Other Useful Scripts

- **Build for Production**:
  ```bash
  npm run build
  ```
  *(Compiles TypeScript and bundles optimized assets into the `dist/` folder).*

- **Preview Production Build**:
  ```bash
  npm run preview
  ```

---

## 📊 Dataset Ingestion & Handling

- The application automatically loads the full dataset:
  `public/payu_merchant_fraud_dataset_enhanced.csv` (1,200 merchant records, 17 columns).
- **Import / Replace CSV**: You can also click the **"Import CSV"** button in the top navigation bar to test any new or modified CSV dataset dynamically.
- **Dataset Schema**:
  - `merchant_id`, `declared_category`, `monthly_volume_inr`, `monthly_txn_count`, `avg_txn_value_inr`
  - `off_hours_ratio`, `round_amount_ratio`, `payout_velocity_hrs`, `unique_payer_ratio`, `high_val_txn_ratio`, `dispute_rate_pct`
  - `payer_flows_json`: Deserialized JSON array of incoming fund flows (`inflow_to_merchant`)
  - `payout_flows_json`: Deserialized JSON array of outgoing settlements (`outflow_from_merchant`)
  - `is_gambling_front`: Ground truth label strictly isolated for offline validation.

---

## 🖥️ Screen Overview

### Screen 1: Merchant Profile
- **Dynamic Portfolio Summary**: Instant calculation of total merchants (1,200), total monthly volume (₹ Cr), total transactions, average dispute rate, and category count.
- **Merchant Directory Table**:
  - Search by Merchant ID (e.g. `MCH_1001`).
  - Filter by Declared Category or Risk Tier (`Low`, `Moderate`, `Elevated`).
  - Sort by any column (Volume, Ticket size, Dispute rate, Payout velocity, Risk).
  - Responsive pagination (15 items/page).
- **Merchant Detail Panel**:
  - Deep-dive metrics with comparison bars against category medians.
  - **Explainable Risk Indicator**: Transparent multi-factor heuristic scoring (0–100) detailing exact operational contributors without using ground-truth labels.

### Screen 2: Behaviour Twin
- **Dynamic Peer Benchmarking**: Compares the selected merchant against category peer medians across 8 key dimensions.
- **Multi-Dimensional Behaviour Radar**: Recharts radar chart mapping merchant profile vs. category median onto a normalized peer envelope (0–100) to avoid metric distortion.
- **Automated Observations**: Data-backed, explainable commentary identifying operational divergence (e.g., accelerated settlement velocity, elevated off-hours volume).

### Screen 3: Network Intelligence
- **Interactive React Flow Graph**:
  - Directed flows: `Payer Clusters (Left)` ➔ `Target Merchant (Center)` ➔ `Payout Destinations (Right)`.
  - Directed edges showing flow volume in INR and transaction count.
- **Shared Counterparty Intelligence**:
  - Dynamically detects clusters or payout hubs connected to multiple merchants across the dataset.
  - Toggle **"Expand Shared Counterparty Network"** to surface co-connected peer merchants sharing the same counterparties.
- **Side Inspector**: Click any node or edge to inspect full transaction volume, flow direction, and connected merchant lists with one-click focus switching.
- **Flow Filters**: Toggle All Flows, Inflow Only, Outflow Only, and adjust the minimum flow volume slider.

---

## ⚠️ Regulatory & Demonstration Disclaimers

1. **Synthetic Network Topology**: Counterparties and network edges are synthetically generated demo data. They do not represent observed banking beneficiaries, verified accounts, or real-world money trails.
2. **Ground-Truth Isolation**: The `is_gambling_front` label is strictly sequestered for offline evaluation and demonstration validation; it is never used as a model input or risk feature.

