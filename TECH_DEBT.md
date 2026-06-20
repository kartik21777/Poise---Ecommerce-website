# Technical Debt & Architecture Notes

## 1. Inventory Atomicity (Phase 6 Checkout Foundation)

**Current Risk:**
Currently, adding to cart or updating quantity performs inventory validation by fetching the product, checking `variant.stock`, and then succeeding. This is susceptible to race conditions. If multiple concurrent requests validate the stock simultaneously, they could all pass, leading to overselling when orders are finally placed.

**Future Solution:**
During Phase 6 (Checkout), order placement must use MongoDB Transactions (if using a replica set) or atomic atomic updates (e.g., `findOneAndUpdate` with conditions like `variants.sku: "ABC", "variants.stock": { $gte: requestedQuantity }` and an `$inc` to decrement stock). This ensures that stock levels are safely reduced without race conditions.

## 2. Recently Viewed Atomic Updates

**Current Implementation:**
The `recentlyViewedService` currently functions using a read-modify-save pattern:
1. `findOne` the recently viewed document.
2. Filter the array manually in Node.js to remove existing entries (so they bump to front).
3. `unshift` to the front of the array.
4. `slice` locally to enforce a limit (e.g., 20).
5. `save()` the document.

**Migration Plan:**
This should be refactored to use MongoDB atomic updates in a single `findOneAndUpdate` command.
The new approach should:
1. `$pull` the product ID from the items array.
2. `$push` the item to the front using the `$each`, `$position: 0`, and `$slice: 20` modifiers. Note: since MongoDB doesn't allow `$pull` and `$push` on the same field in the same update document, the operation might need to be split into two operations (a `$pull` followed by a `$push` with `$slice` and `$position`), but executed efficiently without fetching the whole document to Node.js memory.

**Do NOT implement this yet. Kept for future performance optimization.**
