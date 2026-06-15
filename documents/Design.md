# System Design Document
## Smart Healthcare Intelligence Platform v1.0

Component library check complete: All screens defined in [Screens.md](file:///c:/Users/sm223/OneDrive/Desktop/Smart%20Healthcare%20Management%20System/documents/Screens.md) are coverable by the standard set of 13 UI components specified below. The target platform is Android (utilising Material You / Material Design 3 design system tokens) for mobile clients, and responsive web portals for operations terminals.

---

## 1. Design Principles

### 1. Clinical Priority Over Decoration
In clinical screens (Doctor consultation, Nurse triage, Pharmacist dispensing, Billing), information density and legibility MUST take precedence over styling. White space must be optimized to minimize scrolling. Color usage must be reserved for status changes, alerts, and critical flags.

### 2. Triage and Wait-Time Transparency
For patients under stress, interfaces MUST present clear, predictable progression states. Waiting counters, estimated wait times, and triage chats must present information without diagnostic jargon, emphasizing immediate human care fallback actions.

### 3. Non-Destructive Navigation Interception
All clinical and financial input forms MUST intercept navigation events that would cause data loss. If a Doctor, Nurse, or Billing Officer attempts to swipe back or close an active workflow (e.g. clinical notes, registration, checkout), the system must explicitly require confirmation before discarding inputs.

### 4. Adaptive Role Density
The user interface MUST scale layout density based on the actor's role. Patient screens utilize low-density, high-contrast layouts with large touch targets. Staff portal screens utilize high-density, multi-column layouts with dense tabular text arrays for rapid keyboard-only operations.

---

## 2. Visual Identity

### Color Tokens (Material Design 3 Hex Values)
*   `primary`: `#006874` (Deep Teal - representative of healthcare security)
*   `primary-variant`: `#004f59` (Dark Teal)
*   `secondary`: `#4a6267` (Slate Gray)
*   `surface`: `#f8fafc` (Off-white / Card backgrounds)
*   `surface-variant`: `#e2e8f0` (Borders and divider lines)
*   `background`: `#f1f5f9` (App background gray)
*   `error`: `#ba1a1a` (Vibrant Red)
*   `warning`: `#e28704` (Amber Gold)
*   `success`: `#0f766e` (Clinical Emerald Green)
*   `info`: `#0284c7` (Sky Blue)
*   `on-primary`: `#ffffff` (White text on primary buttons)
*   `on-surface`: `#0f172a` (Charcoal text on light cards)
*   `on-background`: `#0f172a` (Charcoal text on app background)
*   `on-error`: `#ffffff` (White text on error components)

### Typography (Material Design 3 Roboto/Outfit Scale)

| Role | Typeface | Size | Weight | Line Height | Usage |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Display Large** | Outfit / Sans-Serif | 32sp | 700 | 40sp | Login screens headers, OTP entry fields. |
| **Headline Medium**| Outfit / Sans-Serif | 24sp | 600 | 32sp | Dashboard headers, Main section titles. |
| **Title Medium** | Roboto / Sans-Serif | 18sp | 600 | 24sp | Card titles, modal headers. |
| **Body Medium** | Roboto / Sans-Serif | 14sp | 400 | 20sp | Main clinical text, notes, chat lists. |
| **Body Small** | Roboto / Sans-Serif | 12sp | 400 | 16sp | Metadata, timestamps, inline captions. |
| **Label Large** | Roboto / Sans-Serif | 14sp | 500 | 20sp | Form labels, button text, table headers. |

### Spacing System (8dp Base Grid)
*   `base-unit`: `8dp` (All dimensions must align to this grid)
*   `space-xs`: `4dp` (Inner margins, small icon padding)
*   `space-sm`: `8dp` (Form field gap, card-padding small)
*   `space-md`: `16dp` (Standard card padding, default screen gutter)
*   `space-lg`: `24dp` (Standard block gap, section separation)
*   `space-xl`: `32dp` (Hero banner margins)
*   `space-xxl`: `48dp` (Bottom nav bar gutters)

### Border Radius Tokens
*   `radius-none`: `0dp` (Table rows, full-width screen headers)
*   `radius-sm`: `4dp` (Input checkboxes, small badges)
*   `radius-md`: `8dp` (Standard buttons, text inputs, search fields)
*   `radius-lg`: `16dp` (Dashboard cards, modal dialog containers)
*   `radius-full`: `9999dp` (Circular avatars, status chips, pills)

### Elevation / Shadow Tokens
*   `elevation-0`: No shadow (App background components)
*   `elevation-1`: Subtle shadow (Flat dashboard cards)
*   `elevation-2`: Raised shadow (Standard buttons, dropdown selectors)
*   `elevation-3`: High-contrast shadow (Header bars, persistent tabs)
*   `elevation-4`: Floating shadow (Bottom sheets, sliding panels)
*   `elevation-5`: Pop-up shadow (Emergency modal dialog overlays)

### Icon Library
*   **Library:** Material Symbols (Rounded variant).
*   **Size Grid:**
    *   `16dp` (Inline alerts, small status chips)
    *   `20dp` (Table actions, list navigation arrows)
    *   `24dp` (Default size for buttons, bottom navigation tab items)
    *   `32dp` (Hero banners, triage chat headers)
*   **Rules:** Icons must never be used alone to represent an action; they must always be accompanied by a text label or a defined tooltip (screen-reader accessible).

---

## 3. Component Library

### 1. Button
*   **Visual Spec:** Height: `48dp` (minimum target). Padding: `16dp` left/right. Shape: `radius-md`.
*   **States:**
    *   *Default:* Background `primary`, Text `on-primary`.
    *   *Pressed:* Darkened `primary-variant`.
    *   *Focused:* Outer teal ring, thickness `2dp`.
    *   *Disabled:* Gray background `#cbd5e1`, text `#94a3b8`.
    *   *Loading:* Hides label; renders infinite rotating spinner.
*   **Usage Rule:** Use standard buttons for primary user actions (e.g. Save, Book, Fulfill). Use outline buttons for secondary actions (e.g. Cancel).
*   **Accessibility:** Minimum touch target size `48dp x 48dp`; minimum contrast ratio 4.5:1.

### 2. Input
*   **Visual Spec:** Height: `56dp`. Padding: `12dp` top/bottom, `16dp` left/right. Shape: `radius-md` with border `1dp` `surface-variant`.
*   **States:**
    *   *Default:* Clear placeholder text, border gray.
    *   *Focused:* Border changes to `primary` teal, thickness `2dp`.
    *   *Error:* Border changes to `error` red, displays red help text below.
    *   *Disabled:* Background `#f1f5f9`, border gray, no keyboard focus.
*   **Usage Rule:** Used for all form capture workflows (triage, vitals, login, search).
*   **Accessibility:** Must link `<label>` element ID to the input ID; contrast ratio of input border must be >= 3.0:1 against surface.

### 3. Card
*   **Visual Spec:** Padding: `16dp`. Shape: `radius-lg`. Border: `1dp` `surface-variant`. Shadow: `elevation-1`.
*   **States:** Default | Pressed (shadow elevations increase to `elevation-2`).
*   **Usage Rule:** Group related informational elements (e.g., upcoming appointments, waitlist token numbers, bed maps).
*   **Accessibility:** Must have unique content description explaining the container's summary.

### 4. List Item
*   **Visual Spec:** Height: `72dp`. Padding: `16dp` left/right. Divider: `1dp` bottom border `surface-variant`.
*   **States:** Default | Pressed (light gray hover highlight).
*   **Usage Rule:** Standard row list items for directories (appointments list, lab worklists).
*   **Accessibility:** Group container must read as a single entity to screen readers.

### 5. Bottom Sheet
*   **Visual Spec:** Top corners: `radius-lg` (`16dp`). Gutter margins: `0dp`. Slide animation from bottom.
*   **States:** Expanded | Collapsed | Dismissed.
*   **Usage Rule:** Used on mobile clients for selecting lookup items without full screen push.
*   **Accessibility:** Must focus on first active sheet element on open; swipe down dismissible.

### 6. Dialog
*   **Visual Spec:** Width: `85%` screen width. Padding: `24dp`. Shape: `radius-lg`. Shadow: `elevation-5`.
*   **States:** Visible | Dismissed.
*   **Usage Rule:** Used exclusively for critical confirmation prompts (e.g., Cancel Appointment, deactivation notifications).
*   **Accessibility:** Focus-locked to modal buttons; background clicks block action (requires explicit button selection).

### 7. Toast
*   **Visual Spec:** Height: Auto-wrap text. Shape: `radius-md`. Background: `#334155` (Slate), text `#f8fafc`.
*   **States:** Default (Visible for 3.0 seconds, then fades).
*   **Usage Rule:** Use for ephemeral non-critical alerts (e.g. "Draft notes saved").
*   **Accessibility:** Must read as an aria-live assertive announcement.

### 8. Badge
*   **Visual Spec:** Height: `18dp`. Shape: `radius-full`. Text size: `10sp` bold.
*   **States:** Red (`error` - critical/readmission) | Green (`success` - roster) | Amber (`warning` - inventory low).
*   **Usage Rule:** Highlight inline counts or urgent status indicators.
*   **Accessibility:** Screen-readers must read: "Alert: [Value] items."

### 9. Tab
*   **Visual Spec:** Height: `48dp`. Active line border thickness: `3dp` `primary`.
*   **States:** Active | Inactive | Focused.
*   **Usage Rule:** Swapping horizontal views inside a single context (e.g. Pharmacy queue vs stock directory).
*   **Accessibility:** Keyboard tab keys navigate selections.

### 10. Navigation Bar
*   **Visual Spec:** Height: `56dp`. Icons centered with labels below. Background: `surface`.
*   **States:** Active tab highlighted with tinted background shape.
*   **Usage Rule:** Primary app tab navigation bar (mobile).
*   **Accessibility:** Must announce tab position (e.g. "Tab 1 of 4").

### 11. Empty State
*   **Visual Spec:** Centered layout. Illustration: Gray silhouette icon. Text: Title + Caption body. Button: Primary layout.
*   **States:** Default.
*   **Usage Rule:** Display when lists or queues contain zero records.
*   **Accessibility:** Ensure illustration is marked as decorative (hidden from screen readers).

### 12. Skeleton
*   **Visual Spec:** Gray placeholder shapes matching target layout.
*   **States:** Infinite looping pulse animation (opacity shifts from `0.4` to `1.0`).
*   **Usage Rule:** Display during initial screen load shimmers before API returns data.
*   **Accessibility:** Hidden from screen readers (replaced by "Loading data..." status).

### 13. Chip
*   **Visual Spec:** Height: `32dp`. Shape: `radius-full`. Padding: `12dp`.
*   **States:** Selected (Primary color background) | Unselected (Gray outline).
*   **Usage Rule:** Represent active filters or options (e.g., recovery status: "Active", "Recovered").
*   **Accessibility:** Min click target size `48dp x 48dp` (accomplished by adding invisible padding wrapper around chip bounds).

---

## 4. UX Patterns

### Form Validation
*   **Validation Triggers:** Form fields validate **on blur** (user leaves input) for format errors (e.g. email, phone format), and **on submit** for required completions.
*   **Error Placement:** Error helper text MUST render directly below the corresponding input box in `error` red, shifting subsequent elements down. No dialog popups are permitted for input errors.

### Loading Indicators
*   **Rule:** For page-level initial loads and list tables, the app MUST render **Skeletons** matching the target design layout. For minor inline actions (e.g. clicking a button, uploading a file), the app MUST render a **Spinner** inside the button or upload card, disabling further clicks.

### Empty States
*   All empty states MUST include three unified elements:
    1.  **Icon:** Standard `Material Symbol` (decorative).
    2.  **Copy:** Heading (e.g. "No Reports") + Body ("Your lab reports will appear here once processed by the technician.").
    3.  **Action:** A clear Call-to-Action button if an action is available (e.g. "Book Appointment").

### Error Handling
*   **Toast Alert:** Use for background/ephemeral sync errors (e.g., "Connection drop. Displaying cached schedule.").
*   **Inline Alert:** Use for localized failures (e.g., "Malicious file detected. Upload blocked.").
*   **Full-Page Alert:** Use when a critical service fails (e.g. "Database Offline", "KMS Decryption failed"). Must render an illustration, clear explanation, and a "Retry Connection" CTA.

### Destructive Actions
*   A destructive action is defined as any operation that deletes records, invalidates sessions, or cancels active resources.
*   **Confirmation Pattern:** The system MUST intercept destructive actions and display a modal dialog requiring the user to explicitly click "Confirm" or type "CANCEL" to execute.

### Pull to Refresh
*   Permitted only on dashboard queue lists (`SCR-PT-04`, `SCR-DR-02`, `SCR-NS-01`, `SCR-BO-01`). Disabled on edit forms and settings panels to prevent data loss.

---

## 5. Accessibility Standards

*   **WCAG Level:** AA Minimum target compliance across all portals and applications.
*   **Touch Targets:** All clickable elements (buttons, list item links, tabs) MUST maintain a minimum touch target size of `48dp x 48dp`.
*   **Contrast Ratios:**
    *   Normal text (Body / labels): `4.5:1` minimum against backgrounds.
    *   Large text (Display / headlines): `3.0:1` minimum.
    *   Functional UI components (borders, selection rings): `3.0:1` minimum.
*   **Dynamic Type:** All client text elements MUST scale dynamically with Android system font settings (supporting a scaling range from 80% up to 200%) without breaking layout grids.
*   **Screen Reader Policy:** All interactive elements must have defined content descriptions (`android:contentDescription`). Image vectors must be marked as `importantForAccessibility="no"` if decorative.

---

## 6. Motion Tokens

### Duration
*   `instant`: `0ms` (Use for tabular updates, text value swaps).
*   `fast`: `100ms` (Use for simple hover actions, icon states transitions).
*   `standard`: `200ms` (Use for standard transitions: modal scale, card pushes, list expansion).
*   `slow`: `300ms` (Use for drawer slide-ins, bottom sheet layouts entry).

### Easing Curves
*   **Standard Transition (Enter/Exit):** `cubic-bezier(0.2, 0, 0, 1)` (Material 3 standard ease).
*   **Slide-ins (Sheets / Drawers):** `cubic-bezier(0, 0, 0.2, 1)` (Decelerate ease).
*   **Dismissals / Collapse:** `cubic-bezier(0.4, 0, 1, 1)` (Accelerate ease).

### Reduced Motion Policy
When system-level "Reduced Motion" is enabled:
1.  All slide, bounce, and scale transitions MUST collapse to standard cross-fades (`duration-fast`).
2.  Skeleton pulse animations must stop pulsing and lock to a static light-gray color background.
