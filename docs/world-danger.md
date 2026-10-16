# Local danger and event lifecycle

`world-model.js` owns `EVENT_TYPES`: risk, physical hazard, evacuation, group size,
enemy kind and guard policy. `world-danger.js` consumes those policies for the live
world. New incident types should be added to this registry, not hard-coded in NPC AI.

## Spatial rules

Road incidents affect their road corridor (32 world metres); settlement incidents
affect their site and outskirts. Off-road risk derives from biome, elevation,
weather and curse. It is no longer a fixed 3. Route planning retains the existing
edge risk model and applies the same registry's risk modifiers.

Physical enemies are a separate, immediate local input: within 180 game pixels,
on the same level and with line of sight, even an idle enemy makes the area unsafe.
A dead enemy, friendly actor or inactive boss does not. Retreating enemies remain
a threat until they leave. This never raises an entire region's danger.
New wild/event enemies avoid civilian posts and positions by 220 pixels. Existing
story enemies are preserved; nearby civilians retreat instead of relocating them.
Party members and guards are exempt from civilian placement/evacuation rules.
New campaigns place the hero and Elyne 64 pixels farther south along the existing
camp path (with safe fallback candidates). Authored enemies and terrain are unchanged;
existing saves keep their player position.

## Residents and services

Residents transition through leaving, sheltered and returning. They path to an
accessible shelter/retreat point, avoid stepping closer to nearby enemies, and fade
out only on arrival. Blocked paths are retried, never teleported through walls.
Off-screen movement is settled without pathfinding. Day/night schedules are paused
while retreating and resumed afterward. Ten world minutes of calm are required for
return; new danger cancels the return. A current conversation may finish.

Hidden residents have no collision, conversation, transport or provisioning service.
Transport preparation and actual departure both revalidate safety. Recruited actors
continue to follow party rules. Couriers pause while sheltering.

## Encounters and travel

Bandits, occupations, sieges and curses create bounded groups near the incident's
recorded location when loaded. IDs are event/slot based; defeats and wounded enemy
health persist, preventing reload farming. Defeating all slots resolves that incident
and records a victory/purification. Expired incident enemies disengage and leave;
patrol guards retire too. Guards fight world enemies without consuming player combat
bonuses or awarding player XP/kills. Original story enemies are excluded.

Known hostile groups block transport departure before payment. Newly appearing
groups are checked within each journey simulation slice and stop transport at its
last reached stop. This uses real incidents, not random unavoidable damage.

Truces resolve sieges/occupations; purifications resolve manifestations. Expiration
of a physical blockage records a reopening without cancelling unrelated blockages.
Duplicate active incidents of the same type and target are coalesced. Snow news
uses actual snowfall; avalanche generation requires snowy conditions.

## Persistence and cost

`atlas.danger.version = 1` adds validated civilian states and up to 128 incident health
entries. Legacy saves need no migration. Event deaths reuse `atlas.deaths`.
Event snapshots invalidate on revision, world minute, time rewind or exact event
boundary; point cache is capped at 512. Nearby civilians are assessed every half
second (sooner on event/time changes); off-screen actors are evaluated on approach.
Encounter spawning runs at most once a second except incident/time changes, with
24 live event enemies and 8 guards maximum. Abstract travel does not spawn groups
or pathfind distant civilians. No work is proportional to total map area.

This module does not implement faction diplomacy or a reputation system.
