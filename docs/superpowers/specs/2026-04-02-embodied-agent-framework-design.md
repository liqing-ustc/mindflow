# Embodied Home Agent Framework — High-Level Design

**Date**: 2026-04-02
**Status**: Draft
**Scope**: High-level architecture for a product-prototype embodied agent that follows user instructions (text/voice) in an indoor scene by controlling a mobile manipulator (via VLA) and digital interfaces (via CUA), with internet search and calendar access.

---

## 1. Overview

An autonomous embodied agent that lives in a user's home. It understands natural language instructions (text or voice), controls a mobile manipulator robot to navigate rooms and manipulate objects, operates smart home devices via APIs and dumb appliances via physical interaction, searches the internet, accesses the user's calendar, and communicates back in the same modality the user used.

The agent operates autonomously. Over time, it learns the home layout, user preferences, and task procedures, becoming more capable the longer it operates.

## 2. Architecture: Brain + Spine + CLI

A three-component architecture inspired by biological nervous systems, extended with a digital counterpart.

### 2.1 Brain — VLM Orchestrator
*Reasons and plans in the mind*

The Brain is a Vision-Language Model (VLM) that serves as the central reasoning engine. It:

- **Receives all inputs**: user instructions (text/voice), raw camera feeds, tool responses, Spine status reports
- **Runs the reactive goal-stack loop**: the core runtime behavior (see §4)
- **Perceives the scene**: processes camera feeds to understand objects, people, appliance states, spatial layout
- **Manages memory**: maintains spatial memory and episodic memory (see §3)
- **Dispatches digital actions**: sends tool calls to the CLI (CUA) for web, calendar, smart home, dialogue (see §5)
- **Dispatches physical actions**: sends natural language instructions to the Spine
The Brain is the only decision-maker. All reasoning, planning, and high-level perception happen here.

### 2.2 Spine — VLA Executor
*Acts in the physical world*

The Spine is a language-conditioned Vision-Language-Action (VLA) model that translates the Brain's natural language instructions into motor actions. It:

- **Receives**: natural language instruction from Brain + raw camera/sensor feeds
- **Outputs**: motor commands (wheel velocities, arm joint positions, gripper actions)
- **Handles both navigation and manipulation** end-to-end — no separate planner or controller
- **Reports back** to the Brain: execution status (success / failure / in-progress), robot status

The Spine uses vision purely for visuomotor control — it does not build maps or maintain memory.

**Brain & Spine Interface**
- **Downward (Brain → Spine)**: Natural language instructions. Examples:
  - "Navigate to the kitchen"
  - "Pick up the red mug from the counter"
  - "Press the left button on the coffee machine"
- **Upward (Spine → Brain)**: Execution status: "success/fail/on-going"

This keeps the interface simple and model-agnostic. The Brain doesn't need to know the Spine's internals, and the Spine can be swapped for a different VLA without changing the Brain.

### 2.3 CLI — CUA Executor (Digital World)

The CLI is a Computer-Use Agent (CUA) that operates digital interfaces on behalf of the Brain. It is the digital counterpart of the Spine — while the Spine acts on the physical world through motor commands, the CLI acts on the digital world through computer-using.

- **Receives**: tool calls from Brain (web search, calendar operations, smart home commands, dialogue actions)
- **Outputs**: action results (search results, confirmations, device states, user messages)
- **Operates**: web browsers, calendar apps, smart home platforms, speech/text interfaces
- **Reports back** to the Brain: tool results

**Brain & CLI interface:**
- **Downward (Brain → CLI)**: Tool calls (e.g., `web_search("coffee pod refill")`, `device_control("kitchen_light", "on")`)
- **Upward (CLI → Brain)**: Tool results (e.g., search results, confirmation of device state change)

## 3. Perception & Memory

The Brain directly processes camera feeds for scene understanding. The Spine receives camera feeds independently for motor control. Both layers see the world, but use vision for different purposes.

### 3.1 Spatial Memory

The agent's persistent mental model of the home.

**Contents:**
- **Topology**: rooms, doors, corridors, connectivity graph
- **Objects**: identity, location (room + relative position), affordances (graspable, openable, pressable)
- **Appliance states**: on/off, open/closed, temperature settings, etc.
- **Annotations**: which appliances are smart (API-controllable) vs. dumb (physical interaction only)

**Behavior:**
- Updated incrementally every perception cycle as the agent moves and observes
- Queryable by the goal-stack loop: "Where is X?", "What room am I in?", "Is the front door locked?"
- Initially empty — built during the onboarding phase

### 3.2 Episodic Memory

The agent's record of past experiences.

**Contents:**
- **Task events**: what was attempted, what happened, success or failure, context
- **Learned procedures**: step-by-step sequences for tasks the agent has done before (e.g., how to operate the coffee machine)
- **User preferences**: corrections and habits learned over time (e.g., "user takes coffee black, no sugar")
- **Timestamps**: when events occurred, for recency-weighted retrieval

**Behavior:**
- Grows over time as the agent operates
- Persists across sessions (survives reboots)
- Queried by the Brain during planning: "How did I do this last time?", "What does the user prefer?"
- Consolidated periodically — old fine-grained episodes are summarized into compressed representations to manage memory size

## 4. Reactive Goal-Stack Loop

The Brain's core runtime behavior. Runs continuously while the agent is active.

### 4.1 One Tick of the Loop

1. **Perceive** — Process camera feeds. Identify objects, people, appliance states. Detect changes since last tick.
2. **Update Memory** — Write new observations to spatial map. Log significant events to episodic memory. Update appliance states.
3. **Evaluate Goal Stack** — Check the top goal: completed? failed? blocked? If a new user instruction arrived, parse it and push new goals. Pop completed goals. Re-prioritize if conditions changed.
4. **Decide Action** — Given the current goal + scene understanding + memory, choose the next action. Options:
   - Physical action → send NL instruction to Spine (VLA)
   - Digital action → send tool call to CLI (CUA): web, calendar, smart home, dialogue
   - Internal action → decompose current goal into sub-goals
5. **Dispatch** — Send the action to the appropriate executor (Spine or CLI).

Then loop back to step 1.

### 4.2 Key Behaviors

- **Parallel dispatch**: CLI actions (calendar queries, web searches) run concurrently with Spine actions. The Brain doesn't wait for a web search to finish before telling the Spine to start navigating.
- **Interruptible**: New user instructions can arrive at any time. They push onto the goal stack, potentially pausing the current goal. The agent can handle "actually, stop — do this instead."
- **Failure recovery**: If the Spine reports failure, the Brain re-evaluates: retry with a rephrased instruction, try an alternative approach, or ask the user for help.
- **Idle state**: When the goal stack is empty, the agent enters ambient mode — still perceiving and updating the spatial map, still listening for instructions, but not acting.

### 4.3 Example Trace

User says: *"Make me a coffee and check my afternoon schedule."*

| Tick | What happens |
|------|-------------|
| 1 | Parse instruction → push 2 goals: [make_coffee, check_schedule]. Dispatch calendar query (digital, non-blocking) + start navigating to kitchen (physical). |
| 2 | In hallway, moving. Calendar returns: "Team sync at 2pm." Speak: "You have a team sync at 2pm." Pop check_schedule. |
| 3 | Arrived in kitchen. Spatial map confirms coffee machine on counter, mugs in upper cabinet. Tell Spine: "Take a mug from the upper cabinet." |
| 4 | Spine reports mug grasped. Tell Spine: "Place the mug under the coffee machine spout." |
| 5 | Mug placed. Coffee machine is dumb (no API). Episodic memory: "last time, pressed left button." Tell Spine: "Press the left button on the coffee machine." |
| 6+ | Coffee brewing (detected via visual/audio). Wait. Coffee done. Tell Spine: "Pick up the mug and bring it to the user." Delivered. Speak: "Here's your coffee." Pop make_coffee. Stack empty → idle. |

### 4.4 Example Trace: Luggage Packing

User says: *"I'm traveling tomorrow. Help me pack."*

1. **Check calendar for destination** → CLI queries calendar, finds "Flight to Tokyo, 9am, 7-day trip"
2. **Search Internet for weather** → CLI searches "Tokyo weather this week" → 18-24°C, rain on Thursday
3. **Recall past trips** → Episodic memory: "user forgot phone charger last time"
4. **Decide what to pack** → Brain reasons: business attire (3 meetings on calendar), casual clothes, rain jacket, toiletries, charger, adapter plug
5. **Locate items** → Spatial memory: suitcase in bedroom closet, dress shirts on wardrobe second shelf, rain jacket by the door
6. **Get suitcase** → Spine navigates to bedroom, retrieves suitcase from closet, places on bed
7. **Pack items one by one** → Spine fetches dress shirts, trousers, casual clothes, rain jacket, toiletries, charger, adapter plug — Brain tracks progress
8. **Verify** → Brain perceives suitcase contents via camera, cross-checks against packing list
9. **Report** → "All packed. Your flight is at 9am — want me to set an alarm?"

## 5. CLI Capabilities

The CLI (CUA) exposes four tool interfaces that the Brain invokes as function calls within the goal-stack loop.

### 5.1 Web Agent

Full web interaction capability — not just search.

- `web_search(query)` → search results
- `web_browse(url)` → page content
- `web_interact(url, actions)` → interaction result (fill forms, click buttons, submit orders)

Use cases: look up information, find recipes, place orders, make reservations, check prices.

### 5.2 Calendar

Standard calendar API integration.

- `calendar_query(time_range)` → list of events
- `calendar_create(event)` → confirmation
- `calendar_update(event_id, changes)` → confirmation

Use cases: check schedule, create reminders, reschedule meetings, find free slots.

### 5.3 Smart Home API

Protocol-agnostic interface to smart home devices (Matter, HomeKit, Google Home, etc.).

- `device_list()` → discovered devices with capabilities
- `device_control(device_id, command)` → execution status
- `device_state(device_id)` → current state

Use cases: turn lights on/off, adjust thermostat, lock/unlock doors, play music on speakers, set scenes.

Note: Dumb appliances (not API-connected) are operated via physical interaction through the Spine. The Brain determines whether an appliance is smart or dumb by checking the spatial map annotations.

### 5.4 Dialogue

Manages all user-facing communication, mirroring input modality.

- `listen()` → transcribed user input (STT for voice, direct for text)
- `speak(text)` → audio playback (TTS)
- `respond(text)` → text display

Modality selection is automatic: if the user's last input was voice, responses are spoken. If text, responses are displayed as text.

## 6. System Lifecycle

### 6.1 Phase 1 — Onboarding (First Hours/Days)

- Agent explores the home, building the initial semantic spatial map
- Discovers and registers smart home devices
- User teaches preferences ("I like the thermostat at 72°F", "don't enter the bedroom without asking")
- Episodic memory starts accumulating

### 6.2 Phase 2 — Active Operation (Daily Use)

- Reactive goal-stack loop running continuously
- Spatial map refined with every movement
- Episodic memory growing — task outcomes, user corrections, learned procedures
- Agent becomes more efficient at repeated tasks

### 6.3 Phase 3 — Mature Agent (Weeks/Months)

- Rich, detailed spatial map of the entire home
- Deep episodic memory with learned procedures for common tasks
- Anticipates user needs based on patterns ("You usually have coffee at 8am")
- Minimal user correction needed
- Memory consolidation keeps storage manageable

## 7. Failure Modes & Recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Spine execution fails | VLA reports failure or timeout; Brain perceives no progress | Retry with rephrased instruction → try alternative approach → ask user for help |
| Brain VLM unavailable | API timeout or error | Spine holds position (safe stop). Retry with backoff. Alert user via fallback channel (speaker beep, LED). |
| Network down | No connectivity to cloud VLM / web / calendar | CLI disabled. Physical actions continue if Spine VLA runs on-device. Inform user of degraded mode. |
| Ambiguous instruction | Brain confidence below threshold | Ask user to clarify. Use episodic memory to disambiguate when possible. |
| Unexpected obstacle | Spine cannot reach target; camera shows blocked path | Brain re-plans route via spatial map. If no route exists, inform user. |
| Memory corruption | Spatial map contradicts current perception | Re-verify via active perception. Mark stale entries. Partial map rebuild for affected area if needed. |

**Graceful degradation principle**: The system always degrades to a safe state.
- Network down → Spine-only mode (physical actions)
- Brain down → safe stop
- Spine down → CLI-only mode (digital actions)
- CLI down → Spine-only mode (physical actions)
- Everything down → E-stop

The agent never thrashes. After N failed retries on any action, it stops and asks the user for help.

## Out of Scope (for this design)

- Specific VLM/VLA model selection and training
- Hardware specifications for the robot platform
- Network architecture and deployment topology
- Specific smart home protocol implementation details
- UI/app design for text-based interaction
- Multi-user support and user identification
- Outdoor operation
