# ChillInsure  

### AI-Powered Income Protection for Gig Workers  

---

## Problem Statement  

Gig workers (Zomato/Swiggy delivery partners) face unpredictable income loss due to:  

* Heavy rain, floods  
* High AQI / pollution  
* Curfews and restrictions  

Despite this, they lack:  

* Income protection  
* Simple insurance systems  
* Real-time compensation  

---
<img width="1920" height="1080" alt="devtrails" src="https://github.com/user-attachments/assets/4917c2f4-55ee-43ce-8c48-2944d73cbbee" />


## Our Solution  

ChillInsure is an AI-powered parametric insurance platform that:  

* Detects real-world disruptions  
* Predicts income loss  
* Automatically triggers payouts  
* Uses a Multi-Agent AI Council to ensure fairness and prevent fraud  

---

# Requirements (Food Delivery Persona – Zomato/Swiggy)  

## User Requirements  

* Income loss compensation based on actual earnings drop  
* Zero-touch claims (no manual filing)  
* Low-cost weekly subscription (₹20–₹70)  
* Simple, minimal UI  
* Real-time alerts for risks and payouts  
* Works in low connectivity environments  

---

## Disruption Requirements  

* Detect heavy rain, floods, extreme heat  
* Monitor AQI (pollution levels)  
* Handle curfews / restricted zones  
* Optional: detect traffic spikes, platform outages  
* Hyperlocal disruption detection  

---

## Functional Requirements  

* User registration and profile setup  
* AI-based risk profiling (location and behavior)  
* Weekly policy creation and renewal  
* Real-time monitoring (weather, AQI, alerts)  
* Parametric trigger engine  
* Dynamic premium calculation  
* Automated claim triggering  
* Instant payout processing  
* Fraud detection system (ML and rules)  
* Worker and Admin dashboards  

---

## Non-Functional Requirements  

* Real-time performance  
* Secure data handling  
* Scalable system design  
* High reliability (low false payouts)  
* Explainable AI models  
* Mobile-first experience  

---

# Fraud and Adversarial Requirements  

## Core Principle  

Do not trust GPS alone — validate real-world activity.  

---

## Multi-Factor Validation  

* GPS trajectory validation (movement consistency)  
* Activity logs (orders, sessions)  
* Behavioral patterns (timing consistency)  
* Network/IP signals  
* Fraud ring detection (group patterns)  

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

# Application Workflow (Concise)  

## One-Line Flow  
Onboard → Risk Score → Weekly Policy → Monitor → Trigger → AI Council Decision → Payout


---

# Core Implementation  

## 1. Risk Scoring  

We model user risk as a function of environmental and behavioral variables:

\[
R = f(\text{weather}, \text{AQI}, \text{traffic}, \text{work patterns})
\]

- Model: XGBoost  
- Output: Zone-level disruption probability  

---

## 2. Dynamic Pricing  

Premium is dynamically computed as:

\[
P = \alpha R + \beta C - \gamma G
\]

Where:
- \(R\): Risk score  
- \(C\): Coverage  
- \(G\): GigScore (user reliability)

This creates a **feedback loop** where better behavior reduces cost.

---

## 3. Parametric Trigger Engine  

\[
T =
\begin{cases}
1 & \text{if disruption metric} > \text{threshold} \\
0 & \text{otherwise}
\end{cases}
\]

Triggers are derived from:
- Rainfall intensity  
- AQI levels  
- Platform or civic disruptions  

---

## 4. Loss Estimation  

\[
L = E_{\text{expected}} - E_{\text{actual}}
\]

Where:
- \(E_{\text{expected}}\): predicted baseline earnings  
- \(E_{\text{actual}}\): observed earnings during disruption  

---

# Multi-Agent AI Council  

## Motivation  

Single-model systems are:
- Biased  
- Fragile to adversarial inputs  
- Hard to interpret  

We replace this with a **distributed decision system**.

---

## Agent Architecture  

Each agent independently evaluates a claim:

| Agent          | Function |
|----------------|--------|
| Zone Agent     | Validates location consistency |
| Work Agent     | Verifies delivery activity |
| Behavior Agent | Detects anomalies |
| Reality Agent  | Checks environmental validity |
| Trust Agent    | Uses historical reliability |
| Store Agent    | Validates platform disruption |
| Fraud Agent    | Detects spoofing patterns |

---

## Decision Function  

Each agent produces:

\[
d_i \in \{\text{approve}, \text{partial}, \text{reject}\}, \quad c_i \in [0,1]
\]

Final decision:

\[
D = \arg\max \sum_{i=1}^{n} w_i \cdot c_i \cdot d_i
\]

---

## Key Advantages  

- Multi-perspective validation  
- Reduced false positives and false negatives  
- Robust fraud detection  
- Parallel evaluation → low latency  
- Interpretable decision pipeline  

---

# Trust and Fraud Layer  

We incorporate multi-signal validation beyond GPS:

- Movement trajectory consistency  
- Activity logs (orders, sessions)  
- Peer comparison within zone  
- Claim frequency patterns  
- Device and network signals  

### Trust Score  

\[
T_u \in [0,1]
\]

Used to dynamically adjust:
- Payout speed  
- Approval strictness  

---

# Decision Policy  

| Condition | Outcome |
|----------|--------|
| High confidence genuine | Full payout |
| Medium confidence | Partial payout |
| Low confidence | Review |
| Fraud detected | Reject |

---

# Automation Pipeline  

- Automatic claim generation  
- Zero user input  
- Instant payout processing  

---

# Why ChillInsure is Different  

| Traditional Insurance | ChillInsure |
|----------------------|------------|
| Claim-based | Trigger-based |
| Manual verification | AI-driven consensus |
| Static pricing | Dynamic pricing |
| Slow payouts | Instant payouts |
| Generic coverage | Hyperlocal risk |

---

# Tech Stack  

- Backend: FastAPI / Node.js  
- Frontend: React + TypeScript  
- ML: XGBoost, Isolation Forest, DBSCAN  
- Database: PostgreSQL, Redis  
- APIs: Weather, AQI, Maps  
- Payments: UPI (simulated)  

---

# Future Scope  

- Predictive disruption alerts  
- Reinforcement-based agent weighting  
- Integration with gig platforms  
- Multi-city scaling  

---

# Conclusion  

ChillInsure transforms insurance into a **real-time decision system**.

By combining:
- Parametric triggers  
- Dynamic pricing  
- Multi-agent AI consensus  

it ensures that income protection is:
- Instant  
- Fair  
- Scalable  
