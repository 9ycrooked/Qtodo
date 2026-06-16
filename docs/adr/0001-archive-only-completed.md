# Archive only from Complete

A Task can only be Archived from the Complete sub-state. Incomplete Tasks cannot be archived. The driver is user mental flow: marking Complete and archiving are two gestures in sequence ("I'm done with this" → "put it away"), and the UI should not let a user accidentally bury unfinished work in the Archive view.

Considered alternatives:

- **Allow archiving any Active Task** — would let a user clean up a noisy Upcoming view but creates a real risk of burying unfinished work where it stops being seen. Goes against the mental-flow rationale.
- **Auto-archive on Complete after N days** — would remove the gesture entirely. Fails the "deliberate" half of the rationale; users lose the sense of closing a chapter.

The "findability" cost of an accidentally archived Incomplete Task and the "semantic muddiness" of mixing Complete and Incomplete in the Archive view are both downstream consequences of skipping the Complete step, but the primary motivation is the user mental flow.
