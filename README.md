# Email Analytics

Interactive dashboard for group-sales email activity and conversation review.

Features include daily/monthly counts, average hourly activity, linked country/region/city filtering, enquiry classifications with evidence, and a searchable conversation reader with collapsible quoted history. Reset filters clears all date and content selections.

## Data and privacy

This repository includes the populated `email-dashboard/src/data.json` dataset at the owner's request. It contains 427 email records across 100 conversations, contact locations, reviewed classifications, and structured email content for the conversation reader. This file is sufficient to populate the dashboard; the original JSON export and contact spreadsheets are not required to run it.

The dataset contains customer email content and contact information and is accessible to anyone with access to this repository. Original input files, signature images and generated HTML exports remain excluded. Image and attachment files absent from the dataset cannot be displayed by the reader.

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

1. Clone the repository. The reviewed snapshot is already included at `email-dashboard/src/data.json`, with email annotations and structured reader content.
2. Follow `email-dashboard/AGENTS.md` for the supported build workflow and editable boundaries. Application-specific React and CSS live in `email-dashboard/src/content/dashboard/`.
3. Build the app, then serve its `dist` directory as shown above.

The helper `prepare_email_dashboard.py` creates an initial snapshot from private JSON/CSV inputs; it does not reproduce the later reviewed classifications and display rules. `prepare_email_reader.py` augments an existing snapshot with safely rendered message content. Both require local inputs; the reader helper requires `beautifulsoup4`.

## Measurement notes

- Counts refer to individual messages in the supplied export, not complete mailbox history.
- Hour-of-day averages divide by calendar days in the selected export period.
- New enquiries are first observed requests; follow-ups are existing enquiries. Classification is evidence-based but includes cases needing review.
- Location bars count conversations. The Turtle Down Under fallback is a sender label for missing location fields, not a geographic address.
- Conversation IDs are not necessarily unique bookings; related threads can describe the same booking.
