# Qtodo Frontend

The Vue 3 + Vite front-end for Qtodo. Owns the in-memory task state, the four views, dialogs, and the detail panel. Persists nothing directly — task data lives in memory for now.

## Language

**Task**:
A single unit of work the user wants to track. Always carries a description (the user's own words for what needs to be done) and may also carry a title — a same-meaning short version of the description, written by the user as a quick glance at the Task. A Task also has a due date, an optional due time, a priority, and a lifecycle state.
_Avoid_: todo item, job, item, entry, record

**Active**:
The lifecycle stage in which a Task is visible in Today or Upcoming and can be acted on (completed, edited, deleted, reordered).
_Avoid_: open, live, current, visible (these suggest different things)

**Incomplete**:
A sub-state of Active. The Task has not yet been marked done. The default state for a new Task.
_Avoid_: pending, todo, undone, open

**Complete**:
A sub-state of Active. The Task has been marked done by the user. Stays visible in Today (if due today) and Completed view.
_Avoid_: done, finished, closed, resolved

**Archived**:
A terminal state reachable only from Complete. An Archived Task no longer appears in Today, Upcoming, or Completed — it lives only in the Archive view. Archiving is the user's deliberate "I am putting this away" gesture after a Task is Complete.
_Avoid_: deleted, hidden, removed, trashed

**Sort Preference**:
A user-set ordering for a specific Task in a specific View, set by dragging the Task within that View. When present, it overrides the View's default sort for that Task in that View. Scoped per (Task, View): the same Task can have a different Sort Preference in Today than in Upcoming, and a Sort Preference set in Today does not affect Upcoming. Only Today and Upcoming accept Sort Preferences.
_Avoid_: viewOrder, viewOrders, manual order, user order

**Due**:
The moment a Task must be done by. Has two refinements: a Due Date (the day) and an optional Due Time (the time of day). A Task must have a Due Date; a Due Time is optional and defaults to the end of the Due Date. A Task without a Due Time is treated as "due anywhere on the day" by sort and display logic.
_Avoid_: deadline, due date (as a stand-alone term — use "Due Date" only when speaking about the date refinement specifically)

**Priority**:
A user-applied label on a Task, drawn from three values: high, medium, low. The three values are nominal categories, not an ordered scale: Qtodo attaches no built-in business meaning to any of them — what counts as "high" is up to the user. Priority is currently used for display and counting only; it does not influence default sort, drag order, or view membership.
_Avoid_: importance, severity, urgency
