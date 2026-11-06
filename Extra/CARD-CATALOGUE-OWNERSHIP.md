# Card Catalogue Ownership and Compatibility Contract

## Canonical source

`JS/features/cards/catalogue-data.js` is the canonical built-in card data module. It publishes the original 43 built-in records to `window.cardCatalog` during ES-module dependency evaluation. The data records, IDs, fields, values, image paths, prices, expiry metadata, and Season reward metadata are preserved.

`JS/features/cards/catalogue.js` imports the data module and exposes the read facade (`getAll`, `getById`, `getBySeason`, `getSeasonRewards`, `getMarketplaceCards`, and `validate`). The facade resolves `window.cardCatalog` on every call; it does not retain a stale array reference.

## Runtime compatibility

- `window.cardCatalog` remains the shared mutable array used by existing classic-script functions and modular features.
- Custom-card loading may remove and append custom records.
- Backup restore may replace the array and restore the previous array on rollback.
- Reset may replace the array after filtering custom cards.
- Season reward lookup resolves the current catalogue through the facade, retaining the existing direct fallback.
- The catalogue is not frozen; records and array remain mutable for compatibility.

## Startup ordering

The old synchronous `JS/cards.js` classic script and the empty fallback in `JS/app-part1.js` have been removed. `JS/core/bootstrap.js` imports `features/cards/catalogue.js`, which imports `catalogue-data.js`; ES-module dependency evaluation therefore publishes `window.cardCatalog` before the bootstrap body registers feature APIs. The classic `app-part*.js` files only reference the global inside runtime functions, after module evaluation and page parsing. Architecture tests guard this dependency and the absence of the old fallback/script.

## Persistence and data guarantees

- No card IDs or card record fields were renamed or normalized.
- No LocalStorage or IndexedDB key, schema, or record format changed.
- No purchase, ownership, reward, custom-card, backup, restore, or reset business logic changed.
- `JS/app.js` remains inactive and untouched.

## Validation

The catalogue module regression test locks the serialized built-in catalogue checksum and record count, verifies initial global publication, and verifies that facade reads follow global reassignment. The broader architecture and application test suites cover module resolution and service-worker app-shell inclusion.

## Remaining manual browser verification

1. Open the marketplace and confirm built-in cards render.
2. Purchase a regular card and verify points and ownership persist.
3. Load, create, edit, and delete custom cards.
4. Export and restore a backup containing built-in and custom cards; verify rollback behavior on an invalid restore.
5. Run full reset and verify custom cards are removed while built-in cards remain.
6. Claim or test a Season reward and verify lookup and ownership.
7. Reload with the service worker active and confirm offline startup.
