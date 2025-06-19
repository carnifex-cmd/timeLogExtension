# YouTrack Multi-Ticket Time Logger

A Chrome extension for logging time into multiple YouTrack tickets simultaneously.

## 🏗️ Architecture

This project has been refactored into a clean, modular architecture for better maintainability and readability.

### 📁 Project Structure

```
src/
├── components/           # Reusable Vue components
│   ├── AuthenticationForm.vue
│   ├── TicketList.vue
│   ├── TicketItem.vue
│   └── TimeLogModal.vue
├── composables/          # Vue composition functions for business logic
│   ├── useAuth.js
│   ├── useTickets.js
│   └── useModal.js
├── services/            # External API and storage services
│   ├── youtrackApi.js
│   ├── youtrackTokenService.js
│   ├── oauthService.js
│   └── storageService.js
├── styles/              # Global styles and design tokens
│   ├── variables.css
│   └── global.css
└── popup/               # Main popup application
    ├── App.vue
    ├── main.js
    └── fonts.css
```

## 🧱 Architecture Patterns

### **Composables** (Composition API)
Business logic is separated into reusable composables:

- **`useAuth`** - Handles authentication state and Chrome storage
- **`useTickets`** - Manages ticket fetching, filtering, and selection
- **`useModal`** - Controls modal state and validation

### **Components** (Single Responsibility)
UI is broken down into focused components:

- **`AuthenticationForm`** - Handles YouTrack credentials
- **`TicketList`** - Displays tickets with search and pagination
- **`TicketItem`** - Individual ticket display and interactions
- **`TimeLogModal`** - Time logging form

### **Services** (Data Layer)
External interactions are handled by services:

- **`youtrackApi`** - YouTrack REST API integration
- **`storageService`** - Chrome extension storage wrapper

### **Styles** (Design System)
Consistent styling through:

- **CSS Custom Properties** - Centralized design tokens
- **Utility Classes** - Common styling patterns
- **Component-scoped Styles** - Isolated component styling

## 🎯 Benefits of This Structure

1. **Separation of Concerns** - Each file has a single responsibility
2. **Reusability** - Components and composables can be easily reused
3. **Testability** - Business logic is separated from UI components
4. **Maintainability** - Easy to locate and modify specific functionality
5. **Scalability** - New features can be added without cluttering existing code
6. **Type Safety** - Clear interfaces between modules
7. **Performance** - Better tree-shaking and code splitting opportunities

## 🔐 Authentication Methods

The extension supports multiple authentication methods:

### 1. **API Token** (Manual)
Traditional permanent token authentication:
- Enter YouTrack URL and permanent token manually
- Requires creating a token in YouTrack settings

### 2. **OAuth 2.0** (Secure)
OAuth-based authentication:
- Secure authentication without sharing permanent tokens
- Requires OAuth client setup in YouTrack

### 3. **Auto-Detect** (Convenient) ✨ **NEW**
Automatically detects authentication from existing YouTrack sessions:
- Open YouTrack in any browser tab and log in
- Click "Detect & Connect" to automatically extract authentication
- Works with any YouTrack authentication (JWT tokens, session tokens)
- No manual token copying required

#### How Auto-Detection Works:
1. Content script monitors YouTrack pages for authentication tokens
2. Extension scans active YouTrack tabs when requested
3. Extracts JWT tokens, session tokens, or cookies from localStorage
4. Automatically configures the extension with detected credentials

This method is particularly useful for enterprise YouTrack instances where users are already authenticated through SSO or other authentication mechanisms.

## 🔧 Development

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
```

## 📦 Build Output

The build process creates optimized files in the `dist/` directory, ready for Chrome extension installation.

## 🚀 Key Improvements

- **90% reduction** in main App.vue file size (396 → 80 lines)
- **Modular composables** for reusable business logic
- **Component-based UI** with clear props and events
- **Centralized styling** with CSS custom properties
- **Service layer** for external API interactions
- **Better error handling** and user feedback
- **Improved developer experience** with clear file organization

This refactored structure makes the codebase much easier to understand, maintain, and extend with new features. 