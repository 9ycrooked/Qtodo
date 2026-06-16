# Today is the local calendar day

The "Today" view shows Tasks whose Due Date equals the user's current local calendar day. The day boundary is the user's local midnight, not UTC midnight.

`getTodayDateValue()` in `utils/formatDueText.ts` is the single source of truth and must derive the date string from the user's local clock (year/month/day getters), not from `new Date().toISOString().slice(0, 10)`. The latter silently uses UTC and causes a real UX bug: a user opening Qtodo between local midnight and UTC midnight sees "yesterday" as Today, so their just-due tasks do not appear in the Today view and previous-day tasks do.

Cross-timezone behavior is a known unresolved scope: Qtodo assumes a single user on a single timezone for now. A user flying from Beijing to New York will see their Today view shift by 13 hours with no warning. This is acceptable for the current single-user, single-device product but should be revisited if multi-device or shared use cases are added.
