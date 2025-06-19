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

- **`AuthenticationForm`** - Handles YouTrack credentials with method selection
- **`TicketList`** - Displays tickets with search and pagination
- **`TicketItem`** - Individual ticket display and interactions
- **`TimeLogModal`** - Time logging form

### **Services** (Data Layer)
External interactions are handled by services:

- **`youtrackApi`** - YouTrack REST API integration
- **`youtrackTokenService`** - Automatic token detection from browser sessions
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

The extension provides a clean, two-step authentication process:

### Step 1: Method Selection
Choose your preferred authentication method from a clean interface:

### Step 2: Authentication Forms

#### 1. **🔑 API Token** (Manual)
Traditional permanent token authentication:
- Enter YouTrack URL and permanent API token
- Requires creating a token in YouTrack: Settings → Security → New Token
- Best for: Users who prefer manual token management

#### 2. **🔍 Auto-Detect** (Convenient) ✨ **Recommended**
Automatically detects authentication from existing YouTrack sessions:
- Login to production YouTrack in any browser tab
- Click "Auto-Detect Authentication" to automatically extract credentials
- Works with YouTrack's internal authentication tokens
- No manual token copying required
- Best for: Users already logged into YouTrack

#### How Auto-Detection Works:
1. User logs into YouTrack in a browser tab
2. Extension scans the YouTrack tab for authentication tokens
3. Extracts authentication data from the browser's localStorage
4. Automatically configures the extension with detected credentials
5. Provides seamless authentication experience

This method is particularly useful for enterprise YouTrack instances where users are already authenticated and don't want to manage separate API tokens.

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

- **Clean Authentication Flow** - Two-step process with method selection
- **Simplified Authentication** - Removed OAuth complexity, focused on practical methods
- **90% reduction** in main App.vue file size (396 → 80 lines)
- **Modular composables** for reusable business logic
- **Component-based UI** with clear props and events
- **Centralized styling** with CSS custom properties
- **Service layer** for external API interactions
- **Better error handling** and user feedback
- **Automatic token expiration handling** - Users are automatically logged out when tokens expire
- **Improved developer experience** with clear file organization

This refactored structure makes the codebase much easier to understand, maintain, and extend with new features. 