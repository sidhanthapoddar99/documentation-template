# Benchmarks

Quick perf baseline on the current DOM-based renderer, measured on a 2024 M-series MacBook.

| Document size | Decoration rebuild | Scroll FPS |
|---|---|---|
| 1k lines | 6 ms | 60 |
| 5k lines | 42 ms | 58 |
| 10k lines | 118 ms | 42 |
| 20k lines | 310 ms | 24 |

The cliff at ~10k is where a canvas approach *might* start to pay for itself.
