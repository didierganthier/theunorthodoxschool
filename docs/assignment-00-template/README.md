# Assignment 00 — GitHub onboarding

Welcome to your first assignment at The Unorthodox School. This is a gentle
introduction to the workflow you will use for every technical assignment:
make a small change, commit it, and let automated checks verify your work.

## What to do

1. Open `student/profile.json`.
2. Replace each placeholder value with your own details:
   - `name` — your full name
   - `github_username` — your GitHub username
   - `favorite_language` — a programming language you like (or want to learn)
   - `why_join` — a sentence about why you joined
3. Commit and push your change.

That's it. When you push, GitHub runs an automatic check. The Unorthodox School
then independently verifies the same submission. When both checks pass, your
Level 0 assignment is completed automatically.

## Important

- **Only edit `student/profile.json`.** The grading files are protected:
  - `.github/workflows/grade.yml`
  - `scripts/grade.mjs`
  - `.uos/protected.json`
  
  If you change any of these protected files, the school's verification will
  reject the submission even if the visible GitHub Action succeeds. Leave them
  exactly as they are.

- Your repository is **private** and was created just for you.

## Example

```json
{
  "name": "Ada Lovelace",
  "github_username": "adalovelace",
  "favorite_language": "Python",
  "why_join": "I want to build things and think in a more unorthodox way."
}
```
