# RiskSense AI — Fraud Detection & Credit Risk Intelligence
## Decision Framework & Reasoning Model

---

## Core Principle

**Risk is not binary. Fraud does not appear suddenly. Trust evolves over time and must be managed gradually.**

A single anomalous session does not make an agency a fraudster.
A single late payment does not make an agency a defaulter.
A single velocity spike does not mean an account has been taken over.

Our system reasons about risk continuously — across time, across signals, and across three levels of containment — so that every decision is proportionate, explainable, and reversible.

---

## The Three-Level Containment Model

Most fraud systems ask: *"Is this agency fraudulent?"*

We ask: *"Where exactly is the anomaly — and what is the minimum intervention required to contain it?"*

This distinction matters because an agency is not one entity. It is a collection of users, sessions, and behavioural patterns. One compromised credential should never destroy a legitimate business relationship.

```
LEVEL 1 — SESSION CONTAINMENT  (response time: minutes)
LEVEL 2 — USER CONTAINMENT     (response time: hours)
LEVEL 3 — AGENCY CREDIT ACTION (response time: days)
```

**The governing principle: Contain risk at the lowest possible level. Generalise only when containment fails.**

---

### How The Three Levels Connect

Levels do not operate independently. Each level has escalation triggers that move risk upward — and de-escalation conditions that bring it back down.

```
SESSION ANOMALY DETECTED
         ↓
Is this session suspicious relative to THIS USER's own history?
         ↓
YES → Contain at session level
      Lock session. Force re-authentication.
      Agency continues operating normally.
         ↓
Does containment resolve the risk within 2 hours?
         ↓
NO → Does the anomaly correlate with other users on same account?
         ↓
YES → Escalate to USER level
      Freeze this user's booking permissions.
      Notify agency ADMIN as a partner, not a suspect.
      Other users continue operating normally.
         ↓
Has significant credit exposure been created?
OR is the admin user compromised?
OR are multiple users showing correlated behaviour?
         ↓
YES → Escalate to AGENCY level
      Apply surgical credit controls.
      Begin formal investigation.
```

**The agency is notified as a partner before they are restricted as a suspect.**

This single principle separates RiskSense AI from every rule-based system. An agency that knows their account may be compromised will cooperate immediately. An agency that gets credit frozen without explanation will escalate to legal — damaging the relationship permanently even if the system was correct.

---

## The Four Fraud Types — Detection & Resolution

---

### 1. Account Takeover (ATO)

**What it is**
A legitimate agency account — or a specific user within it — is compromised and used to place unauthorised bookings rapidly. The agency itself is often a victim. Treating them as a fraudster is both inaccurate and unjust.

**How we detect it — early behavioural signals**

| Signal | What It Measures | Why It Matters |
|---|---|---|
| S1 Booking Velocity | Sudden increase in bookings vs this user's own historical baseline | Attackers move fast — speed is their only advantage before the breach is noticed |
| S6 Passenger Name Reuse | Repeated use of same passenger names across many bookings | Scripted or automated activity uses fabricated names — real agencies book for diverse clients |
| Login Behaviour (Synthetic) | New device, unusual location, off-hours access vs this user's normal pattern | A legitimate user logs in from their usual device at their usual time — attackers don't |

**Critical design note:** These signals are measured at the **user level**, not the agency level. A velocity spike from one user while all other users operate normally is a completely different signal from an agency-wide velocity spike. User-level baselines are the key.

**How we solve it — clean and fair process**

```
STEP 1 — SESSION CONTAINMENT (immediate, minutes)
Lock the specific suspicious session.
Force step-up authentication for that user only.
All other users on the account continue unaffected.
No credit action taken yet.

STEP 2 — USER CONTAINMENT (if session lock insufficient, hours)
Freeze this user's booking permissions.
Force password reset and device re-verification.
Notify agency admin:
"We detected unusual activity on one of your user accounts.
Please verify — your credit and other users are unaffected."
Still no agency-level credit action.

STEP 3 — AGENCY ESCALATION (only if necessary)
Triggered when:
  → Admin user is the compromised credential
  → Multiple users show correlated anomalous behaviour
  → Significant credit exposure has already been created
  → Agency admin does not respond within 4 hours
Action: Surgical credit controls applied (see Credit Model section)
```

**What does NOT trigger agency escalation:**
A single junior booking staff member's session being anomalous — if contained at session level with no credit exposure created — never reaches the agency credit record. It is an operational security event, not a financial risk event.

✅ **Result:** Fraud is stopped early without harming the agency's reputation or credit standing.

---

### 2. Chargeback Abuse

**What it is**
An agency or compromised user intentionally makes bookings with the expectation of disputing the charges later — transferring the loss to the platform. Chargeback fraud is always planned. It reveals itself through a sequence of behavioural shifts over days or weeks, not a sudden single event.

**How we detect it — the three-phase early warning model**

Chargeback fraud is not spontaneous. Agencies that intend to commit it change their behaviour gradually — each shift individually explainable, but collectively unmistakable.

```
PHASE 1 — SETUP (21-30 days before fraud completes)
Refundable ratio climbs from baseline toward 40-50%.
Booking velocity increases modestly — around 30% above normal.
Lead times begin compressing.
Credit utilization starts rising.

SYSTEM RESPONSE: Enter WATCH status.
Monitoring frequency doubles.
Analyst notified but no credit action taken.
The system has detected a possible setup — not enough
evidence to justify intervention yet.

PHASE 2 — ESCALATION (7-21 days before fraud completes)
Velocity is now 3-5x the normal rate.
Refundable ratio has climbed past 70%.
Credit is at or above 85% utilization.
First invoice payment arrives late.

SYSTEM RESPONSE: Surgical credit controls applied.
Refundable booking cap introduced.
High-value bookings require pre-approval.
Senior analyst assigned.

PHASE 3 — CRYSTALLISATION (0-7 days before fraud completes)
Booking activity stops completely.
No new invoice payments.
Contact with agency becomes difficult.
First dispute signals appear.

SYSTEM RESPONSE: Credit frozen immediately.
Maximum possible loss already bounded by Phase 2 controls.
Recovery process opened. Legal hold initiated.
```

**The signals that power this detection:**

| Signal | What It Measures | Fraud Phase |
|---|---|---|
| S2 Refundable Ratio Spike | Sudden dominance of high-value refundable bookings vs baseline | Phase 1 |
| S3 Lead Time Compression | Bookings made very close to travel date (24-48 hours) | Phase 1-2 |
| S6 Passenger Name Reuse | Indicates mass booking by fraud rings or automated tools | Phase 2 |
| S7 Destination Spike | Sudden concentration on specific routes or cities | Phase 2 |
| S1 Booking Velocity | Overall pace acceleration above historical baseline | Phase 1-2 |

**The commercial value of Phase 1 detection:**
The 21-day early warning window is everything. A platform that detects at Phase 3 loses the full value of the fraudulent bookings. A platform that detects at Phase 1 has three weeks to reduce credit exposure — before a single chargeback is filed. The maximum possible loss is bounded by the reduced credit limit, not the original one.

✅ **Result:** Fraud cannot scale. Maximum loss is capped weeks before chargebacks occur. Prevention, not recovery.

---

### 3. Inventory Blocking (Seat / Room Squatting)

**What it is**
An agency temporarily blocks inventory — booking large volumes of hotel rooms or flight seats on peak dates — to deny competitors access or manipulate availability, with no genuine intent to travel. The agency cancels near the deadline, receives a full refund, and causes no direct financial loss to themselves. The damage is to suppliers, competitor agencies, and platform reputation.

**Why this is the hardest fraud type to detect**
There is no financial signature. Invoices are paid on time. Credit utilization may be completely normal. A system focused purely on financial signals will miss this entirely. Only behavioural signals reveal it — and only when they are specifically designed to look for it.

**How we detect it — pattern-based reasoning**

| Signal | What It Measures | Why It Matters |
|---|---|---|
| S4 Cancellation Cascade | Large volumes of cancellations clustered shortly after a booking burst | Book-then-cancel in volume is the defining signature of deliberate blocking |
| S7 Destination Spike | Repeated targeting of specific high-demand routes or dates | Blocking is always targeted — random destinations indicate legitimate activity |

**The cascade pattern specifically:**
A single mass cancellation could be a legitimate group booking that fell through. But the same pattern recurring across multiple dates and destinations — with consistent timing between booking and cancellation — is deliberate. The signal looks for recurrence, not isolated events.

**How we solve it — operational containment**

```
FIRST OCCURRENCE — User-level restriction
Limit booking concurrency for this user.
Reduce booking window (how far ahead this user can book).
No agency-level action.
Supplier notified of pattern for their awareness.

SECOND OCCURRENCE (same user, within 30 days)
User's booking permissions suspended pending review.
Agency admin notified with full pattern detail.
Manual review required for bookings on high-demand routes.

THIRD OCCURRENCE OR PATTERN CONFIRMED
Agency-level intervention:
  Temporary booking caps on peak-demand routes
  Pre-approval required for bookings above certain volume
  Platform policy review opened
```

**Important distinction:** The response here is operational, not financial. Credit limits are not the right lever for inventory blocking — booking permission controls are. The agency's financial relationship with the platform remains unaffected unless the pattern escalates.

✅ **Result:** Marketplace fairness is preserved. Legitimate bookings from the same agency continue unaffected. Supplier relationships protected.

---

### 4. Credit Default Risk

**What it is**
An agency continues to consume credit while showing increasing likelihood of failing to settle invoices. Default almost never happens suddenly — it follows a trajectory of worsening payment patterns that is visible in the data weeks before any payment is missed.

**How we detect it — trend-based financial signals**

| Signal | What It Measures | Why Trend Matters More Than Value |
|---|---|---|
| S5 Credit Utilization | Rapid drawdown or sustained use near credit limits | An agency at 85% utilization for 90 stable days is different from one that reached 85% in 14 days |
| S8 Settlement Delay Trend | Consistently late or worsening invoice payment patterns | A delay growing from 2 days to 11 days over 3 months predicts default weeks before a payment is missed |

**The trajectory principle:**
An agency at Trust Score 41 and deteriorating is a completely different risk profile from an agency at Trust Score 41 that has been stable for 6 months. The absolute score matters less than the direction and velocity of change. The system reasons about both.

**How we solve it — dynamic credit contraction and expansion**

```
CONTRACTION LADDER — progressive, proportionate, never sudden

TRIGGER                           CREDIT ACTION
────────────────────────────────────────────────────────────────
S5 crosses 0.60                   Soft watch. Analyst notified.
                                  No credit change yet.

S5 crosses 0.75                   Surgical limits applied.
+ S8 begins rising                Refundable cap: 30% of outstanding.
                                  Single booking cap: ₹75,000.

S5 crosses 0.85                   Moderate contraction.
+ S8 above 0.40                   Total limit reduced to 75%.
                                  Bookings above ₹50,000 need approval.

Two invoices paid late             Hard contraction.
(with worsening trend)            Total limit reduced to 40%.
                                  All bookings enter approval queue.

Invoice missed + no contact        Freeze.
                                  Credit frozen. Legal hold initiated.
                                  Recovery process opened.
```

```
EXPANSION LADDER — trust is earned back, step by step

CONDITION                         CREDIT ACTION
────────────────────────────────────────────────────────────────
3 invoices paid early in a row    Single booking cap removed.

S8 below 0.10 for 30 days         Credit restored to 60% of limit.

Trust Score above 70 for 60 days  Credit restored to 80% of limit.

Trust Score above 80 for          Credit restored to 100%.
6 consecutive months              15% expansion eligible.

Agency self-corrected from        Credit restored to 90%.
WARNING → CLEAR over 60 days      (Not 100% — the incident stays
                                   in history but does not
                                   permanently define the agency.)
```

**No sudden shutdowns for one late payment.** One anomaly does not make a trend. The system requires a confirmed pattern before escalating — and rewards recovery with the same gradualism it uses for contraction.

✅ **Result:** Losses are minimised. Agencies experiencing temporary stress are not destroyed. Agencies that recover are rewarded automatically.

---

## How Signals Work Together

No single signal causes blocking. This is a deliberate design principle, not a limitation.

**The combination rule:**

```
WEAK EVIDENCE    One signal elevated
                 → Watch only. No action.

MODERATE SIGNAL  Two related signals elevated simultaneously
                 → Analyst notification. Surgical controls considered.

STRONG SIGNAL    Three or more signals corroborating
                 same fraud hypothesis
                 → Autonomous credit action.
                   Escalation if ambiguous.

CRITICAL         Core risk above threshold
                 + amplifier signals firing
                 → Immediate action.
                   Human review for fraud type classification.
```

**The amplifier mechanism:**
Signals S6 (Passenger Name Reuse) and S7 (Destination Spike) behave differently from the core six. They do not trigger action alone. But when core signals already indicate elevated risk, an elevated S6 or S7 sharply increases the confidence that what is being observed is coordinated fraud rather than a legitimate anomaly.

**Why this dramatically reduces false positives:**
An agency that books many refundable fares is not a fraudster if their payment history is perfect and their velocity is normal. The combination of signals tells a story that individual signals cannot tell alone.

---

## How Signals Are Weighted — The Bayesian Model

Signal weights are not fixed. This is the most important technical distinction in the system.

A fixed-weight system asks: *"How much does this signal usually matter?"*

Our system asks: *"How much has this signal historically mattered for this specific agency?"*

**How it works:**

Every new agency starts with platform-wide prior weights — the accumulated wisdom of all historical outcomes across the platform. These are the best guess before any personal evidence exists.

```
S1: 0.22  S2: 0.20  S5: 0.16  S8: 0.14
S3: 0.12  S4: 0.08  S6: 0.04  S7: 0.04
```

As outcomes are observed for each agency, weights evolve:

```
Signal fires HIGH + risk outcome confirmed  → weight increases for this agency
Signal fires HIGH + outcome was benign      → weight decreases for this agency
Signal fires LOW  + outcome was clean       → weight stability confirmed
```

**What this produces in practice:**

An agency where S2 (Refundable Ratio) has fired 6 times and all 6 were false positives — because their luxury client base legitimately books flexible fares — will have S2 weight reduced to near zero for that specific agency. The same signal reading that would concern the system for another agency is correctly discounted for them.

An agency where S8 (Settlement Delay) has been a perfect predictor of financial stress — zero false positives over 400 days — will have S8 weight elevated significantly. Any payment anomaly carries enormous weight because the system has learned to trust it.

**Two agencies can have identical signal readings today and receive different Trust Scores** because the system has learned different things about which signals to trust for each of them.

---

## Risk Decay — Trust Recovers Naturally Over Time

Risk signals should decay over time when nothing bad happens. An anomaly from 90 days ago that was not followed by any adverse outcome should not permanently define an agency's risk profile.

**Each signal has a half-life reflecting how persistent its fraud type is:**

```
S1 Booking Velocity:      7-day half-life   (fast — short-term behavioural signal)
S2 Refundable Ratio:      14-day half-life  (medium — booking pattern signal)
S3 Lead Time:             14-day half-life  (medium — booking pattern signal)
S4 Cancellation Cascade:  30-day half-life  (medium — needs pattern to confirm)
S6 Passenger Name Reuse:  30-day half-life  (medium — behavioural pattern)
S7 Destination Spike:     21-day half-life  (medium — campaign-level pattern)
S5 Credit Utilization:    60-day half-life  (slow — financial position changes slowly)
S8 Settlement Delay:      90-day half-life  (persistent — payment patterns are slow-moving)
```

**What this means in practice:**

An agency that had a velocity spike 60 days ago and has been completely clean since should not carry that risk forever. Their score naturally recovers as the signal decays — without requiring manual intervention.

An agency whose settlement delay has been worsening for 90 days carries persistent, slowly-decaying risk — because S8's long half-life reflects the reality that financial behaviour patterns are slow to change in both directions.

**This directly answers the core question: how does trust evolve over time?**

Trust does not only change when fraud is detected or resolved. It evolves continuously — decaying toward neutral when behaviour is clean, building toward certainty when patterns are sustained. The system never forgets, but it does forgive.

---

## Handling Uncertainty and Fairness

**One user ≠ bad agency.**
**One anomaly ≠ fraud.**
**One low score ≠ permanent restriction.**

Every decision in the system is governed by two separate measurements:

**Trust Score** — how trustworthy is this agency right now, based on available signals.

**Decision Confidence** — how certain is the system that the Trust Score is accurate.

These are not the same thing.

```
High trust + Low confidence  → New agency, clean so far, not enough history.
                               Action: Watch carefully. Extend credit cautiously.

Low trust + High confidence  → Clear fraud pattern, deep history, multiple
                               corroborating signals.
                               Action: Act immediately and autonomously.

Low trust + Low confidence   → Ambiguous signals. Could be fraud
                               or a legitimate anomaly.
                               Action: Escalate to analyst with one specific question.
                               Do NOT restrict autonomously.
```

**When the system is wrong — the fairness guarantee:**

```
STEP 1 — DETECTION
Analyst or agency disputes the decision.

STEP 2 — IMMEDIATE RESPONSE (within 1 hour)
Credit action paused — not removed, paused.
Agency given 24-hour response window.
Full reasoning chain provided:
every signal, every weight, every value that drove the decision.

STEP 3 — REVIEW
Counterfactual guidance provided:
"Here is exactly what would need to change for the score to improve."
Analyst reviews with complete context, not just a score.

STEP 4 — RESOLUTION
If override confirmed: credit restored within 1 hour.
The signal that caused the false positive receives a false positive mark.
Its weight decreases for this agency automatically.
The system learns from its mistake.

STEP 5 — AGENCY NOTIFICATION
Plain English explanation of what happened and why.
Clear, specific recovery path.
No permanent record of the false positive in the credit assessment.
```

**The most important property of step 4:**
The system does not just reverse the decision. It becomes less likely to make the same mistake for this specific agency in the future. Every false positive makes the model more accurate. This is not a consolation — it is the design.

---

## User-Level Signal Design

Because risk is reasoned at the user level before the agency level, individual behavioural baselines are maintained per user — not just per agency.

**Per-user signals:**

| Signal | What It Measures | Baseline Period |
|---|---|---|
| Device Fingerprint Match | Is this a device this user has used before? | Per user device history |
| Login Time Anomaly | Is this login at an unusual hour for this user? | Per user historical login times |
| Geo Velocity | Could this user physically be in two locations given the time gap between logins? | Per user location history |
| Role-Behaviour Mismatch | Is this user acting outside their typical role pattern? | Per user + role type |
| Concurrent Session Anomaly | Is the same user logged in from two locations simultaneously? | Real-time check |
| Booking Velocity per User | This user's own pace — not the agency average | Per user 90-day baseline |

**Per-user credit controls — bounding the damage radius:**

Credit exposure is managed at the user level. Different users have different permission ceilings. This means a compromised credential can only damage up to its permitted ceiling — not the full agency limit.

```
Admin user:              Full agency credit limit available
Senior booking staff:    25% of total limit per session
Junior booking staff:    ₹50,000 per booking maximum
New or unverified user:  ₹25,000 per booking maximum
Flagged session:         ₹0 — frozen until re-verified
```

A junior staff credential being compromised can expose at most ₹50,000 — not ₹8,00,000. The damage radius of any credential compromise is bounded by role. This is the most concrete form of "isolate risk before you generalise it."

---

## Summary — What Makes This System Different

| Dimension | Conventional System | RiskSense AI |
|---|---|---|
| Risk granularity | Agency level only | User → Session → Agency |
| Detection timing | After fraud occurs | 21 days before chargeback via Phase 1 setup detection |
| Signal interpretation | Individual threshold checks | Multi-signal combination with Bayesian personalised weights |
| Weight logic | Fixed platform-wide | Personalised per agency via outcome history |
| Credit action | Binary — block or allow | Surgical — three independent control levers |
| False positive handling | Agency blocked, no clear path | Automatic weight correction + specific recovery guidance |
| Trust evolution | Decided once, reviewed manually | Continuous — decays naturally, builds through sustained behaviour |
| Human involvement | Triggered by incidents | Reserved for genuine ambiguity with one specific question |
| Fairness mechanism | Policy statement | Bayesian weight update — system learns from every mistake |
| Risk decay | Permanent until manual review | Signal half-lives — trust recovers naturally when behaviour is clean |

---

## The Governing Principle

> *"We isolate risk before we generalise it. We contain it at the lowest possible level — session before user, user before agency. We act with confidence when evidence is strong and escalate honestly when it is not. And every decision — right or wrong — makes the system smarter."*
