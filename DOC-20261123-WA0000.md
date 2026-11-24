# **Embed Dashboard** 

## **Full Project Handoff Plan - version 2** 

For the developer (and the developer's Claude) who will code the next rounds. Owner: Shivanshu. Version 2 written 23 Nov 2026 after a full review of both code repositories and the live dashboard. 

##### **What changed in this version (read this first)** 

1. **Patches, not whole files.** The owner now accepts small, exact find-and-replace patches (Section 5 explains the format). New files and big rewrites are still delivered whole. 

2. **The plan matches reality.** A lot of version 1's to-do list is already built (classic embeds, test send, webhook personas, login nonce, rate limits). Section 4 lists what exists; the roadmap lists only what is left. 

3. **Scope is now decided.** Tickets, polls/giveaways, role groups/temporary roles, levels and moderation are OUT. Welcome/goodbye, keyword auto-replies, custom commands and feeds are IN (Section 2). 

4. **New structure.** Features are grouped into Website looks, Website onboarding, Website handling, Editor, Bot handling and Safety (Appendix A). The roadmap (Section 7) is the build order for them. 

5. **New work found in review:** database speed fixes and nightly backups (Phase 1), design polish list from real screenshots (Phase 2), and many new ideas from comparing other embed bots. 

### **Contents** 

|**.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .**<br>**1. Read this first**|**.  .  .  .  .  .  .  .  .  .  .  .  . 4**|
|---|---|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>1.1 What the project is|.  .  .  .  .  .  .  .  .  .  .  .  .  . 4|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>1.2 The owner's working environment (very important)|.  .  .  .  .  .  .  .  .  .  .  .  .  . 4|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>1.3 Kickoff prompt to give your Claude|.  .  .  .  .  .  .  .  .  .  .  .  .  . 4|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>1.4 Reading order|.  .  .  .  .  .  .  .  .  .  .  .  .  . 4|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>1.5 Status tags used in this document|.  .  .  .  .  .  .  .  .  .  .  .  .  . 5|
|**.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .**<br>**2. Scope: what is in and what is out**|**.  .  .  .  .  .  .  .  .  .  .  .  . 6**|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>2.1 Decided: IN|.  .  .  .  .  .  .  .  .  .  .  .  .  . 6|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>2.2 Decided: OUT|.  .  .  .  .  .  .  .  .  .  .  .  .  . 6|
|**.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .**<br>**3. Architecture**|**.  .  .  .  .  .  .  .  .  .  .  .  . 7**|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>3.1 Hosting limits|.  .  .  .  .  .  .  .  .  .  .  .  .  . 7|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>3.2 Settings (never in GitHub)|.  .  .  .  .  .  .  .  .  .  .  .  .  . 7|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>3.3 Login flow (as built)|.  .  .  .  .  .  .  .  .  .  .  .  .  . 7|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>3.4 Access rules|.  .  .  .  .  .  .  .  .  .  .  .  .  . 7|
|**.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .**<br>**4. Current state (code review, 23 Nov 2026)**|**.  .  .  .  .  .  .  .  .  .  .  .  . 8**|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>4.1 Bot repository (griedon-embeds)|.  .  .  .  .  .  .  .  .  .  .  .  .  . 8|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>4.2 Website repository (SebA2675.github.io)|.  .  .  .  .  .  .  .  .  .  .  .  .  . 8|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>4.3 What is built (verified)|.  .  .  .  .  .  .  .  .  .  .  .  .  . 8|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>4.4 Data model|.  .  .  .  .  .  .  .  .  .  .  .  .  . 9|
|.  .  .  .  .  .  .  .  .  .  .  .  .<br>4.5 API routes today (all need a Bearer JWT except health and auth)|.  .  .  .  .  .  .  .  .  .  .  .  .  . 9|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>4.6 Findings from the review (the to-fix list)|.  .  .  .  .  .  .  .  .  .  .  .  . 10|
|**.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .**<br>**5. Patch delivery rules (the new way of working)**|**.  .  .  .  .  .  .  .  .  .  .  . 11**|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>5.1 The seven rules|.  .  .  .  .  .  .  .  .  .  .  .  . 11|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 1 of 37 

|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>5.2 Patch types|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 11|
|---|---|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>5.3 Required patch layout|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 11|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>5.4 Tips for editing on a phone|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 12|
|**.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .**<br>**6. Fix first: the two issues the owner reported**|**.  .  .  .  .  .  .  .  .  .  .  .  . 13**|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>6.1 'Testers can edit the website with Inspect'|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 13|
|.  .  .  .  .  .  .  .  .  .  .  .  .<br>6.2 'Visiting nation9.me/dashboard shows a harmful-site warning'|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 13|
|**.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .**<br>**7. Roadmap: build in this order**|**.  .  .  .  .  .  .  .  .  .  .  .  . 15**|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>Phase 0 - Security hardening and the browser warning|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 15|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>Phase 1 - Foundations: database speed, backup and cleanup|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 16|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .<br>Phase 2 - Dashboard polish: Website looks and library handling|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 17|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>Phase 3 - Editor power tools|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 18|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>Phase 4 - Website flow and onboarding|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 19|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>Phase 5 - Sending, scheduling and webhooks|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 19|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>Phase 6 - Interactions and forms|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 20|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>Phase 7 - Automation|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 21|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>Phase 8 - Management, teamwork and safety|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 21|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>Phase 9 - Extras backlog (pick when the rest is stable)|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 22|
|**.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .**<br>**8. Database load, speed and backups**|**.  .  .  .  .  .  .  .  .  .  .  .  . 23**|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>8.1 What loads the database|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 23|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>8.2 The fixes in order|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 23|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>8.3 SQLite or Cloudflare D1?|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 23|
|**.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .**<br>**9. Design notes for the harder features**|**.  .  .  .  .  .  .  .  .  .  .  .  . 25**|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>9.1 Variables engine and playground (Phase 3.1-3.2)|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 25|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>9.2 Fill-in-the-blank templates (3.7)|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 25|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>9.3 Multi-message send / sequences (3.6)|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 25|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>9.4 Paginated embeds (3.8)|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 25|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>9.5 Share draft link (3.11)|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 25|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>9.6 Welcome and goodbye (7.1)|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 26|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>9.7 Keyword auto-replies (7.2)|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 26|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>9.8 Form responses and CSV export (6.5)|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 26|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>9.9 Feeds (7.5)|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 26|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>9.10 Trigger URLs (5.7)|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 26|
|**.  .  .  .  .  .  .  .  .  .  .  .**<br>**10. Open decisions for the owner (with recommendations)**|**.  .  .  .  .  .  .  .  .  .  .  .  . 27**|
|**.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .**<br>**11. Rules for every change**|**.  .  .  .  .  .  .  .  .  .  .  .  . 28**|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>11.1 The routine|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 28|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>11.2 Standing rules|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 28|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>11.3 Test checklist template|.  .  .  .  .  .  .  .  .  .  .  .  .  .  . 28|
|**.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .**<br>**Appendix A: The feature catalog, by category**|**.  .  .  .  .  .  .  .  .  .  .  .  . 29**|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 2 of 37 

|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>A.1 Website looks|.  .  .  .  .  .  .  .  .  .  .  .  .  . 29|
|---|---|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>A.2 Website onboarding|.  .  .  .  .  .  .  .  .  .  .  .  .  . 29|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>A.3 Website handling (dashboard)|.  .  .  .  .  .  .  .  .  .  .  .  .  . 29|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>A.4 Editor (building messages)|.  .  .  .  .  .  .  .  .  .  .  .  .  . 30|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>A.5 Bot handling: sending and scheduling|.  .  .  .  .  .  .  .  .  .  .  .  .  . 30|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>A.6 Bot handling: interactions and forms|.  .  .  .  .  .  .  .  .  .  .  .  .  . 31|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>A.7 Bot handling: automation and commands|.  .  .  .  .  .  .  .  .  .  .  .  .  . 31|
|.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .<br>A.8 Safety, hosting and developer|.  .  .  .  .  .  .  .  .  .  .  .  .  . 31|
|**.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .**<br>**Appendix B: Planned database changes by phase**|**.  .  .  .  .  .  .  .  .  .  .  . 33**|
|**.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .**<br>**Appendix C: Discord limits cheat sheet**|**.  .  .  .  .  .  .  .  .  .  .  . 34**|
|**.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .**<br>**Appendix D: Intents and permissions per feature**|**.  .  .  .  .  .  .  .  .  .  .  . 35**|
|**.  .  .  .  .  .  .  .  .  .  .  .**<br>**Appendix E: What other embed bots do (research summary)**|**.  .  .  .  .  .  .  .  .  .  .  . 36**|
|**.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .**<br>**Appendix F: Glossary for a beginner**|**.  .  .  .  .  .  .  .  .  .  .  . 37**|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 3 of 37 

## **1. Read this first** 

### **1.1 What the project is** 

A private, free web dashboard plus a Discord bot (Python, discord.py) for designing, posting, editing, scheduling and managing rich Discord messages. It supports **layout messages** (Discord Components V2: text, images, dividers, boxes, buttons, dropdowns, pop-up forms, role actions, private replies) and **classic embeds** . The project belongs to the owner; you are helping to code it. It is an **embed bot** , not a general-purpose bot: no tickets, no moderation, no levels. 

### **1.2 The owner's working environment (very important)** 

- The owner **cannot install anything** . Everything is done in a browser (often on a phone): GitHub web editor, the Bot-Hosting file manager and console, the Discord Developer Portal. 

- **Free services only.** Do not add anything paid. If a free tier has limits, state them and design inside them. 

- **Patches are now the default delivery format** (Section 5). Give exact find/replace blocks with the repo, the file path and the indentation. Give a whole file only for brand-new files, for rewrites of more than about 40% of a file, or when the owner asks. 

- The owner is a **beginner** . Explain steps simply, one at a time, and end every answer with a short test checklist. 

- The owner has **hand-edited dashboard/index.html** since Claude last wrote it (Edit and Test modes, click-to-select preview with a floating toolbar, a text formatting toolbar, a clickable problems list with red dots, breadcrumbs, a collapsible parts tree). **Always ask for the CURRENT version of the part you will change** before you write a patch. 

### **1.3 Kickoff prompt to give your Claude** 

```
I am taking over the coding for the project in the attached document. Read all of it.
Before changing anything, ask me to paste the CURRENT code of the part you will change.
Give me PATCHES (exact find / replace blocks, as described in Section 5) instead of
whole files. Brand-new files may be whole. For every patch name the repo, the file path
and the indentation. Keep everything free and browser-only, and end each answer with a
short test checklist. Start with Phase 0 (security and the browser warning).
```

### **1.4 Reading order** 

|**If you want to...**|**Read**|
|---|---|
|**Understand what exists today**|Section 3 (architecture) and Section 4 (current state)|
|**Know what is in and out of scope**|Section 2|
|**Learn how to deliver code to the owner**|Section 5 (patch rules) and Section 11 (every-change routine)|
|**Start coding**|Section 7 (roadmap): Phase 0 first|
|**See every feature idea, by category**|Appendix A|
|**Understand database load and the fixes**|Section 8 and Appendix B|
|**Look up Discord limits, intents,**<br>**permissions**|Appendices C and D|
|**Look up a word you do not know**|Appendix F (glossary)|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 4 of 37 

### **1.5 Status tags used in this document** 

|**Tag**|**Meaning**|
|---|---|
|**DONE**|Already built and visible in the code or the live dashboard.|
|**PARTLY**|Partly built; the remaining work is listed.|
|**PLANNED**|Agreed and not built yet.|
|**NEW**|New idea added in version 2, not built.|
|**TOP PICK**|Highest value for the effort; build these early in their phase.|
|**DECIDE**|Borderline: needs an owner decision (Section 10).|
|**CUT**|Removed from the project.|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 5 of 37 

## **2. Scope: what is in and what is out** 

The owner wants an **embed bot** . Anything that is a separate kind of bot (tickets, moderation, levels, giveaways) is out. Features that exist only to make posted messages smarter (cooldowns, role buttons, forms attached to a message) stay in. 

### **2.1 Decided: IN** 

- Everything about designing, posting, editing, scheduling and managing messages (layout and classic). 

- **Welcome and goodbye messages** designed in the editor (needs the Server Members intent). 

- **Keyword auto-replies and custom commands** that reply with a saved message (auto-replies need the Message Content intent; slash-command versions do not). 

- **Form flow** : store responses, CSV export, Accept/Deny buttons with a DM and a role. The database cost is small (about 1 KB per response; 10,000 responses is about 10 MB). 

- **RSS, YouTube and Reddit feeds** rendered through a chosen template. (Reddit may block hosting-provider IPs, so treat that one as best-effort.) 

- Webhook sending as a custom name and avatar, forum channels and threads. 

- Sticky messages, webhook trigger URLs and slash commands are borderline: see Section 10 for the decision. 

### **2.2 Decided: OUT** 

|**Removed feature**|**Why**|
|---|---|
|**Tickets (private threads, claim/close, transcripts)**|A separate bot category; large and security-sensitive.|
|**Polls, suggestions, giveaways**|Not embed design; they are their own bots.|
|**Role groups and temporary roles (pick-one, max N,**<br>**expiring roles)**|Reaction-role-bot territory. Plain role buttons, menus and cooldowns<br>stay.|
|**Levels, XP, streaks, moderation, anti-nuke, AI**<br>**features**|Not an embed bot.|
|**Premium tiers**|The project must stay free.|
|**A Discohook-style general 'flows' engine**|Too large; the simple actions list in Phase 6 covers the real needs.|
|**Live member/online-count embeds**|Removed by the owner.|
|**Auto-pin, auto-delete, auto-publish**|Channel housekeeping, not embeds.|
|**Translation features**|Would need an AI or translation API; not worth it.|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 6 of 37 

## **3. Architecture** 

|**Part**|**Where it runs**|**Notes**|
|---|---|---|
|**Dashboard**|One static site at https://nation9.me/dashboard/<br>on GitHub Pages (owner's .me domain from the<br>student pack)|Repo SebA2675.github.io. Currently ONE file<br>(index.html, 3,077 lines). To be split in Phase 0.|
|**API**|FastAPI inside the same Python process as the<br>bot, on Bot-Hosting's free plan|Free HTTPS subdomain *.apps.bot-hosting.cloud.<br>API_URL is a constant near the top of the page script.|
|**Database**|One SQLite file data.db next to the code|Kept out of Git by .gitignore. See Section 8 for speed<br>fixes and backups.|
|**Bot**|discord.py 2.6 or newer (Components V2),<br>Python 3.14 container|Repo griedon-embeds. Default intents only today.|



### **3.1 Hosting limits** 

- Free plan: one deployment, about 256 MB RAM, 512 MB storage; renew by hand every 4 days (a paid tier removes this). 

- The host pulls code from GitHub **only when started** : Stop, then Start after every bot code change. 

- Packages install from requirements.txt on start (no pip commands in the console). Current list: discord.py>=2.6, fastapi, uvicorn, PyJWT, tzdata. A new feature that needs a library (for example feedparser for RSS) means adding one line there. 

### **3.2 Settings (never in GitHub)** 

Set as host variables or in a .env file on the host: BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, OWNER_ID, JWT_SECRET, API_URL, DASHBOARD_ORIGIN (https://nation9.me), optional SERVER_PORT or PORT. Future: GITHUB_BACKUP_TOKEN (Phase 1). The bot exits with a clear message if a required setting is missing. 

### **3.3 Login flow (as built)** 

1. The dashboard creates a random nonce, saves it in localStorage, and sends the browser to `/auth/login?n=NONCE` on the API. 

2. The API checks the nonce format (16-64 letters/digits) and redirects to Discord OAuth (scope **identify** only) with a signed 5-minute state that contains the nonce. 

3. Discord returns to `/auth/callback` . The API exchanges the code, reads the user ID, and (for non-owners) checks the user can reach at least one approved server. 

4. The API issues a signed **JWT valid 12 hours** and redirects to `nation9.me/dashboard/#token=...&n=...` . 

5. The page compares n with the saved nonce (stops login-CSRF), stores the token in localStorage and sends it as a Bearer header on every request. 

### **3.4 Access rules** 

- **Owner** (OWNER_ID): sees everything plus the owner-only Servers page. 

- **Everyone else** must be an Administrator of a server that is on the approved list and where the bot is. Permission is re-checked on every request (60-second cache, uses fetch_member, no privileged intents). 

- The bot **leaves any server not on the approved list** and records it as pending. On the very first run it approves the servers it is already in. 

- Protection already in main.py: CORS locked to the dashboard origin, 4 MB body cap, 240 requests/min per IP (20/min for /auth/), 300 requests/min per user. 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 7 of 37 

## **4. Current state (code review, 23 Nov 2026)** 

Version 1 of this plan was written before several features were built. This section is the truth as of the review. If something here disagrees with the code you are given, trust the code and tell the owner. 

### **4.1 Bot repository (griedon-embeds)** 

|**File**|**What it does**|**Lines**|
|---|---|---|
|**main.py**|Entry point. Settings, FastAPI app, rate-limit/size middleware, CORS, /health, /auth/login,<br>/auth/callback, /me, bot subclass (starts API and scheduler), approved-server enforcement,<br>forwards clicks to interactions.py.|239|
|**access.py**|Permission checks: is_admin (cached 60 s), accessible_guilds, require_guild.|50|
|**routes.py**|Every API route, hand-written layout validation (v_* functions, check_layout), channel<br>checks, import, export, backup.|962|
|**builder.py**|Turns saved layout JSON into discord.py objects: Components V2 parts and classic<br>embeds (up to 10), with validation.|336|
|**db.py**|All SQLite access and table creation. No indexes yet (Phase 1).|583|
|**interactions.py**|Handles clicks on posted buttons and dropdowns (custom_id<br>m:{message_id}:{component_id}): reply, role add/remove/toggle, open form,<br>cooldown/once-per-person rules.|195|
|**forms.py**|Pop-up form (modal), up to 5 questions; posts answers to the chosen channel (same-server<br>check) and thanks the user privately.|63|
|**webhooks.py**|NEW since v1. Finds or creates the bot's own webhook in a channel; send, edit and delete<br>as a webhook with a persona (name and avatar).|61|
|**scheduler.py**|Loop every 30 s: runs due schedules (post new, optionally delete previous, or update<br>posted message); skips runs missed by over an hour.|168|
|**timeutil.py**|Time-zone-aware date maths for schedules (once, daily, weekly).|42|
|**requirements.txt,**<br>**.gitignore,**<br>**README.md**|Dependencies; .gitignore contains .env and data.db; README is almost empty (fill it in,<br>Phase 8).|-|



### **4.2 Website repository (SebA2675.github.io)** 

- **dashboard/index.html** (3,077 lines): the whole dashboard in one file (HTML, CSS, an inline SVG icon sprite, one script block). Views: login, library, builder, owner-only Servers page, overlays for send, emoji picker, server tools (backup, import, templates), version history and scheduling. 

- **dashboard/logo.png** : the bot logo. **CNAME** = nation9.me. 

- **dashboard/send.js** (4 KB): **an old leftover.** index.html does not load it, and it builds a dark-themed overlay that does not match the cream design. Delete it in Phase 0. 

- The rest of the repo is the owner's portfolio. Do not touch it. 

### **4.3 What is built (verified)** 

|**Area**|**Built**|**Status**|
|---|---|---|
|**Messages**|Layout messages (text, text + side, images, divider, box, button row, dropdown); replies;<br>forms; classic embed editor ("New classic embed").|**DONE**|
|**Editor**|Undo/redo, autosave (3 s after typing stops), drag reorder, duplicate, Edit/Test modes,<br>click-to-select preview with floating toolbar, breadcrumbs, formatting toolbar, emoji insert,<br>problems chips with red dots, component counter (20/40), character counter (745/4000).|**DONE**|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 8 of 37 

|**Area**|**Built**|**Status**|
|---|---|---|
|**Sending**|Post as new, update posted message, delete posted message, send as webhook persona,<br>test send to your DMs ("DM me"), Template, History, Schedule.|**DONE**|
|**Library**|Cards with Open, copy, export, delete; "changed since posted" badge; version history (last<br>20); backup, import; templates; owner Servers page.|**DONE**|
|**Interactions**|Link, reply, form, role actions; cooldown and once-per-person rules (button_uses table).|**DONE**|
|**Scheduling**|Once, daily, weekly; replace previous post; time zones.|**DONE**|
|**Security**|Login nonce, 12-hour token, rate limits, body cap, CORS lock, approved servers,<br>permission re-checks, deeper validation, secrets out of Git.|**PARTLY**|



### **4.4 Data model** 

```
messages(id, name, guild_id, channel_id, posted_message_id, webhook_id, layout_json, created_at, updated_at)
templates(id, guild_id, name, layout_json, created_at)       versions(id, message_id, name, layout_json, created_at)
schedules(id, message_id, guild_id, action, channel_id, run_date, run_time, tz, repeat_kind, replace_previous,
          next_run, last_run, last_status, active, created_at)
button_uses(message_id, component_id, user_id, last_used, uses)   -- primary key already indexes this
webhook_personas(id, guild_id, name, avatar_url, created_at)
allowed_guilds(guild_id, name, added_at)    pending_guilds(guild_id, name, seen_at)
```

#### **Layout JSON (what the dashboard edits and the bot builds)** 

```
{ kind: "layout" | "classic",  guild_id,
  blocks: [...],                       // layout messages
  content, embeds: [...],              // classic messages (content 2000 chars, up to 10 embeds)
  replies: [{id, name, blocks}],
  forms:   [{id, name, title, channel_id, thanks, fields: [{id, label, style, placeholder, required}]}] }
```

Block types: **text, section** (text plus button or thumbnail), **images, divider, box** (container with accent colour; children cannot be boxes), **button_row** (up to 5), **dropdown** (up to 25 options). A button is {id, label, style, emoji, action}; an action is link, reply, form or role. Posted components use `custom_id =` 

`m:{message_id}:{component_id}` , so clicks keep working after restarts without storing live views. Keep old saved messages working: every new field needs a migration that defaults it. 

### **4.5 API routes today (all need a Bearer JWT except health and auth)** 

|**Group**|**Routes**|
|---|---|
|**Auth, health**|GET /health, /auth/login, /auth/callback, /me|
|**Messages**|GET/POST /messages; GET/PUT/DELETE /messages/{id}; POST /messages/{id}/post, /update,<br>/post-webhook, /test; DELETE /messages/{id}/posted; GET /messages/{id}/export|
|**History**|GET /messages/{id}/versions, /versions/{vid}|
|**Schedules**|GET/POST /messages/{id}/schedules; DELETE /schedules/{id}|
|**Servers**|GET /guilds, /guilds/{id}/channels, /guilds/{id}/roles, /emojis|
|**Personas**|GET/POST /guilds/{id}/personas; DELETE /personas/{id}|
|**Tools**|GET /guilds/{id}/backup; POST /guilds/{id}/import; GET/POST /guilds/{id}/templates; GET/DELETE<br>/templates/{id}|
|**Owner only**|GET /admin/servers; POST /admin/allow; DELETE /admin/allow/{id}; DELETE /admin/pending/{id}|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 9 of 37 

### **4.6 Findings from the review (the to-fix list)** 

|**#**|**Finding**|**Risk**|**Fixed in**|
|---|---|---|---|
|**1**|No Content-Security-Policy; all JS/CSS inline in one<br>3,077-line file.|An XSS bug could run attacker code and<br>steal the token.|Phase 0|
|**2**|48 uses of innerHTML, not yet audited.|XSS if any interpolation misses esc().|Phase 0|
|**3**|JWT is kept in localStorage; no logout revocation.|Stolen token works until it expires (12 h).|Phase 0|
|**4**|Layout validation is hand-written (v_* functions), not a<br>strict schema.|A crafted request might store something<br>the bot rejects later.|Phase 0|
|**5**|Rate limiter reads the LAST value of<br>X-Forwarded-For.|Correct only if the host's proxy appends<br>the real client IP; unverified.|Phase 0|
|**6**|send.js is unused dead code; README is empty.|Confusion; extra attack surface.|Phase 0 / 8|
|**7**|No database indexes. The library badge ("changed<br>since posted") loads two full layouts per posted<br>message.|Slow library and wasted reads as data<br>grows.|Phase 1|
|**8**|Autosave writes the whole message every few<br>seconds and adds a history version.|Needless writes; history spam.|Phase 1|
|**9**|Everything lives in data.db on a free host.|A host wipe loses all data.|Phase 1|
|**10**|Library cards are all named "Untitled message"; top<br>bar wraps to 3 rows; tree labels are cut off.|Hard to use, especially on phones.|Phase 2|
|**11**|Only one responsive breakpoint (900 px).|Phone layout is rough.|Phase 2|
|**12**|The preview shows the bot as "Griedon Embeds"<br>while the logo says 9 NATION.|Branding mismatch (set in the bot's<br>Discord profile, not the dashboard).|Owner task|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 10 of 37 

## **5. Patch delivery rules (the new way of working)** 

The owner can edit files by hand but must not be asked to retype big files. A **patch** is a tiny, exact instruction: _find this text, change it to that_ . Version 1 insisted on whole files because in-place edits once caused indentation crashes in Python. The rules below remove that risk, so patches are now allowed. 

### **5.1 The seven rules** 

1. **Ask first.** Before writing a patch, ask the owner to paste the CURRENT version of the function or section you will change (especially for dashboard/index.html, which the owner has hand-edited). Never patch from memory. 

2. **One change per patch.** Give each patch an ID (for example P-1.1) and a plain-English title. Patches are applied in order; never skip one. 

3. **Always say where.** Name the repo, the exact file path, and the action. Tell the owner how to find the spot (the Find text must appear **exactly once** in the file). 

4. **Show indentation.** Python is sensitive to spaces. Put every code block in a box that keeps its spaces, state the number of leading spaces (Python files use 4 spaces per level, never tabs), and tell the owner to paste the block at that same column. 

5. **Prefer whole-function replacement** for anything longer than about 6 lines: 'select from the def line down to the line before the next def and replace it with this'. This avoids half-edited blocks. 

6. **Say how to check it.** After each patch (or small group) give a one-line 'it should now look like...' check, then the Commit / Stop / Start / test steps. 

7. **Whole file when needed:** new files; rewrites of more than about 40% of a file; the file split in Phase 0; or when a patch cannot be made unambiguous. Say so and explain why. 

### **5.2 Patch types** 

|**Type**|**What the owner does**|**Use when**|
|---|---|---|
|**REPLACE**|Find the exact old text, select it, paste the new text over it.|Changing a few lines.|
|**INSERT BEFORE /**|Find the anchor line, put the cursor at its start (before) or end|Adding lines without removing any.|
|**AFTER**|(after), paste the new lines.||
|**DELETE**|Find the exact text and remove it.|Removing dead code (for example<br>send.js).|
|**REPLACE FUNCTION**|Select from the function's first line to the line before the next<br>function; paste the new function.|Anything longer than about 6 lines.|
|**NEW FILE**|Create the file at the given path and paste the whole content.|A file that does not exist yet.|



### **5.3 Required patch layout** 

```
PATCH P-1.1 - Add database indexes
Repo: griedon-embeds          File: db.py           Action: INSERT BEFORE
Why:  makes library, schedules and history queries fast.
```

```
FIND (appears once, inside init_db, 8 spaces of indentation):
        cols = {r["name"] for r in conn.execute("PRAGMA table_info(messages)").fetchall()}
INSERT these lines directly ABOVE it (also 8 spaces):
        conn.execute("CREATE INDEX IF NOT EXISTS idx_messages_guild ON messages(guild_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_versions_message ON versions(message_id, id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_schedules_due ON schedules(active, next_run)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_schedules_message ON schedules(message_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_templates_guild ON templates(guild_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_personas_guild ON webhook_personas(guild_id)")
CHECK: the new lines line up with the 'cols = ...' line below them.
THEN:  Commit changes -> Bot-Hosting: Stop, then Start.
TEST:  1) console shows 'Online as ...' and 'API listening on port ...'  2) library opens normally.
```

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 11 of 37 

**Worked example, ready to use.** P-1.1 above is a real patch checked against the current db.py. The table button_uses is not in the list because its primary key (message_id, component_id, user_id) already acts as an index. 

### **5.4 Tips for editing on a phone** 

- In the GitHub web editor, tap the pencil icon on the file. If searching is awkward, switch the browser to 'Desktop site'. 

- Use REPLACE FUNCTION patches on a phone: you only need to find the function's first line and the next function's first line. 

- After pasting, check the first and last pasted line in the editor before pressing Commit. Make sure no line starts one space too far left or right. 

- Before any change that touches the database structure, download data.db from the Bot-Hosting file manager first. 

- If the bot crashes after a patch: open the file on GitHub, click History, open the previous commit's file and copy it back (or press Revert on the commit). Then Stop/Start and send the last console lines. 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 12 of 37 

## **6. Fix first: the two issues the owner reported** 

### **6.1 'Testers can edit the website with Inspect'** 

**What to tell the owner and the testers.** Anything that runs in a browser can be inspected and changed by the person using it. Those edits only change that person's own open tab; they are never sent to the server and a refresh undoes them. It is not a hack. Example: a tester can unhide the owner-only Servers button, but the API still refuses them because /admin/* checks the owner ID on the server. 

Trying to block Inspect (disabling right-click or F12, obfuscating code) does NOT make a site safer, is trivially bypassed, and annoys honest users. **Do not build it.** Real safety comes from the server never trusting the browser. The work is listed as Phase 0 steps 0.2 to 0.9 in Section 7 and summarised here: 

|**#**|**Fix**|**Why it matters**|**State**|
|---|---|---|---|
|**1**|Server-side authorization audit with a written test list<br>(logged-out, normal user, non-admin, admin of<br>approved server, owner).|Proves every route refuses what it should.|**OPEN**|
|**2**|Strict schema validation (pydantic) for the layout.|A modified page must not store anything the<br>bot would not accept.|**PARTLY**|
|**3**|Rate limits and size limits per user and per IP.|Stops floods and huge bodies.|**DONE**|
|**4**|XSS defence: audit innerHTML, split JS/CSS out of<br>index.html, add a Content-Security-Policy meta tag.|Best browser-side protection; GitHub Pages<br>cannot send headers, so a meta tag is used.|**OPEN**|
|**5**|Token handling: 12-hour life (done), logout<br>revocation, later an HttpOnly cookie on<br>api.nation9.me if Bot-Hosting allows a custom<br>domain.|Removes the token from JavaScript entirely.|**PARTLY**|
|**6**|Login CSRF: nonce bound to the browser that<br>started the login.|Stops forced logins.|**DONE**|
|**7**|Secrets check: nothing committed to either repo;<br>rotate if in doubt.|A leaked token means full control of the bot.|**OPEN**|
|**8**|Audit log of posts, updates, deletes and permission<br>failures.|Traceability (Phase 8).|**OPEN**|



### **6.2 'Visiting nation9.me/dashboard shows a harmful-site warning'** 

**First identify WHICH warning.** Ask the owner for a screenshot of the whole red page and the small error code under it. There are two very different causes. 

#### **A. 'Your connection is not private' or 'Not secure'** 

This is a certificate (HTTPS) problem, not malware. Fix in this order: 

1. **Namecheap Advanced DNS:** remove parking, URL-redirect and any extra records for @. Keep only four A records for @: `185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153` (optionally the AAAA set `2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153` ), plus a CNAME www pointing to `sebA2675.github.io` . Extra A, AAAA, ALIAS or ANAME records on @, or stray CNAMEs, can stop the certificate from being created. Never mix an ALIAS with the A records. 

2. **GitHub repo SebA2675.github.io** -> Settings -> Pages: custom domain nation9.me, wait for the green check, then tick **Enforce HTTPS** (can take up to 24 hours; if stuck, remove the domain, save, and add it back). 

3. Always share `https://nation9.me/dashboard/` , never an http:// link. 

- **B. 'Dangerous site' or 'Deceptive site ahead'** 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 13 of 37 

This is Google Safe Browsing (or Microsoft SmartScreen) flagging the site as possible phishing. A brand-new domain with a 'Log in with Discord' page can trigger it automatically. 

1. Verify nation9.me in **Google Search Console** (a DNS TXT record in Namecheap) and open **Security Issues** . It says whether the site is flagged and shows example URLs. Google's Safe Browsing site-status check shows it too. 

2. **Reduce phishing look-alikes:** clear own branding (name, logo); no Discord logo or Discord-copy styling on the login button; real **About, Privacy and Terms** pages that say who runs the tool and what is collected (a Discord ID check only; no message content about users stored). Fill in the app name, icon, description and the Terms and Privacy URLs in the Discord Developer Portal. 

3. The page must never ask for a password or token. The token in the URL fragment after login is a signed pass, but the pattern can look odd, so the cookie approach (6.1 item 5) also helps. 

4. In Search Console press **Request a review** and describe the fix. Reviews take a few days; once approved, warnings usually disappear within about 72 hours. A false positive can also be reported at google.com/safebrowsing/report_error/. Do not resubmit while a request is pending. 

5. If only some browsers warn (Edge, Opera, school or work filters), submit the site to that vendor's false-positive form. 

#### **Copy-paste message for testers** 

```
Hi! If you open the browser's Inspect tool you can change how the page looks on YOUR screen only.
Nothing you change is sent to the server and a refresh puts it back. The server checks your
Discord account and permissions on every request, so editing the page cannot give you access.
```

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 14 of 37 

## **7. Roadmap: build in this order** 

Each phase ships and is tested alone. Effort: S = under an hour, M = a session, L = several sessions. The phases were renumbered in version 2; this table maps them to version 1 so nothing is lost. 

|**V2 phase**|**Content**|**Was in V1**|
|---|---|---|
|**0**|Security hardening, file split, browser-warning fix|Phase 0|
|**1**|Database speed, nightly backup, cleanup (NEW)|Phase 6 (backup)|
|**2**|Dashboard polish: Website looks and library handling|Phase 2 (design)|
|**3**|Editor power tools: raw JSON, variables, pickers, multi-send, fill-in templates,<br>paginated embeds, imports|Phase 1 (leftovers), 5<br>(variables), 7|
|**4**|Website flow and onboarding: landing, legal pages, request access, server<br>picker, workspace, tour, guides|Phase 2 (website flow)|
|**5**|Sending, scheduling and webhooks|Phase 3, 5 (scheduler)|
|**6**|Interactions and forms (without tickets, polls, role groups)|Phase 4|
|**7**|Automation: welcome/goodbye, keyword replies, custom and slash<br>commands, feeds, sticky, triggers|Phase 5, 3|
|**8**|Management, teamwork and safety|Phase 6|
|**9**|Extras backlog|Phase 7|



### **Phase 0 - Security hardening and the browser warning** 

|**Status**|**Effort**|**Goal**|
|---|---|---|
|**PARTLY**|M|Make a modified browser unable to harm the server or other users, and remove the harmful-site /|
|||certificate warning. Details of the two reported issues are in Section 6.|



#### **Steps** 

1. **0.1 Explain Inspect** to the owner and testers with the message in Section 6.1. 

2. **0.2 Route audit.** Make a table of every route (Section 4.5) against five callers: logged-out, normal user, non-admin of an approved server, admin of an approved server, owner. Write what each should return (401/403/200). Test with a second Discord account and with curl (no token, bad token). Fix any route that disagrees. Routes with a message id must go through load_message; routes with a server id through require_guild. 

3. **0.3 Strict validation.** Add pydantic models for every block type (extra fields forbidden, string length caps, https-only URLs, numeric IDs, counts inside Discord limits). Replace the v_* functions one block type at a time and keep the old checks until each model is proven. Test by posting broken JSON by hand. 

4. **0.4 Secrets check.** Search both repos' Git history for tokens. If there is any doubt (and for a beginner it is cheaper to just do it), rotate BOT_TOKEN, DISCORD_CLIENT_SECRET and JWT_SECRET in the Developer Portal and host settings. Confirm .env and data.db stay ignored. 

5. **0.5 Verify the rate limiter's IP source.** main.py trusts the last value of X-Forwarded-For. Hit /auth/login 25 times from one phone and confirm the 429 appears; then from a second network confirm it does not. 

6. **0.6 Split index.html** into index.html, styles.css and app.js (whole new files; this is the one allowed big delivery). Delete the unused send.js. Keep API_URL as the first line of app.js. Test every view after the split. 

7. **0.7 innerHTML audit.** List all 48 uses. Each interpolated value must go through esc() or be a constant; replace risky ones with DOM building or textContent. Test by saving a message with `<img src=x onerror=alert(1)>` in every text field, name, button label and form question: no alert may ever fire. 

8. **0.8 Content-Security-Policy** meta tag in index.html (after the split). Suggested start: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src https: data:; connect-src the API origin only; font-src 'self'; base-uri 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 15 of 37 

'none'; form-action 'none'. Inline style attributes need 'unsafe-inline' for styles only; scripts stay strict. Keep a copy of the working file; open the browser console and fix every violation message. 

9. **0.9 Token handling.** Add logout revocation (a per-user 'tokens valid after' timestamp checked in require_user, set on logout and 'log out everywhere'). Optional later: API on api.nation9.me with an HttpOnly, Secure, SameSite cookie plus an Origin check (decision 2, Section 10). 

10. **0.10 Public legal pages.** Three small static pages (About, Privacy, Terms) on the site, and the same URLs in the Discord Developer Portal app settings. Needed for the Safe Browsing review. State plainly: who runs it, that only the Discord user ID and server permissions are checked, what is stored (saved messages) and how to delete it. 

11. **0.11 Fix the browser warning** using Section 6.2 (identify it first; certificate steps or Safe Browsing review). 

The file split and CSP are the riskiest steps because they touch the whole page. Do 0.6, test, commit; then 0.7; then 0.8 last, with a backup copy. 

#### **Files touched** 

Bot repo: main.py, routes.py, access.py, db.py (revocation table), requirements.txt (pydantic is already installed with FastAPI). Site repo: dashboard/index.html, styles.css, app.js, new legal pages, delete send.js. 

#### **Acceptance test (give the owner this as a numbered checklist)** 

1. A logged-out visitor gets 401 on every route except /health and /auth/*. 

2. A normal user and a non-admin get 403 on /admin/* and on other servers' data; the owner gets 200. 

3. The XSS test string never fires an alert; the browser console shows no CSP violations in library, builder, send, schedule, history and server tools. 

4. A clean browser and a phone open https://nation9.me/dashboard/ with no certificate or Safe Browsing warning. 

5. Logging out makes the old token return 401. 

### **Phase 1 - Foundations: database speed, backup and cleanup** 

|**Status**|**Effort**|**Goal**|
|---|---|---|
|**NEW**|M|Make the library and button clicks cheap, and make sure a host wipe cannot lose the data.|
|||Background and numbers are in Section 8.|



#### **Steps** 

1. **1.1 Indexes** (patch P-1.1 in Section 5.3). 

2. **1.2 WAL mode** (optional): add `conn.execute("PRAGMA journal_mode=WAL")` in connect() before the return, and add data.db-wal and data.db-shm to .gitignore. WAL lets reads and writes overlap. If the host complains, remove the line again. 

3. **1.3 Layout hash.** Add a column layout_hash to messages (migration that defaults to empty). When a message is posted or updated, store a short hash of its layout as 'posted hash'. The library badge then compares two short strings instead of loading and comparing two full layouts. Update to_dict/is_changed accordingly. 

4. **1.4 Smarter autosave** (dashboard): save only when something really changed, wait about 6 seconds after typing stops, and create a history version only on manual Save or Send (autosave overwrites the draft). 

5. **1.5 Click cache** (interactions.py): keep a message's parsed layout in memory for about 60 seconds so a burst of clicks reads the database once; clear that entry whenever the message is saved or deleted. 

6. **1.6 Nightly backup.** Once a day, inside the scheduler loop, copy the database with SQLite's backup function to a temporary file and upload it to a private GitHub repo with the contents API, using a fine-grained token kept in host settings (GITHUB_BACKUP_TOKEN). Keep the last 14 copies. Never log the token. 

7. **1.7 Cleanup job** (daily): delete button_uses rows for deleted messages; later also old audit-log rows and form responses beyond their caps. Never delete live once-per-person records. 

8. **1.8 Size meter:** show data.db size in the owner Servers page so growth is visible. 

#### **Files touched** 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 16 of 37 

Bot repo: db.py, interactions.py, scheduler.py, routes.py (size meter), .gitignore. Site: autosave logic in app.js. 

#### **Acceptance test (give the owner this as a numbered checklist)** 

1. Library with 20+ messages opens quickly and the 'changed since posted' badge is still correct after editing and after posting. 

2. Typing for a minute creates no new history rows until Save is pressed. 

3. Twenty rapid clicks on a cooldown button produce one database read burst, and the cooldown still works. 

4. A backup file appears in the private repo after the nightly run (test by triggering it manually once). 

5. Restoring that backup into a fresh data.db brings the library back. 

**Phase 2 - Dashboard polish: Website looks and library handling** 

|**Status**|**Effort**|**Goal**|
|---|---|---|
|**PLANNED**|M|Keep the cream design (dark labels, no purple). Do a polish pass based on real phone and|
|||desktop screenshots, not a rebuild. The editor structure (tree, preview, settings) is already good.|



#### **Steps** 

1. **2.1 Top bar.** One compact row: Back, name, server, then a group of icons (Undo, Redo, Template, History, Schedule), then status chips, then Saved (quiet text, not a button) and Send. Put the rest in a '...' menu. Give 'DM me' a different icon from 'Send' and add labels to icon-only buttons on phones. 

2. **2.2 Tree rows.** Show arrows, duplicate and delete only on the selected or hovered row so labels stop being cut off ('Divider sm...', 'Text + sid...'). 

3. **2.3 Settings panel.** Make the text box grow with its content, keep the formatting toolbar on one row (move rarely used buttons such as || and -# into a 'more' menu), and place the floating toolbar so it never covers the selected text. 

4. **2.4 Layout.** Give the preview more width, make the three panels fill the screen height and scroll separately, and add more breakpoints (the page has only one at 900 px). 

5. **2.5 Library cards.** Title from the first heading when the name is still 'Untitled', a small preview thumbnail, coloured Draft / Posted / Changed badges instead of grey text, delete tucked in a '...' menu, one 'New' button that asks Layout or Classic, and a 2-3 column grid on desktop. 

6. **2.6 Feedback.** Toasts instead of alert/confirm/prompt, empty states, loading skeletons. 

7. **2.7 App feel.** Installable PWA (manifest, icons), keyboard shortcuts, an accessibility pass (focus rings, contrast, button names). 

#### **Files touched** 

Site repo only: styles.css and app.js (patches after the Phase 0 split) and index.html. 

#### **Acceptance test (give the owner this as a numbered checklist)** 

1. On a phone the top bar is at most two rows and the preview starts above the fold. 

2. Every library card is distinguishable at a glance and shows its status by colour. 

3. Selecting a tree row reveals its actions; long labels are readable. 

4. No browser alert() or confirm() pop-ups remain. 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 17 of 37 

### **Phase 3 - Editor power tools** 

|**Status**|**Effort**|**Goal**|
|---|---|---|
|**PLANNED**|L|Add the features power users expect from other embed builders. Design notes for the trickier|
|||ones are in Section 9.|



#### **Steps** 

1. **3.1 Variables engine** (do this first; Phase 7 depends on it). One server-side function fills variables such as user, server, channel and date; each message type (normal, welcome, reply, keyword) has its own allowed list. Choose ONE naming style and never change it (suggested: dotted names like {user.mention}, {server.member_count}). 

2. **3.2 Variables panel and playground.** Click-to-copy list showing only variables valid for the current message, plus a preview toggle 'as sample member' (Section 9.1). 

3. **3.3 Raw JSON tab** next to Visual: view and edit the layout JSON; validate on switching back with the same server rules. 

4. **3.4 Pickers** in the text settings: mention (user/role), channel, emoji, and Discord timestamp ( `<t:UNIX:R>` ). 

5. **3.5 Role picker / role button parts:** one-click parts that add a button row or dropdown with the role action pre-filled. 

6. **3.6 Multi-message send** ('Sequence'): post several saved messages to a channel in order, with a short delay (Section 9.3). 

7. **3.7 Fill-in-the-blank templates:** templates with named slots ({slot.event}); using one opens a small form, then creates the message (Section 9.2). 

8. **3.8 Paginated embeds:** one message with Prev/Next buttons that switch pages (Section 9.4). 

9. **3.9 Imports:** Discohook JSON and Embed Generator JSON; import from a Discord message link (bot must be able to read the channel; map classic embeds directly and V2 components block by block; keep unknown parts read-only). 

10. **3.10 Classic embed checks:** total 6,000 embed characters and per-field limits in the problems list; verify the classic editor covers author, fields, footer, timestamp, image and thumbnail. 

11. **3.11 Share draft link:** read-only preview link with a random token and an expiry (Section 9.5). 

12. **3.12 Images:** start with 'paste an https image URL' plus a link checker; uploads wait for decision 7 (Section 10). 

#### **Files touched** 

Bot repo: routes.py, builder.py, db.py (slots, groups, share links), new variables.py. Site: app.js and styles.css. 

#### **Acceptance test (give the owner this as a numbered checklist)** 

1. A welcome-type message shows {user.mention} filled with a sample member in the playground, and the real variable list differs from a normal message's list. 

2. Switching Visual to Raw and back preserves the message; invalid JSON is refused with a clear reason. 

3. A sequence of three messages posts in order with no rate-limit error. 

4. A template with two slots creates a correct message from the form. 

5. Clicking Next on a paginated message changes the page for everyone (and Prev returns). 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 18 of 37 

### **Phase 4 - Website flow and onboarding** 

|**Status**|**Effort**|**Goal**|
|---|---|---|
|**PLANNED**|L|A visitor understands what the tool is, asks for access, logs in, picks a server and finds their way,<br>without the owner explaining anything.|



#### **Steps** 

1. **4.1 Landing page** at nation9.me/embeds/ (or embeds.nation9.me through a DNS CNAME; decision 1): logo, one-paragraph explanation, Log in with Discord, Request access, links to Help, Privacy, Terms and Status. The owner's portfolio stays untouched. 

2. **4.2 Request access.** A form (server ID, server name, Discord username) that stores a row in a new access_requests table; the owner sees it on the Servers page and can approve. No login needed, so it must be rate-limited per IP, length-capped and never echo input back unescaped. 

3. **4.3 Server picker** after login: cards with server icon, name, message count, last edit and bot status. /guilds should also return icon URL and counts. Remember the last server; add search and favourites for people in many servers. 

4. **4.4 Per-server workspace** with a left server rail and tabs: Messages, Templates, Schedules, Webhooks, Responses, Activity, Settings. The library becomes a grid of cards with folders, tags, search and bulk actions (copy to another server, delete, export). 

5. **4.5 First-run tour** (4-5 short steps) and **in-app guides** : Formatting, Buttons, Roles, Forms, Threads, Backups. Plain language, with a screenshot each. 

6. **4.6 Starter template gallery:** rules, welcome, FAQ, announcements, roles, tickets-free support info. 

7. **4.7 Status page** using /health (bot online, last error time). 

8. **4.8 Optional link-preview card:** Discord now lets a web page define how its shared link looks using a Components V2 payload in the page. Check Discord's current developer docs before building; it is small and free. 

#### **Files touched** 

Site repo: new landing/legal/status pages, app.js, styles.css. Bot repo: routes.py (guild counts, access_requests), db.py. 

#### **Acceptance test (give the owner this as a numbered checklist)** 

1. A user in 20 servers lands on the picker, opens one, and only sees that server's content. 

2. Request access stores one row and the owner can approve it; 30 rapid submissions from one device are rate-limited. 

3. A brand-new visitor can find Help, Privacy and Terms from every page. 

### **Phase 5 - Sending, scheduling and webhooks** 

|**Status**|**Effort**|**Goal**|
|---|---|---|
|**PARTLY**|L|Reliable delivery to the right place at the right time, with clear errors.|



#### **Steps** 

1. **5.1 Permission checker:** before sending, show what the bot lacks in the chosen channel (View, Send, Embed Links, Manage Webhooks, Manage Roles) and why a send failed (a readable reason, not a stack trace). 

2. **5.2 Forum channels and threads:** thread name, tags, posting into an existing thread (webhook persona sending already exists). 

3. **5.3 Multi-channel send** and **announcement helper** (post, ping a chosen role, publish in announcement channels in one action). Mention control: choose exactly which roles may be pinged; keep @everyone off by default. 

4. **5.4 Webhook manager per channel:** list, create, delete (needs Manage Webhooks) and a persona library per channel. Explain the limit in the UI: webhooks owned by the bot can use all components, other webhooks only get 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 19 of 37 

non-interactive ones such as link buttons. 

5. **5.5 Scheduler upgrades:** repeats every N minutes/hours/months, rotating messages (a different saved message each run), queues, per-server time zone, pause/resume all, calendar view, a DM reminder before a run, retry with a clear failure reason. 

6. **5.6 Silent send and suppress link previews** options. 

7. **5.7 Trigger URLs** (only if decision 6 allows): an unguessable per-message endpoint with a secret that lets an outside service POST JSON variables and post a templated message. Rate-limited, revocable, logged, and the posted text goes through the same escaping as everything else. 

#### **Files touched** 

Bot repo: webhooks.py, scheduler.py, timeutil.py, routes.py, db.py. Site: send and schedule overlays. 

#### **Acceptance test (give the owner this as a numbered checklist)** 

1. Sending to a channel without permission shows exactly which permission is missing. 

2. A message posts into a forum channel with a thread name and into an existing thread. 

3. A rotating schedule posts message A then B on consecutive runs. 

4. A trigger URL posts a message with curl; after revoking it, the same curl is refused. 

### **Phase 6 - Interactions and forms** 

|**Status**|**Effort**|**Goal**|
|---|---|---|
|**PARTLY**|L|Make buttons, dropdowns and forms smarter while staying inside the embed-bot scope. Tickets,|
|||polls, giveaways and role groups are not part of this phase.|



#### **Steps** 

1. **6.1 Actions list:** replace the single action with an ordered list (role, reply, DM, post message, open form), migrating old data so every existing button keeps working. Discord answers interactions within 3 seconds, so defer for longer work. 

2. **6.2 Rules:** required roles, cooldown, once per person, max uses, expiry date, private or public reply (the first three are built). 

3. **6.3 Conditions:** 'if the user has role X do this, else that'. 

4. **6.4 Click counters** per button (store counts only, not who). 

5. **6.5 Form responses:** new form_responses table, a Responses tab in the dashboard, CSV export, a cap per form (for example 5,000) and optional auto-delete after N days. 

6. **6.6 Accept / Deny:** buttons on each response that DM the user and grant a role; only people with editor access can press them. 

7. **6.7 Form upgrades:** optional questions, min/max length, number-only, a dropdown question where Discord's modal support allows, an echo of the answers back to the user, one submit per user per day. 

8. **6.8 Role-menu limit:** 'pick up to N' inside a single role dropdown (a small embed-related feature, not a role-group system). 

#### **Files touched** 

Bot repo: interactions.py, forms.py, builder.py, db.py, routes.py. Site: button/dropdown settings, new Responses tab. 

#### **Acceptance test (give the owner this as a numbered checklist)** 

1. A cooldown button refuses a second click and says when to try again. 

2. A form submission appears in the Responses tab and in the CSV export. 

3. Pressing Accept DMs the user and grants the chosen role; pressing it as a non-editor is refused. 

4. Old messages with the single-action format still work after the migration. 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 20 of 37 

### **Phase 7 - Automation** 

|**Status**|**Effort**|**Goal**|
|---|---|---|
|**PLANNED**|L|Messages that appear in response to events, using the same editor and variables as everything|
|||else. Needs two Developer Portal toggles (Appendix D).|



#### **Steps** 

1. **7.1 Welcome and goodbye:** pick a saved message and a channel per server; uses the variables engine (Phase 3.1). Needs the **Server Members intent** (toggle in the Developer Portal; a verification requirement applies only at 100 servers). 

2. **7.2 Keyword auto-replies:** trigger word or phrase to a saved message (optional channel, cooldown per channel). Needs the **Message Content intent** . Keep the keyword list in memory so no database read happens per chat message; refresh it when rules change. 

3. **7.3 Custom commands:** slash commands that reply with a saved message (no message-content intent needed). Register per server; keep the number small. 

4. **7.4 Built-in slash commands:** /embed send, /embed list, and a message context-menu command 'Edit in dashboard'. Optional: right-click Restore/Dump message, /message (get JSON), /format, /help from saved FAQ messages. 

5. **7.5 Feeds:** RSS, YouTube channel feeds and Reddit feeds rendered through a chosen template with {title}, {link}, {author}. Check every 10-15 minutes, remember only the last item seen per feed, and cap feeds per server. Reddit may throttle hosting IPs: show a clear error and do not retry aggressively. Needs a feed-parsing library in requirements.txt. 

6. **7.6 Sticky messages** (only if decision 8 allows): repost at the bottom after new messages with a delay of a few seconds after the last message, so a busy channel causes few writes. 

7. **7.7 Safety for all automation:** allowed_mentions always restricted, every automated post logged (Phase 8), per-server on/off switch and rate caps. 

Do not turn on the Members or Message Content intent until this phase; both must also be enabled in code (discord.Intents) as well as in the Developer Portal. 

#### **Files touched** 

Bot repo: main.py (intents, events), new automation.py, db.py, requirements.txt. Site: Automation tab. 

#### **Acceptance test (give the owner this as a numbered checklist)** 

1. A new member produces the welcome message with their name filled in; leaving produces the goodbye. 

2. A keyword reply fires once per cooldown and never pings @everyone. 

3. A custom slash command replies with the chosen saved message. 

4. A test RSS feed posts its newest item once and does not repeat it after a restart. 

### **Phase 8 - Management, teamwork and safety** 

|**Status**|**Effort**|**Goal**|
|---|---|---|
|**PLANNED**|M|Know who did what, recover from mistakes, and let trusted people help without giving them<br>Administrator.|



#### **Steps** 

1. **8.1 Audit and activity log:** who posted, edited, deleted, scheduled or failed, and when; a failure alert (DM or channel) and an error page. Cap the log by age (for example 90 days). 

2. **8.2 Per-server settings and brand kit:** default colour, footer, logo, webhook identity, time zone, saved colour palette; apply to every new message in one click. 

3. **8.3 Trash:** deleted messages go to trash for 30 days with a Restore button. 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 21 of 37 

4. **8.4 Editor roles** beyond Administrator (decision 4) and an optional approval flow: draft, review, approve, post. Comments and 'someone is editing' locking if teams use it. 

5. **8.5 Bulk tools:** search-and-replace across all messages (for example change an invite link everywhere), bulk copy to another server with role/channel remapping, bulk recolour. 

6. **8.6 Usage meters and status:** messages, schedules, storage used against the caps; a status page and a maintenance banner. 

7. **8.7 Data rights:** an owner/server 'export my data' and 'delete my data' button (supports the Privacy page); archive then delete a server's data when the bot leaves. 

8. **8.8 Housekeeping:** fill in README.md with setup steps, the settings list and the update routine. 

#### **Files touched** 

Bot repo: db.py (audit_log, trash, server_settings), routes.py, access.py. Site: Activity and Settings tabs. 

#### **Acceptance test (give the owner this as a numbered checklist)** 

1. Every post, edit and delete shows in Activity with the user and time. 

2. A deleted message can be restored within 30 days and not after. 

3. A user with the editor role can edit but not post or delete (if that rule is chosen). 

4. 'Delete my data' leaves no rows for that server. 

### **Phase 9 - Extras backlog (pick when the rest is stable)** 

|**Status**|**Effort**|**Goal**|
|---|---|---|
|**PLANNED**|S-L each|Nice-to-have items. Build only on request and one at a time. The complete list is in Appendix A.|



#### **Steps** 

1. Image library with free hosting (Discord file links expire), file attachments (watch the 512 MB storage), export preview as an image. 

2. Developer features: API keys, outgoing webhooks on clicks/submits, published JSON schema, debug view showing the exact payload sent to Discord. 

3. Analytics-lite: post history, button click counts, form submissions per day, most-used templates. 

4. Dashboard language options, a changelog / 'What's new' popup, command palette (Ctrl+K), accessibility improvements. 

5. Countdown cards, rotating quote/tip of the day, server info card, staff-list embed. 

#### **Files touched** 

Depends on the item. 

#### **Acceptance test (give the owner this as a numbered checklist)** 

1. Each item gets its own short acceptance checklist when it is scheduled. 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 22 of 37 

## **8. Database load, speed and backups** 

SQLite handles this project easily at its current size. The goal is to keep the heavy paths cheap before data grows, and to make sure a free-host wipe cannot destroy it. 

### **8.1 What loads the database** 

|**Load point**|**Today**|**Fix**|**Phase**|
|---|---|---|---|
|**Opening the**<br>**library**|For each posted message the 'changed' badge<br>loads the message and its latest version, then<br>compares both full layouts (about 3 reads<br>each).|Store and compare a short layout hash.|1.3|
|**Autosave**|Rewrites the whole message (up to 200 KB),<br>adds a history version, then trims old versions.|Save only real changes, wait longer,<br>version on manual Save/Send.|1.4|
|**Button and menu**<br>**clicks**|Each click loads the message and checks and<br>records use.|60-second in-memory cache; record a use<br>only for buttons that have a rule.|1.5|
|**Scheduler**|One small query every 30 seconds (about<br>2,900 per day).|Index on (active, next_run).|1.1|
|**Opening one**<br>**message**|Loads the full layout once.|Fine as is.|-|



**Features that will add load:** form responses (a write per submit), sticky messages (a write per new channel message), welcome/goodbye on busy servers, keyword replies (a lookup per chat message), feed checks, the audit log, and any stored images. **Light ones:** templates, personas, settings and the approved-server list. 

### **8.2 The fixes in order** 

1. Indexes (patch P-1.1). 

2. Layout hash for the 'changed' badge. 

3. Smarter autosave. 

4. Click cache. 

5. Caps and cleanup: keep the last 20 versions per message (done), cap form responses, expire audit logs after about 90 days, and run one daily cleanup job in the scheduler loop. 

6. Nightly backup of data.db to a private GitHub repo (Phase 1.6) and WAL mode (optional). 

7. For future features: in-memory keyword list, a few seconds' delay for sticky reposts, feeds every 10-15 minutes, a cap on responses per form with CSV export. 

### **8.3 SQLite or Cloudflare D1?** 

**Recommendation: stay on SQLite plus nightly backups for now, and keep ALL database code inside db.py** so a later move stays small. Move to D1 only if you outgrow the host or want the data to survive it. 

|**Question**|**Answer**|
|---|---|
|**Can we move later?**|Yes. D1 is SQLite-based, so tables and queries port almost as they are, and from the review<br>db.py is the only place that touches SQLite.|
|**Why is it not a flip of a switch?**|The bot runs on Bot-Hosting, outside Cloudflare, so it would call D1 over HTTPS (the<br>Cloudflare REST API or a small Worker). Every query becomes a network call, db.py would<br>need rewriting from synchronous to asynchronous calls, reads become slower than a local<br>file, and the data needs a one-time migration.|
|**Free limits (Cloudflare docs,**<br>**checked 23 Nov 2026)**|5 million rows read per day, 100,000 rows written per day, 5 GB storage. Since 1<br>September 2026 queries on the free plan fail once a daily limit is passed, until midnight<br>UTC. Always re-check the current numbers before moving.|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 23 of 37 

|**Question**|**Answer**|
|---|---|
|**Would the limits be a problem?**|Very unlikely at this size, as long as the scheduler query is indexed. An unindexed query<br>scans the whole table and every scanned row counts as a read.|
|**Real reason to move**|Safety, not speed: if the free host loses its files, data.db goes with it. Nightly backups give<br>most of that protection for free.|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 24 of 37 

## **9. Design notes for the harder features** 

Short build guidance so the next developer does not have to invent it. Each note ends with the safety rule that matters most. 

### **9.1 Variables engine and playground (Phase 3.1-3.2)** 

- A new variables.py with one table of allowed variables per message type (normal, welcome, reply, keyword) and one render(text, context) function. Unknown {names} are left untouched. 

- Starter list: user.mention, user.name, user.display_name, user.id, user.avatar, server.name, server.icon, server.member_count, channel.mention, channel.name, date, time, timestamp. 

- The dashboard shows only the variables valid for the message being edited, click-to-copy. The playground renders the preview with a sample member and server. 

- **Safety:** insert values as plain text only; escape markdown in usernames (discord.utils.escape_markdown); mentions only pass through allowed_mentions, never from raw user text; never let a variable value create a new @everyone. 

### **9.2 Fill-in-the-blank templates (3.7)** 

- Add slots to a template: [{key, label, default, type}] where type is text, number, date, role or channel. The layout text contains {slot.key}. 

- 'Use template' opens a small form built from the slots; the filled result goes through the normal check_layout before it is saved as a message. 

### **9.3 Multi-message send / sequences (3.6)** 

- New table message_groups(id, guild_id, name, ids_json) and a route POST /groups/{id}/post with a channel. The SERVER loops with a delay of about one second, so the browser tab can close. 

- Stop at the first failure and report which item failed; store each posted message ID so the items stay editable. Cap a group at about 10 items. 

### **9.4 Paginated embeds (3.8)** 

- Add pages to a message (each page is a list of blocks). The builder adds a button row Prev / 'Page 2/5' (disabled) / Next with custom_id like m:{id}:pg:{n}; interactions.py rebuilds the message for page n. The page lives in the custom_id, so no database writes are needed. 

- Decide between a SHARED message (everyone sees the page change) and a private per-user view (reply ephemerally with the page). Shared is simpler. 

- The 40-component limit applies per rendered page. 

### **9.5 Share draft link (3.11)** 

- Table share_links(token, message_id, expires_at, created_by). The token is secrets.token_urlsafe(24); default expiry 7 days; the owner or editor can revoke. 

- A public, rate-limited GET /share/{token} returns only the layout, with server-specific IDs removed. A tiny read-only viewer page reuses the dashboard's preview renderer. 

- **Safety:** no login is needed, so this is the only place the API serves layout data publicly: strip IDs, cap the response, rate-limit by IP, log views. 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 25 of 37 

### **9.6 Welcome and goodbye (7.1)** 

- Per-server settings row: enabled, channel, welcome message ID, goodbye message ID. Events on_member_join and on_member_remove (needs the Members intent). Skip bots; fall back to a clear dashboard warning if the channel is missing or the bot cannot send there. 

- **Safety:** allowed_mentions users only; cap per minute so a raid cannot flood the channel. 

### **9.7 Keyword auto-replies (7.2)** 

- Rules: phrase, match type (contains, exact, starts with; case-insensitive), saved message, optional channel, per-channel cooldown; at most about 50 rules per server. 

- Hold the rules in memory; reload only when they change. Ignore bots. **Do not offer regular expressions** (a bad pattern can freeze the bot). 

### **9.8 Form responses and CSV export (6.5)** 

- Table form_responses(id, message_id, form_id, user_id, answers_json, status, created_at) with a per-form cap and optional auto-delete. 

- **Safety:** CSV injection: when exporting, prefix any cell that starts with =, +, - or @ with an apostrophe so spreadsheets do not run it as a formula. 

### **9.9 Feeds (7.5)** 

- Table feeds(id, guild_id, kind, url, channel_id, template_message_id, last_seen, last_check). Use timeouts, a size cap (about 1 MB) and https only. 

- **Safety (SSRF):** the server fetches URLs people type in. Resolve the host first and refuse private, loopback and link-local addresses; limit redirects; cap feeds per server. 

### **9.10 Trigger URLs (5.7)** 

- Store only a hash of the secret (sha256); show the secret once at creation. Accept small JSON, substitute variables into a saved template, never accept raw components from outside. 

- Rate-limit, log every call, allow revoke and rotate. Owner-only first (decision 6). 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 26 of 37 

## **10. Open decisions for the owner (with recommendations)** 

Ask these one at a time when they become relevant. The recommendation is what to do if the owner has no preference. 

|**#**|**Question**|**Recommendation**|
|---|---|---|
|**1**|Landing page at nation9.me/embeds/ or on a<br>subdomain?|Use the /embeds/ path first: no DNS change. A subdomain can<br>come later.|
|**2**|API on a custom subdomain (needed for cookies)?|Only if Bot-Hosting supports custom domains. Otherwise keep the<br>Bearer token with CSP, 12-hour life and logout revocation.|
|**3**|Classic embeds or layout as the default for new<br>messages?|One 'New' button that asks which kind; layout is pre-selected.|
|**4**|Editors beyond Administrator?|Start admin-only; add an editor role in Phase 8.|
|**5**|SQLite plus backups, or Cloudflare D1?|SQLite plus nightly backups (Section 8.3).|
|**6**|Webhook trigger URLs?|Owner-only at first, with the safety rules in Section 9.10; or skip.|
|**7**|Where to host uploaded images for free?|Start with pasted https URLs plus a link checker. Later: the owner's<br>website repo folder (manual) or Cloudflare R2 (check current free<br>limits).|
|**8**|Sticky messages and built-in slash commands:<br>allow?|Allow slash commands that only send, list and edit saved<br>messages. Sticky messages last in Phase 7, optional.|
|**9**|Form Accept/Deny with DM and role?|Yes (the owner kept the form flow); editor access only.|
|**10**|Which phase first?|Phase 0 (security and the warning), then Phase 1 (database and<br>backup).|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 27 of 37 

## **11. Rules for every change** 

### **11.1 The routine** 

1. **Ask** for the current code of the part you will change. 

2. **Deliver** patches in the Section 5 layout (or a whole file where allowed). Name repo and path every time. 

3. **Bot changes:** edit on GitHub, Commit, then in Bot-Hosting press **Stop** , then **Start** . Confirm the console shows 'Online as ...' and 'API listening on port ...'. 

4. **Website changes:** edit on GitHub, Commit, wait about a minute for GitHub Pages, then hard-refresh the dashboard (on a phone: reload twice, or clear the site's data if it still looks old). 

5. **Database changes:** download data.db first; new columns and tables need a migration that defaults them so old data keeps working. 

6. **End** with a numbered test checklist. When something fails, ask for the exact error text and the last lines of the console. 

### **11.2 Standing rules** 

- Never put secrets in code or Git. Never log tokens, secrets or full request headers. 

- Free services only. Keep everything browser-only for the owner. 

- Keep old saved messages working. Never change the custom_id format (m:{message_id}:{component_id}) without a migration, or posted buttons stop working. 

- The server never trusts the browser: validate every field, check the user and the server on every route. 

- One phase at a time; each phase is tested alone before the next starts. 

- Use plain language with the owner. Explain what a step does before asking for it. 

### **11.3 Test checklist template** 

```
TEST CHECKLIST - Phase __ / Patch __
 1. Stop and Start the bot. Console shows 'Online as ...' and 'API listening on port ...'.   [ ]
 2. Hard-refresh the dashboard and log in.                                                    [ ]
 3. (the new thing) Do ______ and expect ______.                                              [ ]
 4. (an old thing) Open an existing message, edit, save, post: still works.                   [ ]
 5. (a bad thing) Try ______ as a normal user: it is refused.                                 [ ]
If anything fails: send me the exact error text and the last 20 console lines.
```

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 28 of 37 

## **Appendix A: The feature catalog, by category** 

Everything discussed so far, grouped the way the owner asked: Website looks, Website onboarding, Website handling, Editor, Bot handling, Safety and hosting. 'Phase' says where it is built in Section 7. Items already built are marked DONE. 

### **A.1 Website looks** 

|**Feature**|**Status**|**Phase**|
|---|---|---|
|**Cream theme, dark/light preview, three-panel builder, phone bottom bar**|**DONE**|-|
|**Undo/redo, drag reorder, duplicate**|**DONE**|-|
|**Split index.html into HTML, CSS and JS files**|**PLANNED**|0|
|**Group the top bar into one compact row plus a '...' menu**|**TOP PICK**|2|
|**Tree row actions shown only on the selected or hovered row**|**TOP PICK**|2|
|**Bigger auto-growing text box; formatting toolbar on one row**|**NEW**|2|
|**Wider preview; full-height panels that scroll separately; more breakpoints**|**NEW**|2|
|**Floating toolbar placed so it never covers the selected text**|**NEW**|2|
|**Labels on icon-only buttons; different icons for DM me and Send; 'Saved' as a**<br>**quiet label**|**NEW**|2|
|**Toasts instead of alert/confirm, empty states, loading skeletons**|**PLANNED**|2|
|**Preview width switch (desktop/phone), keyboard shortcuts, PWA, accessibility**<br>**pass**|**PLANNED**|2|



### **A.2 Website onboarding** 

|**Feature**|**Status**|**Phase**|
|---|---|---|
|**About, Privacy, Terms pages**|**PLANNED**|0|
|**Public landing page with Request access, Help, Status links**|**PLANNED**|4|
|**First-run tour**|**PLANNED**|4|
|**Starter template gallery (rules, welcome, FAQ, announcements)**|**PLANNED**|4|
|**In-app guides (formatting, buttons, roles, forms, threads, backups)**|**NEW**|4|
|**'Import Discohook JSON' button**|**NEW**|3|
|**Playground with a sample member and server**|**NEW**|3|
|**Discord link-preview card for the website (Components V2)**|**NEW**|4|



### **A.3 Website handling (dashboard)** 

|**Feature**|**Status**|**Phase**|
|---|---|---|
|**Library, copy/export/delete, 'changed since posted' badge, version history,**|**DONE**|-|
|**backup/import, templates, owner Servers page**|||
|**Server picker with icons and counts; per-server workspace tabs**|**PLANNED**|4|
|**Folders, tags, search, favourites, bulk actions**|**PLANNED**|4|
|**Library cards titled from the first heading, with thumbnails**|**TOP PICK**|2|
|**Coloured Draft / Posted / Changed badges; one 'New' button; desktop card grid**|**NEW**|2|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 29 of 37 

|**Feature**|**Status**|**Phase**|
|---|---|---|
|**Brand kit: colours, footer, logo per server**|**TOP PICK**|8|
|**Audit/activity log, failure alerts, usage meters, status page**|**PLANNED**|8|
|**Trash with 30-day restore**|**NEW**|8|
|**Search-and-replace across all messages; bulk recolour**|**NEW**|8|
|**Calendar view of schedules**|**NEW**|5|
|**Per-channel overview (what is posted where)**|**NEW**|8|
|**Editor roles, approval flow, comments, edit locking**|**DECIDE**|8|
|**Command palette (Ctrl+K), notifications, recently used**|**NEW**|9|



### **A.4 Editor (building messages)** 

|**Feature**|**Status**|**Phase**|
|---|---|---|
|**Layout blocks: text, text + side, images, divider, box, buttons, dropdown; replies;**<br>**forms**|**DONE**|-|
|**Classic embed editor (limits checker still to verify)**|**PARTLY**|3|
|**Autosave, Edit/Test modes, problems chips, component and character counters,**<br>**formatting toolbar, emoji insert**|**DONE**|-|
|**Raw JSON tab (confirmed missing)**|**TOP PICK**|3|
|**Click-to-copy variables panel valid for the current message type**|**TOP PICK**|3|
|**Mention, channel, role and timestamp pickers**|**NEW**|3|
|**Multi-message send (sequence)**|**TOP PICK**|3|
|**Fill-in-the-blank templates**|**TOP PICK**|3|
|**Paginated embeds with Prev/Next**|**TOP PICK**|3|
|**One-click Role picker and Role button parts**|**NEW**|3|
|**Import from message link; import Discohook / Embed Generator JSON**|**PLANNED**|3|
|**Share draft link (read-only preview)**|**NEW**|3|
|**Link checker (dead or non-https URLs)**|**NEW**|3|
|**Image library with free hosting; file attachments**|**NEW**|9|
|**Colour presets, markdown helpers, alt text and contrast warnings**|**NEW**|9|
|**Export preview as an image**|**NEW**|9|



### **A.5 Bot handling: sending and scheduling** 

|**Feature**|**Status**|**Phase**|
|---|---|---|
|**Post, update, delete posted message; DM test send; webhook persona sending**|**DONE**|-|
|**Once / daily / weekly schedules, replace previous, time zones**|**DONE**|-|
|**Forum channels and threads**|**PLANNED**|5|
|**Multi-channel send; announcement helper (post, ping, publish)**|**NEW**|5|
|**Permission checker and readable failure reasons; retry**|**NEW**|5|
|**Silent send; suppress link previews; mention control**|**NEW**|5|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 30 of 37 

|**Feature**|**Status**|**Phase**|
|---|---|---|
|**Webhook manager per channel and persona library**|**PLANNED**|5|
|**Repeat every N minutes/hours/months; rotating messages**|**NEW**|5|
|**Queues, per-server time zone, pause/resume, DM reminder before a run**|**PLANNED**|5|
|**Webhook trigger URLs (outside services post a templated message)**|**DECIDE**|5|
|**Send by DM to chosen people; reply to or quote a message**|**NEW**|9|
|**Countdown cards; auto-edit on a schedule (for example change a banner weekly)**|**NEW**|9|



### **A.6 Bot handling: interactions and forms** 

|**Feature**|**Status**|**Phase**|
|---|---|---|
|**Link, reply, form and role actions; cooldown and once-per-person rules**|**DONE**|-|
|**Several actions per button; required roles, max uses, expiry date**|**PLANNED**|6|
|**Conditions (if role X then ... else ...)**|**NEW**|6|
|**Click counters per button**|**PLANNED**|6|
|**Form responses, CSV export, Accept/Deny with DM and role**|**PLANNED**|6|
|**Form upgrades: optional questions, length limits, number-only, dropdown**<br>**questions, echo answers**|**NEW**|6|
|**'Pick up to N' inside one role dropdown**|**NEW**|6|
|**Confirmation step before a role change; choose private or public reply**|**NEW**|6|
|**Multi-page forms**|**NEW**|9|



### **A.7 Bot handling: automation and commands** 

|**Feature**|**Status**|**Phase**|
|---|---|---|
|**Variables engine ({user.mention}, {server.member_count}, ...)**|**PLANNED**|3|
|**Welcome and goodbye messages (Members intent)**|**PLANNED**|7|
|**Keyword auto-replies (Message Content intent)**|**PLANNED**|7|
|**Custom commands (slash commands that reply with a saved message)**|**PLANNED**|7|
|**/embed send, /embed list, 'Edit in dashboard' context menu**|**PLANNED**|7|
|**Restore/Dump message, /message (JSON), /format, /help from saved FAQ**|**NEW**|7|
|**RSS, YouTube and Reddit feeds through a template**|**PLANNED**|7|
|**Sticky messages**|**DECIDE**|7|
|**Server-event embeds, boost thank-you, birthdays, role-change announcements**|**NEW**|9|
|**Message watcher (alert if the bot's message is deleted or edited)**|**NEW**|9|



### **A.8 Safety, hosting and developer** 

|**Feature**|**Status**|**Phase**|
|---|---|---|
|**Approved-server list, rate limits, body cap, login nonce, 12-hour tokens, secrets**|**DONE**|-|
|**out of Git**|||
|**CSP, innerHTML audit, pydantic validation, route test list, token revocation**|**PLANNED**|0|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 31 of 37 

|**Feature**|**Status**|**Phase**|
|---|---|---|
|**Certificate / Safe Browsing fix**|**PLANNED**|0|
|**Database indexes, layout hash, smarter autosave, click cache, cleanup job**|**NEW**|1|
|**Nightly backup to a private GitHub repo**|**PLANNED**|1|
|**Mention safety (warn before saving @everyone); link safety (block dangerous**<br>**URLs)**|**NEW**|8|
|**Per-server limits and meters; maintenance banner; 'export/delete my data'**|**NEW**|8|
|**API keys; outgoing webhooks on clicks/submits; JSON schema; debug payload**<br>**view**|**NEW**|9|
|**Light analytics: post history, click counts, form submissions per day, most-used**<br>**templates**|**NEW**|9|
|**Changelog / 'What's new' popup; fun cards (tip of the day, server info card, staff**<br>**list)**|**NEW**|9|



**CUT, for completeness:** tickets, polls/suggestions/giveaways, role groups and temporary roles, levels/XP, moderation, premium tiers, a general flows engine, live member-count embeds, auto-pin/auto-delete/auto-publish, translation. See Section 2.2. 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 32 of 37 

## **Appendix B: Planned database changes by phase** 

Every new table or column must be added in init_db() with CREATE TABLE IF NOT EXISTS or a checked ALTER TABLE (the same pattern already used for messages.webhook_id), and must default so old rows keep working. Download data.db before any structure change. 

|**Phase**|**Change**|**Purpose**|
|---|---|---|
|**0**|token_state(user_id, valid_after)|Logout and 'log out everywhere' revocation.|
|**1**|Indexes; messages.layout_hash and posted_hash|Fast library; cheap 'changed' badge.|
|**3**|templates.slots_json; message_groups; share_links|Fill-in templates; sequences; draft links.|
|**4**|access_requests; user_server_prefs (favourites, last server)|Request access; server picker.|
|**5**|schedules interval/rotation columns; trigger_urls (token hash)|New repeats; trigger URLs.|
|**6**|form_responses; click_counts; actions_json migration|Responses and CSV; counters; actions list.|
|**7**|automation_settings (welcome/goodbye); keyword_rules;<br>commands; feeds; stickies|Automation features.|
|**8**|audit_log; server_settings; messages.deleted_at; editors|Activity, brand kit, trash, editor roles.|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 33 of 37 

## **Appendix C: Discord limits cheat sheet** 

|**Item**|**Limit**|
|---|---|
|**Components V2 message**|40 components in total (nested ones count), 4,000 text characters in total; cannot include<br>content, classic embeds, stickers or polls; uses the IS_COMPONENTS_V2 flag.|
|**Classic message**|content 2,000; up to 10 embeds; 6,000 total embed characters; title 256; description 4,096;<br>up to 25 fields (name 256, value 1,024); footer text 2,048; author name 256.|
|**Classic embeds with V2**|Not allowed together in one message.|
|**Buttons**|5 per row, label 80 characters.|
|**Select menu**|25 options, one per row, placeholder 150 characters.|
|**Media gallery**|10 items.|
|**custom_id**|100 characters (the project's m:{message_id}:{component_id} format fits).|
|**Modal (pop-up form)**|5 inputs, title 45 characters, label 45 characters.|
|**Interactions**|Must be answered within 3 seconds (defer for longer work).|
|**Role actions**|Need Manage Roles and the bot's role placed above the target role.|
|**Webhook messages**|Name 1-80 characters; non-bot-owned webhooks only get non-interactive components such<br>as link buttons.|



Always re-check Discord's developer documentation before relying on a number that matters; limits change. 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 34 of 37 

## **Appendix D: Intents and permissions per feature** 

|**Feature**|**Needs**|
|---|---|
|**Everything today**|Default intents only (no privileged intents). Admin checks use fetch_member.|
|**Post and edit messages**|View Channel, Send Messages, Embed Links; Attach Files for attachments.|
|**Threads and forum posts**|Send Messages in Threads; permission to create posts or threads in the channel.|
|**Webhooks**|Manage Webhooks in the channel.|
|**Role buttons and menus**|Manage Roles, and the bot's role above every target role.|
|**Announcement publishing**|Send Messages in the announcement channel (publishing others' messages also<br>needs Manage Messages).|
|**Test send (DM me)**|The user's DMs must allow messages from server members.|
|**Slash and context-menu commands**|Invite with the applications.commands scope.|
|**Welcome and goodbye (Phase 7)**|Server Members intent: turn on in the Developer Portal AND in code.|
|**Keyword auto-replies (Phase 7)**|Message Content intent: turn on in the Developer Portal AND in code.|



Privileged intents are free to use on small bots; verification is required only at 100 servers. Do not enable an intent before the feature that needs it ships. 

Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 35 of 37 

## **Appendix E: What other embed bots do (research summary)** 

Sources: screenshots the owner shared (Sapphire, Discohook, Caesrov), the public Embed Generator listing on top.gg, Discohook's GitHub and documentation, and PeakBot's public comparison articles. No vote data on 'most requested' features exists publicly, so 'popular' here means features competitors promote or put behind a paywall. 

|**Bot / tool**|**Worth borrowing**|**Skip**|
|---|---|---|
|**Discohook**<br>**(discohook.app)**|Raw JSON editor; message-link load; backups; share links;<br>webhook threads; multi-message 'Add Message'; role/link buttons<br>via Utils bot; welcomer; sticky; /help from FAQ; in-app guides.|The general 'flows' engine.|
|**Embed Generator**<br>**(message.style)**|Visual editor; button roles and role menus; V2 builder; webhook<br>sender; saved messages with variables; /embed, /message,<br>right-click restore/dump; Discohook JSON import; recurring<br>schedules; several actions per button (premium).|Paid tiers; custom-branded<br>bot.|
|**Sapphire**|Edit / Preview / Use tabs; Visual / Raw / Variables tabs;<br>per-message Send, Edit, Schedule, Automate, Sticky panel.|Moderation and logging<br>parts.|
|**Caesrov**|Parts tree; Edit/Test; problems list with warnings; reply tabs with<br>dots; message variables with embed tags; playground; message<br>blueprints; Add-to-page palette.|Levels, streaks, tickets,<br>moderation.|
|**PeakBot and similar**|Baseline expectations: live preview, colour picker, button rows,<br>reusable templates, template marketplace.|AI builder, XP, anti-nuke,<br>tickets, polls.|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 36 of 37 

## **Appendix F: Glossary for a beginner** 

|**Word**|**Plain meaning**|
|---|---|
|**Patch**|A tiny exact instruction: find this text, change it to that text.|
|**Commit**|Saving a change on GitHub. The bot host and GitHub Pages pick up committed changes.|
|**Repo**|A project folder on GitHub. This project has two: griedon-embeds (bot) and SebA2675.github.io<br>(website).|
|**API**|The part of the bot the dashboard talks to over the internet.|
|**JWT / Bearer token**|A signed pass the API gives after login; the dashboard sends it with every request.|
|**localStorage**|A small storage area inside the browser where the pass is kept.|
|**CORS**|A browser rule about which websites may talk to the API. Ours allows only nation9.me.|
|**XSS**|An attack where attacker text runs as code in someone's browser. Prevented by escaping text and<br>by CSP.|
|**CSP**|Content-Security-Policy: a rule telling the browser which code and servers a page may use.|
|**CSRF / nonce**|An attack that forces a login; a nonce is a random value that proves the login started in this browser.|
|**SSRF**|Tricking the server into fetching private addresses; prevented by refusing private IP ranges.|
|**Intent**|A Discord switch that lets a bot receive certain events. Privileged ones must be turned on in the<br>Developer Portal.|
|**Webhook / persona**|A way to post as a custom name and avatar. A persona is a saved name and avatar.|
|**Components V2**|Discord's newer message layout system (containers, sections, text, images, buttons).|
|**custom_id**|The hidden label on a button that tells the bot which message and component was clicked.|
|**Ephemeral**|A reply only the person who clicked can see.|
|**Rate limit**|A cap on how many requests are allowed per minute.|
|**SQLite / WAL**|The file database (data.db). WAL is a mode that lets reads and writes overlap.|
|**Index**|A lookup shortcut inside the database that avoids scanning every row.|
|**Migration**|A small change that updates the database structure while keeping old data.|
|**Hash**|A short fingerprint of some text; if the text changes, the fingerprint changes.|
|**PWA**|A website that can be installed like an app.|



Embed Dashboard - Full Project Handoff Plan v2 - updated 23 Nov 2026 

Page 37 of 37 

