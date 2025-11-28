/**
 * Money.
 *
 * The console performs **no** money arithmetic of its own. There is one implementation, in
 * `@payzeno/contracts`, shared by the API and (via the Python codegen) the ledger. This module
 * re-exports it and adds presentation-only helpers on top.
 *
 * If you are about to write `amount / 100` in this repo: `CURRENCY_EXPONENT.JPY` is 0. See
