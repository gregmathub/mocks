# ✅ START HERE — secure deploy

## How instructor access now works (read this!)

There is **no instructor sign-up and no instructor code anymore**. Anyone who
registers on the site becomes a **student** — always. This is on purpose: a code
inside a website can always be read by users, so it can't be kept secret.

**You** decide who is an instructor, by hand, in the Firebase Console. That's the
only way to become a teacher, so no student (Blessing, Amara, anyone) can ever
get instructor access on their own.

### To make someone an instructor
Firebase Console → **Realtime Database → Data** → `users` → click their entry →
click `role` → change `"student"` to `"teacher"` → Enter.
(They sign out and back in; they'll land on the instructor Console.)

### To remove instructor access
Same place → set `role` back to `"student"`.

---

## Deploy steps (use a CLEAN repo)

1. **Fresh repo** (recommended): GitHub → New repository → name it `freestudyhub`
   → Public → Create.  *(Or open your existing repo and DELETE every old file
   first — leftover old files are what let students in before.)*

2. **Upload only this folder's files** — nothing else:
   index.html, hub.html, teacher.html, mock.html, dashboard.html,
   section1.html, section2.html, set1.html, fsh-auth.js, fsh-data.js

3. **Settings → Pages** → Deploy from branch `main`, folder `/(root)` → Save.
   Link: https://gregmathub.github.io/freestudyhub/

4. **Publish the database rules** (do this once): Firebase Console →
   Realtime Database → **Rules** → paste the contents of
   `database.rules.locked.json` → **Publish**.
   These rules now make it *impossible* for any app user to set their role to
   "teacher" — only the Console can.

5. **Existing accounts:** your real teacher account(s) keep working. To fix
   anyone who wrongly has teacher access right now, set their `role` to
   `"student"` in the Data tab (see above).

---

## Quick test after deploying
- Sign up a brand-new account → you land on the **student hub** (no teacher option).
- Type `…/teacher.html` directly while signed in as that student → it bounces you
  back to the hub.
- Promote yourself in the Console → sign out/in → you reach the instructor Console.
