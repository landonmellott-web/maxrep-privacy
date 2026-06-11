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
        writer.writerow([name, category, "manual / Jarvis", "not contacted", "", pitch, "added via Jarvis"])
    return f"Added lead {name} in category {category}."


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
}


def handle(utterance):
    for pattern, fn in INTENTS.items():
        m = re.match(pattern, utterance.strip(), re.IGNORECASE)
        if m:
            return fn(m)
    return None
