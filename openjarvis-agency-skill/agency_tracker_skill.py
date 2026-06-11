"""
OpenJarvis skill: Agency Tracker
Voice commands for tracking leads and revenue toward your monthly goal.

Setup (after cloning https://github.com/open-jarvis/OpenJarvis):
  1. Copy this file into OpenJarvis's skills/ directory.
  2. Edit TRACKER_PATH and LEADS_PATH below to point at the absolute paths
     of agency_tracker.csv and leads_prospects.csv in this repo.
  3. Restart OpenJarvis. Trigger phrases below become available as voice commands.

Voice commands:
  "log a new client <name> for <amount> dollars for <service>"
      -> appends a closed-deal row to agency_tracker.csv
  "add a lead <name>, category <category>, pitch <pitch angle>"
      -> appends a row to leads_prospects.csv
  "what's my revenue progress" / "how much have I made"
      -> reads agency_tracker.csv, sums closed deals, compares to goal
  "next prospect" / "give me a prospect to call"
      -> reads next not-contacted row from leads_prospects.csv,
         reads back the opportunity + implementation steps, and
         marks it "reviewed today"
  "mark <name> as contacted"
      -> updates that prospect's contact_status

Daily prospect checks:
  Voice cannot browse the web on its own. The intended workflow is:
    1. Each morning, start a Claude Code session in this repo and run:
       "research today's batch of app/AI-agent prospects" - Claude searches
       for new real businesses and appends rows to leads_prospects.csv.
    2. Then use Jarvis throughout the day with "next prospect" to work
       through the list hands-free.
  To automate step 1, set up a scheduled trigger (e.g. cron or the
  Claude Code "session-start-hook" skill) that kicks off that session
  every morning.
"""

import csv
import os
import re
from datetime import date

TRACKER_PATH = "/home/user/maxrep-privacy/agency_tracker.csv"
LEADS_PATH = "/home/user/maxrep-privacy/leads_prospects.csv"

MONTH_START_TOTAL = 2000
GOAL_30_DAY = 6000


def log_client(name, amount, service):
    with open(TRACKER_PATH, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([date.today().isoformat(), name, service, amount, "closed", "added via Jarvis"])
    return f"Logged {name} for ${amount} for {service}."


def add_lead(name, category, pitch):
    with open(LEADS_PATH, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([date.today().isoformat(), name, category, "manual / Jarvis", "not contacted", pitch, "", "", "added via Jarvis"])
    return f"Added lead {name} in category {category}."


def _read_leads():
    with open(LEADS_PATH, newline="") as f:
        rows = list(csv.reader(f))
    return rows[0], rows[1:]


def _write_leads(header, rows):
    with open(LEADS_PATH, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)


def next_prospect():
    header, rows = _read_leads()
    for row in rows:
        if len(row) > 4 and row[4] == "not contacted":
            row[4] = "reviewed"
            _write_leads(header, rows)
            name, category, opportunity, steps = row[1], row[2], row[5], row[6]
            return f"{name} ({category}). Opportunity: {opportunity}. Steps: {steps}"
    return "No more prospects in the not-contacted queue. Run a research batch to add more."


def mark_contacted(name):
    header, rows = _read_leads()
    for row in rows:
        if len(row) > 1 and row[1].strip().lower() == name.strip().lower():
            row[4] = "contacted"
            _write_leads(header, rows)
            return f"Marked {name} as contacted."
    return f"Couldn't find a prospect named {name}."


def revenue_progress():
    total = 0.0
    with open(TRACKER_PATH) as f:
        for row in csv.reader(f):
            if not row or row[0].startswith("#") or row[0] == "date":
                continue
            try:
                total += float(row[3])
            except (ValueError, IndexError):
                continue
    remaining = max(GOAL_30_DAY - total, 0)
    return (
        f"You've earned ${total:.0f} in new revenue this period, "
        f"toward your ${GOAL_30_DAY:.0f} goal. "
        f"${remaining:.0f} remaining."
    )


# --- OpenJarvis intent handlers ---
# Adjust the registration syntax to match the OpenJarvis skill API version you install.

INTENTS = {
    r"log (?:a )?(?:new )?client (.+?) for \$?([\d.]+) dollars? for (.+)": lambda m: log_client(
        m.group(1).strip(), float(m.group(2)), m.group(3).strip()
    ),
    r"add (?:a )?lead (.+?), category (.+?), pitch (.+)": lambda m: add_lead(
        m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
    ),
    r"(?:what'?s my revenue progress|how much have i made)": lambda m: revenue_progress(),
    r"(?:next prospect|give me a prospect(?: to call)?)": lambda m: next_prospect(),
    r"mark (.+) as contacted": lambda m: mark_contacted(m.group(1).strip()),
}


def handle(utterance):
    for pattern, fn in INTENTS.items():
        m = re.match(pattern, utterance.strip(), re.IGNORECASE)
        if m:
            return fn(m)
    return None
