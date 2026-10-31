# Put a full copy of the data inside the project

Goal: when the project is pushed to GitHub, the repository carries a full copy of the data as of today, not just the code.

## What gets saved
One file per table in a new `data/` folder, holding all of its rows as of today:
- Items, specs, prices and datasheet links (`catalog_items`)
- The kWh price setting (`app_settings`)
- Customers, conversations and messages
- Orders, quotes, report requests, support tickets
- Ready-made system report files: the list of which file belongs to which system (`preset_reports`)
- Button locks (`bot_button_locks`)

Plus a `data/README.md` that explains how to load the copy into a fresh database, in the right order (customers first, then everything linked to them).

## Notes
- This is a copy of today's data only. New conversations and orders after today stay in the live database until you ask for another copy.
- The repository must stay **Private**, because it will contain customer phone numbers and conversations.
- PDF files uploaded to storage (datasheets, PVsyst/SLD reports) are not stored as rows in a table. I will also download them into `data/files/` if each file is under 10 MB. Larger files will be listed by name only.
- Lovable's built-in full backup (More → Database → Manage → Settings → Export data) is still the official restore copy, including user accounts.

## Technical details
- Export each public table with `COPY (SELECT ...) TO STDOUT WITH CSV HEADER` into `data/<table>.csv`, ordered by its primary key or creation time.
- `data/README.md` gives the import order: app_settings, catalog_items, customers, messages, orders, quotes, report_requests, support_tickets, preset_reports, bot_button_locks. It also gives the `\copy ... FROM ... CSV HEADER` commands.
- List the storage buckets and download each object into `data/files/<bucket>/` (skip anything over 10 MB and log it in the README).
- App code and the schema are not touched.
