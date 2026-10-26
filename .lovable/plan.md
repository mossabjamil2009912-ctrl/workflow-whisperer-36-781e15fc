# Confirm residential bill gives the same system in WhatsApp and the app

## Current answer
Both use the same steps for a typed bill of 50,000 riyals:
- Daily need = 50,000 / 250 / 30 = 6.67 kWh per day
- Pick the home system whose daily output is closest to 6.67 (8 kW and 12 kW systems are skipped if they produce less than the need)

So they should give the same system.

## Two small differences to check
1. When two systems are equally close, the bot shows both as buttons. The app picks only the first one.
2. The bot compares against a "range" number stored in its own table. The app works out output as panels x watts x 5.5 / 1000. If any system's stored range differs from that calculation, the results could differ.

## Steps
1. Add a test that runs bills from 3,000 to 210,000 riyals through the app and through a copy of the bot's selection rule, and lists any bill where they differ (including 50,000).
2. If they differ, make the app match the bot's numbers. If there's a tie, show both systems for the user to choose, like the bot does.
3. Keep the test in the project.
