# Role-Based Weight Justification

This README explains how and why platform weights are assigned in the profile analysis system.

The objective is to keep scoring:

- aligned with real hiring behavior,
- interpretable,
- consistent across roles, and
- easy to extend later.

## Problem Statement

The system computes a final candidate score from multiple sources:

- GitHub
- LeetCode
- Codeforces
- CodeChef
- Resume

Each source should contribute differently depending on role (for example, Web, SDE, Data).  
The main question is: **How should the platform weights be assigned?**

## Core Idea

Each platform weight is based on:

```text
weight = importance * reliability
```

- `importance`: how relevant the platform is for a target role
- `reliability`: how trustworthy the platform is as a hiring signal

## Formal Weight Formula

For role `r` and platform `p`:

```text
w_p^(r) = (I_p^(r) * Q_p) / SUM_k (I_k^(r) * Q_k)
```

Where:

- `w_p^(r)`: normalized weight of platform `p` for role `r`
- `I_p^(r)`: role-specific importance
- `Q_p`: platform reliability (signal strength)
- denominator: normalization term to ensure all weights sum to 1

## How Importance (I) Is Derived

Importance is estimated from industry hiring patterns using:

1. Job descriptions (LinkedIn, Indeed, company careers pages)
2. Interview process patterns
3. Publicly visible hiring evaluation criteria

### Role-Wise Importance (Qualitative)

#### SDE (Software Development Engineer)

Typical process:

- Early rounds: DSA/problem-solving
- Later rounds: projects/system design

| Platform | Importance |
| --- | --- |
| LeetCode | Very High |
| GitHub | High |
| Codeforces | Medium |
| CodeChef | Medium |
| Resume | Medium-Low |

#### Web Developer

Typical focus:

- shipped projects
- framework depth
- deployment/product readiness

| Platform | Importance |
| --- | --- |
| GitHub | Very High |
| Resume | High |
| LeetCode | Low |
| Codeforces | Very Low |
| CodeChef | Very Low |

#### Data Scientist / ML Engineer

Typical focus:

- ML/research projects
- experimentation quality
- domain relevance

| Platform | Importance |
| --- | --- |
| GitHub | Very High |
| Resume | Very High |
| LeetCode | Low |
| Codeforces | Very Low |
| CodeChef | Very Low |

## How Reliability (Q) Is Derived

Reliability reflects how trustworthy a platform is as a measurable skill signal.

Conceptually:

```text
Q_p is proportional to (objectivity + verifiability + standardization)
```

### Evaluation Criteria

1. **Objectivity**: is evidence self-declared or externally measurable?
2. **Verifiability**: can performance be validated publicly or independently?
3. **Standardization**: are results comparable across users?

### Platform Signal Strength (Illustrative)

| Platform | Reasoning | Score |
| --- | --- | --- |
| GitHub | Real projects, public code, verifiable activity | 0.90 |
| LeetCode | Standardized problems, interview relevance | 0.85 |
| Codeforces | Strong competitive coding signal | 0.80 |
| CodeChef | Good but slightly less competitive standard | 0.75 |
| Resume | Useful but partly self-declared | 0.70 |

## Why Multiplication Is Used

We compute:

```text
weight = importance * reliability
```

This ensures a platform gets high weight only when **both** factors are strong.

- High importance + high reliability -> high weight
- High importance + low reliability -> reduced weight
- Low importance + high reliability -> still limited weight

## Why Normalization Is Required

Normalization by `SUM(I * Q)`:

- forces all weights to sum to 1,
- keeps the final score a proper weighted average, and
- makes scores consistent and interpretable.

## Final Score Formula

```text
Final Score = SUM_p (w_p^(r) * s_p)
```

- `s_p`: platform-specific score (typically 0 to 100)

## Example (SDE Role, Illustrative)

After applying `importance * reliability` and normalization, one plausible distribution is:

```text
LeetCode   ~ 0.32
GitHub     ~ 0.28
Codeforces ~ 0.16
CodeChef   ~ 0.11
Resume     ~ 0.13
```

## Important Note About Numbers

These values are calibration choices, not exact measurements.

What matters most is relative ordering and role alignment, for example:

```text
GitHub > Resume
LeetCode > CodeChef
```

Not tiny decimal precision differences.

## Why Not Equal Weights?

Equal weights assume all platforms contribute equally for all roles, which is unrealistic:

- Web roles prioritize project quality and delivery
- SDE roles emphasize DSA and coding rounds
- Data roles emphasize ML/research and applied work

Role-specific weighting better matches real hiring behavior.

## Future Improvements

Current approach is heuristic-guided.  
Possible next step: learn weights from historical outcomes using data-driven optimization.

## Final Justification

Platform weights are computed as a normalized product of role-specific importance and platform reliability.  
Importance reflects hiring relevance by role; reliability reflects signal trustworthiness.  
This prioritizes evidence that is both relevant and credible.

## Key Takeaway

```text
Weight = (How much it matters) * (How much we trust it)
```
