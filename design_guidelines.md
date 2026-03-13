# Discord Bot Design Guidelines

## Project Overview
**Bot Purpose**: Advanced server moderation and management bot with owner-controlled permissions, whitelist system, interactive panels, and automated security features.

**Target Platform**: Discord (not a mobile app - bot operates within Discord's existing interface)

**Key Constraint**: Discord bots cannot have custom standalone UIs. All interactions use Discord's built-in components (embeds, buttons, select menus, modals).

---

## Brand Identity

**Personality**: Authoritative, reliable, professional moderation tool with streamlined admin controls.

**Visual Direction**: Clean, structured, hierarchical. Uses Discord's dark theme as foundation with strategic accent colors for status indicators (warnings, success, danger).

**Memorable Element**: Consistent use of custom emojis across all panels to create visual recognition and personality.

---

## Interaction Architecture

### Command Structure
1. **Owner-Only Commands** (ID: 1392042410212855821)
   - `/whitelist add [id]` / `/whitelist remove [id]`
   - `/edit` (opens edit panel)
   - All security configuration

2. **Whitelisted User Commands**
   - `/spam`, `/raid`, and other moderation tools
   
3. **Public Commands**
   - `/panel` (main interactive panel)
   - `/security` (view status only for non-owners)

### Navigation Flow
- Primary entry: `/panel` command
- All major features accessible via button-based panels (no deep command nesting)
- Edit and security features open as separate panel views from main panel

---

## Panel Specifications

### Main Panel (`/panel`)
**Access**: All users

**Layout**:
- Embed with bot branding at top
- Title: "Control Panel"
- Description: Brief welcome message with owner name (axiola)
- Button grid (3 columns maximum for mobile compatibility):
  - 🆘 **Ajuda** (Help) - Lists all available commands based on user permissions
  - 💬 **Chat** - Utility buttons section
  - ⚙️ **Config** (Owner only, hidden for others)
  - 🛡️ **Security Status** (Shows current security settings)
  - 📋 **Whitelist** (Owner only, hidden for others)

**Visual Design**:
- Use custom server emojis for all buttons (NOT default Unicode emojis)
- Embed color: Neutral blue (#5865F2 - Discord brand color)
- Thumbnail: Bot avatar

---

### Edit Panel (`/edit`)
**Access**: Owner only (axiola)

**Layout**:
- Embed title: "⚙️ Configurações do Bot"
- Button options:
  - 🌐 **Idioma** - Opens language selection modal
  - ✏️ **Nome** - Opens text input modal to change bot username
  - 🖼️ **Avatar** - Instructions for avatar URL submission
  - 👥 **Staff Manager** - Opens staff management sub-panel
  - 🔙 **Voltar** - Return to main panel

**Interaction**:
- Each button opens a Discord modal (text input form) or sub-panel
- Confirmation message after each change with green embed
- Error messages use red embed

---

### Whitelist Management Panel
**Access**: Owner only

**Layout**:
- Embed showing current whitelisted users (ID + username if cached)
- Buttons:
  - ➕ **Adicionar** - Opens modal to input user ID
  - ➖ **Remover** - Opens select menu with current whitelist
  - 🔙 **Voltar** - Return to main panel

**Visual Design**:
- Use embed fields to display each whitelisted user
- Empty state: "Nenhum usuário na whitelist"

---

### Security Panel (`/security`)
**Access**: 
- Owners: Full configuration
- Others: View-only status display

**Owner View**:
- Embed showing current security settings
- Toggle buttons for:
  - 🚨 **Anti-Raid** (on/off)
  - 💬 **Anti-Spam** (on/off)
  - 🤖 **Bot Protection** (on/off)
  - 🔒 **Auto-Lockdown** (on/off)
- Configuration button:
  - ⚙️ **Configurações** - Opens sub-panel for thresholds/timers

**Non-Owner View**:
- Read-only embed showing active protection systems
- No buttons, just informational display

**Security Config Sub-Panel**:
- Text input fields:
  - Raid threshold (members joining per minute)
  - Spam threshold (messages per 10 seconds)
  - Mute duration (in minutes) for warned members
  - @everyone/@here limit per hour
- Save/Cancel buttons

---

## Visual Design System

### Embed Colors (Status Indicators)
- **Default**: #5865F2 (Discord Blurple)
- **Success**: #57F287 (Discord Green)
- **Warning**: #FEE75C (Discord Yellow)
- **Danger**: #ED4245 (Discord Red)
- **Neutral/Info**: #EB459E (Discord Fuchsia)

### Typography
Uses Discord's default font (Whitney) - no custom typography possible.

**Hierarchy**:
- Embed titles: Bold
- Field names: Bold
- Field values: Regular
- Descriptions: Regular, slightly muted

### Component Guidelines
- **Buttons**: Always use custom emojis (not 🔴, 🟢, etc.)
- **Embeds**: Keep descriptions under 300 characters for readability
- **Fields**: Use inline fields for compact data display
- **Footers**: Include timestamp on security logs and action confirmations

---

## User Feedback & States

### Success States
- Green embed with checkmark custom emoji
- Example: "✅ Usuário adicionado à whitelist com sucesso!"

### Error States
- Red embed with X custom emoji
- Example: "❌ Erro: Apenas o Owner pode usar este comando."

### Loading States
- Edit original message with "⏳ Processando..." during operations
- Replace with final result embed

### Empty States
- Whitelist empty: "📋 Nenhum usuário na whitelist"
- No security alerts: "🛡️ Nenhum alerta nas últimas 24 horas"

---

## Security System Behavior

### Automated Actions
1. **Raid Detection**: If >10 members join within 60 seconds
   - Auto-lockdown server
   - DM owner notification
   - Log to security channel

2. **Spam Detection**: If user sends >5 identical messages in 10 seconds
   - Delete spam messages
   - Issue warning (stored in database)
   - If 2nd warning: Mute for configured duration
   - If 3rd warning: Kick

3. **Malicious Bot Detection**: If bot deletes channels or sends spam
   - Ban bot immediately
   - Remove roles from user who added the bot
   - Log to security channel with user mention

### Notification System
- All security actions send DM to owner (axiola)
- Security log channel (configurable) receives detailed embeds
- Embed includes: timestamp, action taken, user affected, reason

---

## Required Assets

**Custom Emojis** (to be uploaded to server):
- `help` - Question mark icon (for Ajuda button)
- `chat` - Speech bubble (for Chat button)
- `config` - Gear icon (for Config button)
- `security` - Shield icon (for Security button)
- `whitelist` - Clipboard/list icon (for Whitelist button)
- `success` - Green checkmark (for success messages)
- `error` - Red X (for error messages)
- `warning` - Yellow triangle (for warnings)
- `loading` - Animated loading spinner (for processing states)
- `lock` - Padlock icon (for lockdown status)
- `bot_icon` - Robot head (for bot protection)

**WHERE USED**:
- All panel buttons use respective custom emojis
- All status embeds use success/error/warning emojis
- Security notifications use lock/bot_icon emojis

**Bot Avatar**: Professional shield or moderation-themed icon (uploaded via Discord Developer Portal)