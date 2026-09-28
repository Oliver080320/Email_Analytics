# Email Analytics

Interactive dashboard for group-sales email activity and conversation review.

Features include daily/monthly counts, average hourly activity, linked country/region/city filtering, enquiry classifications with evidence, and a searchable conversation reader with collapsible quoted history. Reset filters clears all date and content selections.

## Data and privacy

This public repository contains application source only. Customer email bodies, contact spreadsheets, the populated `src/data.json`, signature images, and built HTML exports are deliberately excluded. They remain in the original local workspace. A fresh clone does not include a populated dashboard.

Keep private inputs and generated dashboard files out of commits. The offline HTML embeds email content, so treat it as private data too.

## Open the existing local dashboard

From the original workspace in PowerShell:

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory email-dashboard/dist
```

Visit http://127.0.0.1:4173/. Keep the terminal open; press Ctrl+C to stop.

Alternatively, open the existing local offline export:

```powershell
Start-Process ./email_dashboard.html
```

These generated files are not included in this repository.

## Develop or rebuild

1. Restore your private reviewed snapshot to `email-dashboard/src/data.json` from the original workspace. It includes the email annotations and structured reader content.
2. Follow `email-dashboard/AGENTS.md` for the supported build workflow and editable boundaries. Application-specific React and CSS live in `email-dashboard/src/content/dashboard/`.
3. Build the app, then serve its `dist` directory as shown above.

The helper `prepare_email_dashboard.py` creates an initial snapshot from private JSON/CSV inputs; it does not reproduce the later reviewed classifications and display rules. `prepare_email_reader.py` augments an existing snapshot with safely rendered message content. Both require local inputs; the reader helper requires `beautifulsoup4`.

## Measurement notes

- Counts refer to individual messages in the supplied export, not complete mailbox history.
- Hour-of-day averages divide by calendar days in the selected export period.
- New enquiries are first observed requests; follow-ups are existing enquiries. Classification is evidence-based but includes cases needing review.
- Location bars count conversations. The Turtle Down Under fallback is a sender label for missing location fields, not a geographic address.
- Conversation IDs are not necessarily unique bookings; related threads can describe the same booking.
