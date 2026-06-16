# Views are routing, not domain

The four sidebar views (Today, Upcoming, Completed, Archive) are not listed as terms in `CONTEXT.md`. They are UI routing destinations backed by the four view filters in `utils/taskViews.ts` — not independent domain objects. The conceptual substance of each view is already captured by the lifecycle terms in `CONTEXT.md`: "Tasks visible today" is just `Task.dueDate === today`, "Archived Tasks" is the Archived lifecycle term, and so on. Listing the views as glossary terms would double-encode information that the lifecycle already carries.
