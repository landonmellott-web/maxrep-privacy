# Agency Tracker - OpenJarvis Skill

Voice-driven tracking for selling **apps and AI agents to local businesses**,
plus revenue tracking toward a monthly goal.

## Files
- `agency_tracker_skill.py` - the skill, with voice intents
- `../agency_tracker.csv` - revenue log (existing clients + new closed deals)
- `../leads_prospects.csv` - prospect list with opportunity + implementation steps per business

## Install
1. Clone OpenJarvis: `git clone https://github.com/open-jarvis/OpenJarvis.git`
2. Follow OpenJarvis's own setup docs to get the assistant running and
   verify a basic voice command works (e.g. its built-in "what time is it").
3. Copy `agency_tracker_skill.py` into OpenJarvis's skills directory.
4. Update `TRACKER_PATH` and `LEADS_PATH` in the skill to absolute paths.
5. Restart OpenJarvis.

## Voice commands
- "Log a new client Acme Co for 500 dollars for website redesign"
- "Add a lead Smith Plumbing, category contractor, pitch missed-call AI receptionist"
- "What's my revenue progress"
- "Next prospect" / "Give me a prospect to call" - reads back the opportunity
  and implementation steps for the next not-contacted business, marks it reviewed
- "Mark Rockfish Public House as contacted"

## leads_prospects.csv columns
`date_added, business_name, category, source, contact_status,
app_or_agent_opportunity, implementation_steps, est_value, notes`

## Daily prospect research
Voice can't browse the web. The workflow is:
1. Each morning, open a Claude Code session in this repo and say
   "research today's batch of app/AI-agent prospects for [category]".
   Claude searches real local business directories/listings, fills out
   the opportunity + implementation steps for each, and appends rows.
2. Use Jarvis ("next prospect") to work the queue hands-free during the day.
3. To fully automate step 1's trigger, set up a daily cron job or the
   Claude Code session-start-hook to kick off that research session.

## Current status (manually maintained)
- Month start: $2,000 earned
- 30-day goal: $6,000 additional (target $8,000/mo total)
- Existing clients: The Closet Reboot, Caliber Roofing and Remodeling, Weir Kitchens

## Note on accuracy
The skill only logs data you give it. Prospect rows added by Claude come from
real, named businesses found via web search - opportunity/value estimates are
hypotheses to validate during outreach, not confirmed facts.
