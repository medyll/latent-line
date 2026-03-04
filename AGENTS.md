# Agent Development Guide

This file contains guidelines and commands for agentic coding agents working in this repository.

## Build, Lint, and Test Commands

### Core Development Commands

- **Development**: `pnpm run dev` - Start Vite development server
- **Type Checking**: `pnpm exec tsc --noEmit` - Run TypeScript compiler without emitting files
- **Linting**: `pnpm run lint` - Check code with Prettier and ESLint
- **Formatting**: `pnpm run format` - Format code with Prettier
- **Build**: `pnpm run build` - Build for production
- **Preview**: `pnpm run preview` - Preview production build

### Testing Commands

- **Unit Tests**: `pnpm test` - Run all tests (Vitest + Playwright)
- **Unit Tests Only**: `pnpm run test:unit` - Run Vitest unit tests
- **Single Test File**: `pnpm run test:unit -- path/to/test.test.ts` - Run specific test file
- **E2E Tests**: `pnpm run test:e2e` - Run Playwright end-to-end tests
- **Test Watch Mode**: `pnpm run test:unit -- --watch` - Run tests in watch mode

### Code Quality Commands

- **Svelte Type Checking**: `pnpm run check` - Run SvelteKit sync and type checking
- **Svelte Type Check Watch**: `pnpm run check:watch` - Run Svelte type checking in watch mode

## Code Style Guidelines

### TypeScript and Svelte 5 Conventions

- **Language**: TypeScript with strict mode enabled
- **Framework**: Svelte 5 with snippets (slots are deprecated)
- **Component Syntax**: Use `{#snippet name()}` for content passing, `{@render children()}` for layout components
- **Script Blocks**: Use `<script lang="ts">` for TypeScript components

### Import Organization

```typescript
// 1. External libraries (React, Vue, etc.)
import { z } from 'zod';
import { Tooltip as TooltipPrimitive } from 'bits-ui';

// 2. Internal modules (relative imports)
import type { Model } from './model-types';
import { modelSchema } from './model-template';

// 3. Svelte-specific imports
import { createRawSnippet } from 'svelte';
```

### Naming Conventions

- **Components**: PascalCase (e.g., `TimelineEvent`, `AssetManager`)
- **Functions/Variables**: camelCase (e.g., `buildDefaultModel`, `timelineEvents`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MOOD_ENUM`, `RESOLUTION_PRESETS`)
- **Files**: kebab-case for components (e.g., `timeline-event.svelte`), camelCase for utilities (e.g., `model-utils.ts`)
- **IDs**: Short, stable format (e.g., `char_01`, `bgm_01`, `env_01`)

### Error Handling

- **Validation**: Use Zod for runtime validation (`modelSchema.safeParse(value)`)
- **Error Messages**: Provide clear, descriptive error messages
- **Type Guards**: Use TypeScript type guards for runtime type checking
- **Graceful Degradation**: Handle missing data gracefully with default values

### File Structure

```
src/
├── lib/
│   ├── model/           # Model definitions and schemas
│   ├── components/      # Reusable UI components
│   ├── hooks/          # Svelte hooks
│   ├── styles/         # CSS and styling
│   └── utils/          # Utility functions
├── routes/             # SvelteKit page routes
└── lib/application/    # Main application structure
```

### Svelte 5 Specific Guidelines

- **Snippets**: Use `{#snippet name()}` instead of slots
- **Children Rendering**: Use `{@render children()}` in layout components
- **Props**: Use `$props()` for accessing component props
- **Bindings**: Use `$bindable()` for two-way bindings

### Model and Data Guidelines

- **Timeline Events**: Ordered array of `{ time: number, frame: TimelineFrame }`
- **Asset References**: Use short IDs that match `assets.characters[]`, `assets.environments[]`, `assets.audio[]`
- **Validation**: Always validate with `modelSchema.safeParse()` before processing
- **Deep Cloning**: Use `createModelTemplate()` for safe model mutations

### Styling Guidelines

- **Framework**: Tailwind CSS v4
- **Design System**: shadcn-svelte components (do not modify in `src/lib/components`)
- **Layout**: CSS Grid for complex layouts, avoid unnecessary flexbox
- **Responsive**: Use Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`)
- **Accessibility**: Include proper ARIA labels and keyboard navigation

### Testing Guidelines

- **Unit Tests**: Use Vitest for component and utility testing
- **E2E Tests**: Use Playwright for end-to-end testing
- **Test Structure**: Place tests alongside source files (e.g., `component.svelte` → `component.test.ts`)
- **Mock Data**: Use `createModelTemplate()` for consistent test data

### Security and Performance

- **Input Validation**: Use Zod to validate all external inputs
- **Asset URLs**: Validate URLs with `isUrlOrFile()` helper to prevent path traversal
- **Performance**: Use `min-h-[100dvh]` for full-height sections, optimize animations
- **Bundle Size**: Avoid importing large libraries unnecessarily

## Important Notes

### shadcn-svelte Components

- **Never modify components in `src/lib/components`** - these are shadcn components
- **Customize via composition**: Create new components or extend existing ones
- **UI Customizations**: Use the `taste-skill` conventions for custom UI development

### Model Schema

- **Reference**: See `src/lib/model-types.ts` for TypeScript interfaces
- **Validation**: Use `modelSchema` from `src/lib/model-template.ts`
- **Examples**: Check `src/lib/model-example.ts` for usage patterns

### Svelte MCP Integration

- **Documentation**: Use Svelte MCP server for Svelte 5 and SvelteKit documentation
- **Code Analysis**: Use `svelte-autofixer` for code validation before sending to users
- **Playground**: Generate playground links with `playground-link` after user confirmation

### Development Workflow

1. **Setup**: Run `pnpm install` to install dependencies
2. **Development**: Use `pnpm run dev` for hot reloading
3. **Type Checking**: Run `pnpm run check` before commits
4. **Testing**: Run `pnpm test` to ensure all tests pass
5. **Linting**: Run `pnpm run lint` to check code style

## Repository Context

This is a SvelteKit (Svelte 5) + Vite SPA project with TypeScript, focused on video timeline orchestration. The codebase uses:

- **UI**: Svelte 5 with snippets, Tailwind CSS v4, shadcn-svelte
- **Data**: Zod for validation, TypeScript for type safety
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Architecture**: BMAD method for project management and development

Always refer to `GUIDELINES.md` for detailed technical specifications and `SVELTE.md` for Svelte-specific conventions.
