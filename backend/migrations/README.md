# Migration

Run `npm run migrate` in backend before starting this version. Repeat runs are safe.
Adds missing EndDate, LockedUntil, OriginalPrice, DiscountPercent and durable Tour_Rating_Jobs.
Existing tours are queued to rebuild ratings; no bookings or tour dates are changed.
Legacy missing end dates must be corrected in admin before publishing.

Rating jobs commit with review changes. The worker runs every 10 seconds, updates
cached totals from published reviews and deletes jobs in the same transaction.
Failures roll back and remain queued for retry. Tour reads use cached ratings,
so ratings can briefly lag after a review change.
