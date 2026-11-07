# StandOut Special Cards

Special Cards remain part of the normal card catalogue and ownership model. Their powers begin only after the owner selects **Activate**. Activation is permanent and can happen once per card.

## Assigned cards

| Card | Power | First reward / schedule | Validity |
|---|---|---|---|
| Sita Maa (`season_03_exclusive_card`) | 2 Improvement Points | First grant after 7 days, then every 7 days | 3 calendar months |
| Raje (`Raje`) | 20% off all Marketplace cards, including Limited Edition cards | Every Sunday while active | 3 calendar months |
| Jatayu (`season_03_card`) | 1 Momentum Shield Point | First grant after 14 days, then every 14 days | 3 calendar months |

## Lifecycle and persistence

- Cards show **Activate** until activated.
- Active cards show **ACTIVE** and their expiration date.
- The activation window is calculated in calendar months using the app's IST date.
- Rewards due while the card was active are caught up the next time the app runs, even if the user missed the exact reward date or next opens the app after expiration.
- Reward claim keys and activation schedules are stored in LocalStorage. They are included in complete backups and restored with the rest of LocalStorage.
- At expiration, the power indicator and power description disappear. The card remains owned and behaves like a normal card.
- The Sunday discount is applied at checkout, not merely displayed. The discounted cost is rounded to the nearest whole Improvement Point because the current points economy stores whole-point balances.
- A daily IST boundary check refreshes the card UI and Sunday discount state while the app remains open.

## Testing

Run:

```bash
node scripts/special-card-tests.mjs
node scripts/card-catalogue-module-tests.mjs
node scripts/release-gate.mjs
```

The release gate covers automated checks. Complete the browser and manual workflows in `Extra/BROWSER-TESTING.md` before treating the update as production-ready.


## Interaction correction (2026-11-07)

- A single click on `ACTIVATE` activates the card (the action is delayed briefly so a double-click can be distinguished).
- A double-click on either `ACTIVATE` or `ACTIVE` pins/unpins the owned card using the existing 2 Improvement Point pin cost and four-card limit.
- Active special-card controls remain enabled so double-click pinning works.
- At expiration, the special controls and power label disappear; the card returns to the normal `OWNED` control and existing double-click pin behavior.
- Raje's discount check reads the latest persisted `ownedCards` record, validates the active date window, and only applies on Sundays in the app's IST date.
- On an eligible Sunday, Marketplace displays a 20% discount banner and discounted prices, including for Limited Edition cards.

### Sunday discount test

In the browser console, use the dedicated test override:

```js
window.__standoutSpecialCardTestDate = "2026-11-08";
window.renderMarketplace();
window.isSpecialDiscountActive(); // should return true if Raje is active
```

Clear the override and refresh to restore the real date:

```js
delete window.__standoutSpecialCardTestDate;
location.reload();
```

The override changes only the date used by Special Card logic; it does not alter the computer clock.
