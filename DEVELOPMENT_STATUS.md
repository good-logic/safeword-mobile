# Safeword Development Status

This file tracks the authoritative status of implementation.

All AI implementation agents must consult this file before generating code.

This prevents duplicate work, scope creep, and architecture violations.

---

# Current Architecture

Backend: Supabase
Mobile: Expo React Native
Routing: Expo Router
Database Access: RPC-driven
Security: RLS enforced everywhere
Storage: Private buckets with signed URLs

Environment rules are defined in:

TECH_STACK_CONSTRAINTS.md

---

# Sprint Status

## Sprint 1 — Core Identity Layer
Status: COMPLETE

Implemented:

profiles table  
roles table  
user_roles table  
intents table  
user_intents table  

RLS policies applied.

RPC:

complete_profile_check()

Purpose:

Determine whether onboarding is complete before allowing browse access.

---

## Sprint 2 — Match Engine + Interaction Layer
Status: COMPLETE

Implemented:

swipes table  
taps table  

RPC:

get_browse_candidates(limit, offset)

get_my_matches(limit, offset)

Features:

Role compatibility  
Intent overlap  
Age filtering  
Activity freshness ordering  

---

## Sprint 3 — Mobile App Foundation
Status: IN PROGRESS

Implemented:

Supabase client setup  
Auth stack (login / signup)  
Session persistence  
Gate routing via complete_profile_check()

Onboarding screens:

Profile  
Roles  
Intents  
Photos  

Features:

18+ validation  
Profile upsert via RPC  
Role selection  
Intent selection  
Photo upload to Storage  
Primary photo handling  

---

# Current Focus

Finish stabilizing onboarding UX.

Pending improvements:

- Experience level dropdown instead of text input
- DOB calendar picker
- Bio character counter
- Photo deletion support

These are UX improvements and must **not change backend schema**.

---

# Upcoming Work

## Sprint 4 — Messaging System

Planned features:

Match-based chat threads

messages table

Realtime subscriptions

Chat screen UI

Message sending RPC

Security:

Users can only read messages from matches.

---

## Sprint 5 — Advanced Matching UX

Improvements:

Tap interaction

Profile detail view

Compatibility score display

Better browse sorting

---

# Implementation Rules

Before generating any code, AI agents must:

1. Read TECH_STACK_CONSTRAINTS.md
2. Check DEVELOPMENT_STATUS.md
3. Confirm they are working on the active sprint

Agents must not:

- redesign architecture
- change backend schema
- add features outside current sprint

---

# Architectural Authority

Source of truth priority:

1. Database migrations
2. RPC functions
3. TECH_STACK_CONSTRAINTS.md
4. DEVELOPMENT_STATUS.md
5. Implementation code

---

# Change Control

If architecture changes are proposed:

They must be reviewed by the Architect before implementation.

No implementation chat may modify architecture independently.