# Modules

## WEB :

### Major: Use a framework for both the frontend and backend.
- Use a frontend framework (React, Vue, Angular, Svelte, etc.).
- Use a backend framework (Express, NestJS, Django, Flask, Ruby on Rails, etc.).
- Full-stack frameworks (Next.js, Nuxt.js, SvelteKit) count as both if you use both their frontend and backend capabilities

> 2pts

### Major: Allow users to interact with other users.
- A basic chat system (send/receive messages between users).
- A profile system (view user information).
- A friends system (add/remove friends, see friends list)

> 2pts

<!-- 
### Major: A public API to interact with the database with a secured API key, rate
limiting, documentation, and at least 5 endpoints:
- GET /api/{something}
- POST /api/{something}
- PUT /api/{something}
- DELETE /api/{something}

> 2
-->

### Minor: Use an ORM for the database.

> 1pt

<!-- ### Minor: A complete notification system for all creation, update, and deletion actions

> 1pt -->

### Minor: Custom-made design system with reusable components, including a proper color palette, typography, and icons (minimum: 10 reusable components).

> 1pt

### Minor: Implement advanced search functionality with filters, sorting, and pagination.

> 1pt

### Minor: File upload and management system.
- Support multiple file types (images, documents, etc.).
- Client-side and server-side validation (type, size, format).
- Secure file storage with proper access control.
- File preview functionality where applicable.
- Progress indicators for uploads.
- Ability to delete uploaded files.

> 1pt

### TOTAL : 8 + 1 si les notif ça passe + 2 si on fait une public api en plus

## Accessibility and Internationalization

### Minor: Support for multiple languages (at least 3 languages).
- Implement i18n (internationalization) system.
- At least 3 complete language translations.
- Language switcher in the UI.
- All user-facing text must be translatable

> 1pt

### Minor: Support for additional browsers.
- Full compatibility with at least 2 additional browsers (Firefox, Safari, Edge,
etc.).
- Test and fix all features in each browser.
- Document any browser-specific limitations.
- Consistent UI/UX across all supported browsers.

> 1pt

### TOTAL 2pts

## User Management

### Major: Standard user management and authentication.
- Users can update their profile information.
- Users can upload an avatar (with a default avatar if none provided).
- Users can add other users as friends and see their online status.
- Users have a profile page displaying their information

> 2 pts

### Minor: Implement remote authentication with OAuth 2.0 (Google, GitHub, 42, etc.)

> 1pt

### Major: Advanced permissions system:
- View, edit, and delete users (CRUD).
- Roles management (admin, user, guest, moderator, etc.).
- Different views and actions based on user role.

> 2pts

<!-- ### Minor: User activity analytics and insights dashboard. -->

### TOTAL : 5pts

## Cybersecu

<!-- Major: Implement WAF/ModSecurity (hardened) + HashiCorp Vault for secrets:
- Configure strict ModSecurity/WAF.
- Manage secrets in Vault (API keys, credentials, environment variables), encrypted and isolated. -->

## Devops

### Minor: Health check and status page system with automated backups and disaster recovery procedures.

> 1pt

### TOTAL : 1pt

## Data and analytics
<!-- 
Minor: Data export and import functionality.
- Export data in multiple formats (JSON, CSV, XML, etc.).
- Import data with validation.
- Bulk operations support. -->

<!-- Minor: GDPR compliance features.
- Allow users to request their data.
- Data deletion with confirmation.
- Export user data in a readable format.
- Confirmation emails for data operations. -->

## Custom

### Major: Implement a custom module that is not listed above.
- The module must be substantial and demonstrate technical complexity.
- You must provide proper justification in your README.md explaining:
  - Why you chose this module.
  - What technical challenges it addresses.
  - How it adds value to your project.
  - Why it deserves Major module status (2 points).
- Taking shortcuts or implementing trivial features will result in rejection.
- Be creative and think outside the box.
- The module should be relevant to your project context