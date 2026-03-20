# 🧊 ChillInsure

### *AI-Powered Income Protection for Gig Workers*

---

## 📌 Problem Statement

Gig workers (Zomato/Swiggy delivery partners) face **unpredictable income loss** due to:

* 🌧 Heavy rain, floods
* 🌫 High AQI / pollution
* 🚫 Curfews and restrictions

Despite this, they lack:

* ❌ Income protection
* ❌ Simple insurance systems
* ❌ Real-time compensation

---
<img width="1920" height="1080" alt="devtrails" src="https://github.com/user-attachments/assets/4917c2f4-55ee-43ce-8c48-2944d73cbbee" />


## 🎯 Our Solution

**ChillInsure** is an **AI-powered parametric insurance platform** that:

* Detects real-world disruptions
* Predicts income loss
* Automatically triggers payouts
* Uses a **multi-agent AI system** to ensure fairness and prevent fraud

---

# 📌 Requirements (Food Delivery Persona – Zomato/Swiggy)

## 🧑‍🍳 User Requirements

* Income loss compensation based on **actual earnings drop**
* Zero-touch claims (no manual filing)
* Low-cost weekly subscription (₹20–₹70)
* Simple, minimal UI
* Real-time alerts for risks & payouts
* Works in low connectivity environments

---

## 🌍 Disruption Requirements

* Detect heavy rain, floods, extreme heat
* Monitor AQI (pollution levels)
* Handle curfews / restricted zones
* (Optional) detect traffic spikes, platform outages
* Hyperlocal disruption detection

---

## ⚙️ Functional Requirements

* User registration & profile setup
* AI-based risk profiling (location + behavior)
* Weekly policy creation & renewal
* Real-time monitoring (weather, AQI, alerts)
* Parametric trigger engine
* Dynamic premium calculation
* Automated claim triggering
* Instant payout processing
* Fraud detection system (ML + rules)
* Worker & Admin dashboards

---

## ⚡ Non-Functional Requirements

* Real-time performance
* Secure data handling
* Scalable system design
* High reliability (low false payouts)
* Explainable AI models
* Mobile-first experience

---

# 🔐 Fraud & Adversarial Requirements

## ❗ Core Principle

**Do not trust GPS alone — validate real-world activity.**

---

## Multi-Factor Validation

* 📍 GPS trajectory validation (movement consistency)
* 🧑‍💼 Activity logs (orders, sessions)
* ⏱ Behavioral patterns (timing consistency)
* 📶 Network/IP signals
* 🔗 Fraud ring detection (group patterns)

---

## Detection Capabilities

* Detect GPS spoofing (teleportation patterns)
* Detect fake inactivity (user idle but claiming)
* Detect coordinated fraud attacks
* Detect abnormal claim timing

---

## Graceful Handling

* No instant rejection
* Partial payout for uncertain cases
* Trust-score based prioritization

---

# ⚙️ Application Workflow (Concise)

## 🔁 One-Line Flow

```
Onboard → Risk Score → Weekly Policy → Monitor → Trigger → AI Council Decision → Payout
```

---

## 1️⃣ Onboarding

* User registers
* Selects platform (Zomato/Swiggy)
* Enables location

---

## 2️⃣ Risk Profiling

* Analyze:

  * Location risk (AQI, floods)
  * Work patterns

👉 Model: **XGBoost**

---

## 3️⃣ Weekly Policy Creation

* Dynamic premium calculated
* User subscribes

---

## 4️⃣ Real-Time Monitoring

Tracks:

* Weather
* AQI
* Alerts
* Activity

---

## 5️⃣ Parametric Trigger Detection

Triggers when:

* Rainfall > threshold
* AQI > threshold
* Curfew detected

---

## 6️⃣ AI Council + Fraud Detection

### 🧠 Multi-Agent System

| Agent            | Role                  |
| ---------------- | --------------------- |
| 📍 Zone Agent    | Validates location    |
| 🧑‍💼 Work Agent | Checks activity       |
| ⏱ Behavior Agent | Detects anomalies     |
| 🌍 Reality Agent | Checks feasibility    |
| 🛡 Trust Agent   | Evaluates credibility |

---

### 🎭 Decision Mechanism

Each agent outputs:

* Vote → PAY / PARTIAL / REJECT
* Confidence score

👉 Final decision = **weighted consensus**

---

### 🤖 Models Used

* Isolation Forest → anomaly detection
* DBSCAN → fraud ring detection

---

## 7️⃣ Auto Claim Processing

* Claim generated automatically
* No user input required

---

## 8️⃣ Instant Payout

* Based on income loss
* Paid via UPI (simulated)

---

## 9️⃣ Dashboard

### Worker:

* Coverage
* Payouts
* Alerts

### Admin:

* Fraud insights
* Risk analytics

---

# 📉 Smart Income Loss Logic

```
Payout = Expected Earnings - Actual Earnings
```

### Example:

Expected = ₹1000
Actual = ₹400
👉 Payout = ₹600

---

### Decision Logic

| Scenario                         | Outcome        |
| -------------------------------- | -------------- |
| Full activity                    | No payout      |
| Partial activity                 | Partial payout |
| No activity + genuine disruption | Full payout    |
| No activity + suspicious         | Flag           |
| Outside zone                     | Reject         |

---

# 🧾 Eligibility Criteria

## Must:

* Active policy
* Inside disruption zone
* Valid activity or disruption

---

## No payout if:

* No policy
* Outside zone
* No disruption
* Fraud detected

---

# 🚨 Adversarial Defense & Anti-Spoofing Strategy

## 1️⃣ Differentiation

We differentiate real vs fake users using:

* Movement patterns (not just GPS)
* Activity signals (orders, sessions)
* Behavioral consistency
* Group-level anomaly detection

👉 **Real users show imperfect behavior. Fraudsters show perfect patterns.**

---

## 2️⃣ Data Used Beyond GPS

* Activity logs (orders, sessions)
* Claim timing patterns
* Location clustering (DBSCAN)
* IP/device patterns
* Zone density analysis

---

## 3️⃣ UX Balance (VERY IMPORTANT)

We ensure fairness:

| Case                    | Action         |
| ----------------------- | -------------- |
| High confidence genuine | Instant payout |
| Medium confidence       | Partial payout |
| Low confidence          | Delayed review |

---

### Soft Handling:

* No harsh rejection
* Claims marked “Under Review”
* Partial payout released immediately

---

## 🏆 Key Innovation

> Instead of rigid rules, ChillInsure uses an **AI Council** where multiple agents evaluate fairness before payout.

---

# 🧠 Tech Stack

* Frontend: React.js
* Backend: Node.js / FastAPI
* ML: Python (Scikit-learn, XGBoost)
* Databases: PostgreSQL (Core Data), InfluxDB (Time-Series), Redis (Caching).
* APIs: Weather APIs, AQI APIs, Maps APIs
* Payments: Razorpay (simulated)

---

# 🚀 Future Scope

* Integration with real delivery platforms
* Real-time UPI payments
* Improved ML models with real data
* Expansion to other gig sectors

---
