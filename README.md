# FreeStudy Hub — GRE/GMAT Mock Platform

A complete practice-test platform you control: build mocks, send them to your
students, and see who's actually putting in the work.

**Live site:** once deployed, share ONE link with everyone →
`https://gregmathub.github.io/freestudy-hub/`
Instructors and students both start there — they just pick their role at sign-in.

---

## 👩‍🏫 For the instructor — your first 5 minutes

1. **Open the link → Instructor tab → Create account** (access code: `GREEDU2026`).
   You land on your **Console**.
2. **Create a class** (Classes → ＋ New class). You get a 6-letter **join code**
   like `K7P2QM` — this is what you give students.
3. **Build a mock** (Mocks → ＋ New mock). Add questions, set a timer, hit Save.
4. **Assign it** (the Assign button on the mock) → whole class or pick students.
5. **Share resources** (Resources → ＋ Add resource) — paste a YouTube/PDF link.
   You'll see exactly who opens them.
6. **Watch Follow-up** — students who are slipping or ignoring resources show up
   here automatically, with a one-click email.

## 🎓 For students — how they join

1. Open the same link → **Student tab → Create account**.
2. Enter the **class join code** you gave them.
3. Their assigned mocks and study resources appear on their hub instantly.

---

## What you can do

| Feature | Where |
|---------|-------|
| Build mocks (MC, multi-answer, numeric, quant-comparison) | Console → Mocks |
| Assign to a class or specific students | Console → Mocks → Assign |
| Organize students into classes with join codes | Console → Classes |
| Share videos/PDFs/articles + see who opened them | Console → Resources |
| Auto-flag at-risk / disengaged students | Console → Follow-up |
| Deep score analytics & topic mastery | Console → Analytics |

Students get: assigned mocks, a free practice library, and tracked resources —
all on one clean hub.

---

## Deploying / sharing the link

See **DEPLOY.md** for the full step-by-step (create repo → turn on GitHub Pages →
authorize the domain in Firebase → publish security rules).

Quick version:
1. Create a GitHub repo named `freestudy-hub`, upload everything in this folder.
2. Settings → Pages → deploy from `main` / root.
3. Firebase Console → Authentication → Authorized domains → add `gregmathub.github.io`.
4. Share `https://gregmathub.github.io/freestudy-hub/`.

> The instructor access code (`GREEDU2026`) lives in `fsh-auth.js` — change it
> before uploading if you'd like a different one.
