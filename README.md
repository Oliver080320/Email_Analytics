# Email Analytics

Interactive dashboard for group-sales email activity and conversation review.

Features include a combined month and multi-date calendar, daily/monthly counts, average hourly activity, Turtle Down Under reply time, weekday/hour heatmaps, peak periods, linked country/region/city filtering, enquiry classifications, contact addresses/phones/websites, a Strengths & issues review, and a searchable conversation reader with collapsible quoted history. Reset filters clears all date and content selections. Displayed dates use DD-MM-YYYY.

## Folder guide

- **email_dashboard.html**: latest dashboard. Double-click to open in your browser.
- **email-dashboard/**: application source, embedded dataset and local server build. Keep this folder for future edits.
- **supporting-files/**: original JSON, reviewed CSVs, spreadsheets, signature images, notebook and preparation scripts. These are not required to open the HTML dashboard. Run the notebook from this folder; its main Excel output still points to the workbook in the parent folder.
- **agent_contact_sheet.xlsx**: retained in its existing location because Excel has it open. The hidden `~$` file is Excel's temporary lock; Excel removes it when the workbook closes normally.

Raw source files and signature references named in dashboard evidence can be found under `supporting-files/`. Preparation helpers are historical steps, not a complete rebuild of later reviewed annotations.

## Data and privacy

This repository includes the populated `email-dashboard/src/data.json` dataset at the owner's request. It contains 427 email records across 100 conversations, contact locations, reviewed classifications, and structured email content for the conversation reader. This file is sufficient to populate the dashboard; the original JSON export and contact spreadsheets are not required to run it.

The dataset contains customer email content and contact information and is accessible to anyone with access to this repository. The original email JSON, reviewed contact CSVs, signature review/candidate JSONs, and available signature images are also included at the owner's request. Generated HTML exports, redundant spreadsheets and historical audit outputs remain excluded. Image and attachment files absent from the dataset cannot be displayed by the reader.

Included source files under `supporting-files/`:

- `groupsales_latest_100_conversations.json`: original 100-conversation email export.
- `agent_contact_sheet.csv`: extracted contact information and signature evidence.
- `conversation_contacts_enriched.csv`: reviewed conversation locations and source references.
- `signature_review_source.json`, `signature_image_candidates.json`, and `signature_images/`: available signature evidence.

The source CSVs preserve their original extraction values. The current corrected, classified and display-ready data remains `email-dashboard/src/data.json`; use it for the latest dashboard annotations. This update does not add emails beyond the existing 24-04-2026 to 12-08-2026 export.

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

The helper `supporting-files/prepare_email_dashboard.py` creates an initial snapshot from private JSON/CSV inputs; it does not reproduce the later reviewed classifications and display rules. `supporting-files/prepare_email_reader.py` augments an existing snapshot with safely rendered message content. Both require local inputs; the reader helper requires `beautifulsoup4`.

## Measurement notes

- Counts refer to individual messages in the supplied export, not complete mailbox history.
- Hour-of-day averages divide by selected calendar days, including days with no matching records.
- Reply time runs from an external incoming email to the next non-automatic Turtle Down Under reply addressed to that sender in the same thread. It includes nights/weekends and excludes emails without an observed reply.
- Explicit date selections expand to their Monday-Sunday weeks only in Busy weekdays and hours; other sections retain the exact selected dates. Export boundaries limit week coverage.
- Assumed contact names and companies are labelled; recognized personal email providers leave assumed companies blank. Physical contact details come from reviewed email/signature evidence and missing fields stay blank.
- New enquiries are first observed requests; follow-ups are existing enquiries. Classification is evidence-based but includes cases needing review.
- Location bars count conversations. The Turtle Down Under fallback is restricted to internal-only threads; external contacts without a known location remain Unknown.
- Conversation IDs are not necessarily unique bookings; related threads can describe the same booking.
