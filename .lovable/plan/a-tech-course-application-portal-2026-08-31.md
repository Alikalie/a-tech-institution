# A-TECH Course Application Portal

A full portal built on Lovable Cloud (database + accounts + server logic), styled with the A-TECH navy/gold identity and using your uploaded logo as the favicon and on documents.

## Roles and flow

1. **Applicant** creates an A-TECH account → system issues a **payment reference**.
2. Admin confirms payment → system generates a **6-digit payment/verification code**.
3. Applicant enters the code → account verified → application portal unlocked.
4. Applicant submits the course application form → can **download the form as PDF** immediately (and re-download any time).
5. Admin reviews → accepts → system **generates an A-TECH Student ID** and an **acceptance letter PDF**, sent to the user's notifications.
6. Accepted applicant becomes a **Student**: profile, grades/results, notifications, class schedule.
7. **Tutors** upload grades/results and allocate them by Student ID; their actions are logged.
8. **Administrator** sees everything: payments, applications, students, tutors + tutor activity log, schedule management.

## Courses

The 11 A-TECH courses from your file (Intro to Computer & Windows through Video Editing), with durations.

## Pages

- `/` — public landing: A-TECH branding, course list, sign in / create account
- `/auth` — login + register
- `/verify` — payment reference + code entry
- `/portal/apply`, `/portal/applications` — applicant
- `/portal/student/{profile,grades,notifications,schedule}` — student
- `/portal/tutor/{students,upload,activity}` — tutor
- `/portal/admin/{overview,payments,applications,students,tutors,schedule}` — admin

## Documents

Client-side PDF generation (jsPDF) matching your prototype layout: navy header band, gold rule, A-TECH heading, footer with reference. Two documents: **Course Application Form** and **Letter of Acceptance**. A Word (.doc) download option is also offered for the application form.

## Technical notes

- Lovable Cloud tables: `profiles`, `user_roles` (separate table, admin/tutor/student/applicant), `payments`, `applications`, `students`, `grades`, `schedule`, `notifications`, `activity_log`. RLS on every table so users only see their own data and only admins/tutors see the wider views.
- Verification codes and Student IDs are generated server-side, never in the browser.
- Sign-in uses email + password (Cloud auth requires an email address); phone number is stored on the profile.
- Uploaded logo becomes the favicon and the portal brand mark.
- The first account you create can be promoted to administrator; I will tell you how after the build.
