````markdown
# Role-Based Weight Justification

This document explains **how and why platform weights are assigned** in the profile analysis system.

The goal is to ensure that scoring reflects **real-world hiring practices** while remaining **interpretable, consistent, and extensible**.


# 1. Problem Statement

We compute a **final score** for a candidate based on multiple platforms:

- GitHub
- LeetCode
- Codeforces
- CodeChef
- Resume

Each platform contributes differently depending on the **job role** (Web, SDE, Data).

The challenge:
> How do we assign **correct weights** to each platform?


# 2. Core Idea

Each platform weight is based on two factors:

```text
weight = importance × reliability
````

Where:

* **Importance** → How relevant the platform is for the role
* **Reliability** → How trustworthy the platform is as a signal

---

# 3. Formal Formula

We define weights using:

[
w_p^{(r)} = \frac{I_p^{(r)} \cdot Q_p}{\sum_{k} I_k^{(r)} \cdot Q_k}
]

### Meaning:

* ( w_p^{(r)} ) → weight of platform **p** for role **r**
* ( I_p^{(r)} ) → importance of platform for that role
* ( Q_p ) → signal strength (reliability)
* Denominator → normalization (ensures all weights sum to 1)

---

# 4. How We Derive **Importance (I)**

Importance is derived from **industry hiring patterns** using:

### Method:

1. Analyze job descriptions (LinkedIn, Indeed, etc.)
2. Study interview processes
3. Observe evaluation criteria used by companies

---

## 4.1 Role-wise Importance

### SDE (Software Development Engineer)

Typical hiring process:

* Round 1 → DSA (LeetCode style)
* Later → Projects/System Design

Importance:

| Platform   | Importance |
| ---------- | ---------- |
| LeetCode   | Very High  |
| GitHub     | High       |
| Codeforces | Medium     |
| CodeChef   | Medium     |
| Resume     | Medium-Low |

---

### Web Developer

Typical hiring focus:

* UI projects
* Frameworks (React, Angular)
* Deployment experience

Importance:

| Platform   | Importance |
| ---------- | ---------- |
| GitHub     | Very High  |
| Resume     | High       |
| LeetCode   | Low        |
| Codeforces | Very Low   |
| CodeChef   | Very Low   |

---

### Data Scientist / ML Engineer

Typical hiring focus:

* ML projects
* Research work
* Domain knowledge

Importance:

| Platform   | Importance |
| ---------- | ---------- |
| GitHub     | Very High  |
| Resume     | Very High  |
| LeetCode   | Low        |
| Codeforces | Very Low   |
| CodeChef   | Very Low   |

---

# 5. How We Derive **Signal Strength (Q)**

Signal strength measures how **trustworthy and meaningful** a platform is.

We evaluate based on:

[
Q_p \propto \text{Objectivity} + \text{Verifiability} + \text{Standardization}
]

---

## 5.1 Evaluation Criteria

### (1) Objectivity

* Is the data real or self-declared?

### (2) Verifiability

* Can we verify the skill externally?

### (3) Standardization

* Is performance comparable across users?

---

## 5.2 Platform Signal Strength

| Platform   | Reasoning                                            | Score |
| ---------- | ---------------------------------------------------- | ----- |
| GitHub     | Real projects, public code, verifiable contributions | 0.90  |
| LeetCode   | Standardized problems, widely used in interviews     | 0.85  |
| Codeforces | Strong competitive programming signal                | 0.80  |
| CodeChef   | Good but slightly less competitive standard          | 0.75  |
| Resume     | Self-declared, less verifiable                       | 0.70  |

---

# 6. Why Multiplication Works

We use:

```text
weight = importance × reliability
```

### Reason:

A platform should get high weight **only if BOTH are high**:

| Case                               | Result         |
| ---------------------------------- | -------------- |
| High importance + High reliability | High weight    |
| High importance + Low reliability  | Reduced weight |
| Low importance + High reliability  | Still low      |

This avoids over-trusting weak signals.

---

# 7. Why Normalization is Needed

We divide by total:

[
\sum I \cdot Q
]

### Reason:

* Ensures all weights sum to **1**
* Makes final score a **true weighted average**
* Keeps scores interpretable and consistent

---

# 8. Final Score Formula

[
\text{Final Score} = \sum w_p^{(r)} \cdot s_p
]

Where:

* ( s_p ) = platform score (0–100)

---

# 9. Example (SDE Role)

Using intuition:

| Platform   | Importance | Quality | Product |
| ---------- | ---------- | ------- | ------- |
| LeetCode   | High       | High    | High    |
| GitHub     | High       | High    | High    |
| Codeforces | Medium     | High    | Medium  |
| CodeChef   | Medium     | Medium  | Medium  |
| Resume     | Lower      | Medium  | Lower   |

After normalization:

```text
LeetCode   ≈ 0.32
GitHub     ≈ 0.28
Codeforces ≈ 0.16
CodeChef   ≈ 0.11
Resume     ≈ 0.13
```

---

# 10. Important Note About Numbers

These values:

* Are **not exact measurements**
* Are **relative calibrations**

## What matters:

```text
GitHub > Resume
LeetCode > CodeChef
```

NOT:

```text
0.85 vs 0.87 precision
```

---

# 11. Why Not Equal Weights?

Equal weights assume:

```text
All platforms are equally important
```

This is incorrect because:

* Web roles prioritize projects
* SDE roles prioritize DSA
* Data roles prioritize ML work

Role-specific weighting reflects **real hiring behavior**

---

# 12. Future Improvement

Current system = **heuristic-based**

Future system:

* Learn weights from data using ML
* Use historical hiring outcomes
* Automatically adjust importance

---

# 13. Final Justification Statement

> We compute platform weights as a normalized product of role-specific importance and platform reliability. Importance is derived from industry hiring patterns, while reliability is based on objectivity, verifiability, and standardization. This ensures that only signals that are both relevant and trustworthy significantly influence the final score.

---

# 14. Key Takeaway

```text
Weight = (How much it matters) × (How much we trust it)
```

