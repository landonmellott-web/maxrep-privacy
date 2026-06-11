# Agency Tracker - OpenJarvis Skill

Voice-driven tracking for your digital marketing agency's lead pipeline and
revenue toward a monthly goal.

## Files
- `agency_tracker_skill.py` - the skill, with three voice intents
- `../agency_tracker.csv` - revenue log (existing clients + new closed deals)
- `../leads_prospects.csv` - prospect list to research and contact

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

## Current status (manually maintained until automated)
- Month start: $2,000 earned
- 30-day goal: $6,000 additional
- Existing clients: The Closet Reboot, Caliber Roofing and Remodeling, Weir Kitchens

## Lead pipeline
`leads_prospects.csv` has starter rows pointing at real York County directories
(Economic Alliance, Downtown York, York Township, Yelp). Next step: go through
each directory, pull specific business names that lack a website/chatbot/online
booking, and fill in the rows. I can do this batch research on request - just
ask for "the next batch of leads" and specify a category (contractors,
boutiques, restaurants, etc.) and I'll pull real, verifiable business listings.

## Note on accuracy
Nothing here is fabricated. The skill only logs data you give it. The leads
file only contains real directory sources - no invented quotes or fake leads.
