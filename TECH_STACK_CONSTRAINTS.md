TECH_STACK_CONSTRAINTS.md
Safeword Mobile — Technical Environment Contract

This document defines the runtime environment and coding constraints for the Safeword mobile application.

All implementation work (AI or human) must follow this document before generating code.

Failure to comply will result in runtime errors or architecture violations.

1. Runtime Environment
Platform Targets

iOS

Android

Web support is not required.

Node Environment

Node Version

v22.13.1

Node APIs must not be used inside React Native runtime code.

Forbidden examples:

Buffer
crypto.randomUUID()
fs
path
process.cwd()

Node usage is only allowed in build scripts.

2. Expo Environment

Expo SDK

54.x

CLI Version

54.0.23
Expo Rules

Allowed:

Expo managed workflow

Expo APIs

Expo Storage

Expo Router

Forbidden:

Bare workflow assumptions

Native modules unless explicitly approved

Node polyfills

3. React Native Environment

React Native

0.81.5

React

19.1.0
4. Navigation System

Routing System

Expo Router

File-based routing under:

/app

Example structure:

app/
 ├ auth/
 ├ onboarding/
 ├ tabs/
 ├ chat/
 └ gate.tsx

Manual navigation stacks must not be created manually.

5. Supabase Environment

Client

@supabase/supabase-js v2.97.0

Initialization

src/lib/supabase.ts

Authentication persistence

AsyncStorage

Configuration:

autoRefreshToken: true
persistSession: true
detectSessionInUrl: false
6. Database Architecture Rules

The Safeword backend follows strict architecture rules.

Access Model

All application data must be accessed through:

RPC functions

Direct table access is not allowed except for simple inserts explicitly defined.

RLS

Row Level Security is always enabled.

Client code must never attempt to bypass RLS.

Identity

User identity is always:

auth.user().id

Profiles table primary key:

profiles.user_id

There is no profiles.id column.

7. Storage Rules

Profile photos are stored in:

profile-photos

Storage path format:

profiles/{user_id}/{generatedId}.jpg

Rules:

Bucket is private

Images must be accessed through signed URLs

Direct public URLs are forbidden

8. Image Upload Rules (Expo Safe)

Image picking must use:

expo-image-picker

Correct modern usage:

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'],
  allowsEditing: true,
  quality: 0.8,
});

Deprecated API must not be used:

ImagePicker.MediaTypeOptions
9. Forbidden Libraries / APIs

These APIs break Expo environments and must not be used.

Forbidden:

Buffer
crypto.randomUUID()
FileSystem.readAsStringAsync for uploads
Node crypto
Node fs
Node path
10. File Upload Strategy

Uploads must use Blob-based uploads compatible with Expo.

Allowed pattern:

fetch(imageUri)
→ blob
→ supabase.storage.upload()
11. UUID Generation

Client-generated UUIDs must not be used.

Instead use:

timestamp + random suffix

or backend-generated identifiers.

12. Dependency Compatibility Rules

Expo Doctor results must pass.

Current mismatches:

react-native-get-random-values expected ~1.11.0 found 2.0.0
@react-native-community/datetimepicker expected 8.4.4 found 8.6.0

When installing packages always use:

npx expo install <package>

Never use:

npm install <package>

for Expo dependencies.

13. Mobile UX Constraints
Onboarding Inputs

Experience Level must be a dropdown.

Enum values:

curious
new
intermediate
experienced
lifestyle

Free text input is forbidden.

Date of Birth

Must use:

@react-native-community/datetimepicker

Manual typing is forbidden.

Bio

Character limit:

300 characters

Must display counter:

0 / 300
14. Photo Rules

Users may upload:

Maximum 4 photos

Rules:

First photo becomes primary

Primary cannot be null

Users may delete photos

If primary is deleted, next photo becomes primary

15. Chat System Constraints

Chat messages are loaded via:

Supabase realtime + RLS

Messages must always include:

match_id
sender_id
content
created_at
16. Code Generation Rules for AI Implementation

Before generating any code, implementation agents must:

Read TECH_STACK_CONSTRAINTS.md

Verify compatibility with Expo SDK

Avoid deprecated Expo APIs

Match database schema exactly

Avoid guessing column names

Avoid Node APIs in runtime code

17. Architecture Authority

Source of truth priority order:

1️⃣ Database migrations
2️⃣ RPC functions
3️⃣ TECH_STACK_CONSTRAINTS.md
4️⃣ Mobile implementation code

Final Rule

If any uncertainty exists about API compatibility:

Stop and verify against this document before coding.