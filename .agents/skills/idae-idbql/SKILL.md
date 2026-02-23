# ---
name: idae-idbql-commands
description: Exhaustive command and API reference for @medyll/idae-idbql. Use to list, autocomplete, or document all collection methods and advanced query patterns available via createIdbqlState or createIdbqDb.
# ---

# idae-idbql Command Reference Skill

This skill provides a comprehensive list of all commands and methods available in the `@medyll/idae-idbql` library, accessible via the main entry point (`createIdbqlState`, `createIdbqDb`, or similar). Use this skill to discover, use for coding, autocomplete, or document all available operations for IndexedDB collections managed by idae-idbql.

---

## Overview

The idae-idbql API exposes a MongoDB-like, chainable interface for working with IndexedDB collections. All collection methods are available via the `idbql` object returned from `createIdbqlState` or `createIdbqDb(...).create(...)`.

### Access Pattern

```typescript
const { idbql } = createIdbqDb(model, version).create('my_db');
// or
const idbql = createIdbqlState(idbqlCoreInstance);

// Access a collection:
idbql.users.method(...)
```

---

## Collection Methods

Each collection (e.g., `idbql.users`, `idbql.tasks`) exposes the following methods:

### Reading Data
- **where(query, options?)**: Advanced filtering with operator support. Returns a ResultSet or Promise<ResultSet>.
- **get(id, pathKey?)**: Get a single item by key (default: 'id').
- **getBy(value, pathKey?)**: Get all items matching a key/value pair.
- **getOne(id, pathKey?)**: Alias for `get` (deprecated).
- **getAll()**: Get all items in the collection.
- **count(query?)**: Count documents, optionally filtered by a query.

---

## Query Syntax & Operators (idae-query compatible)

idae-idbql fully supports the advanced query syntax and operator set from `@medyll/idae-query`. All query, transformation, and aggregation methods are available on collection result sets.

### Supported Operators

- `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$contains`, `$startsWith`, `$endsWith`, `$btw`, `$or`, `$and` (and custom operators)

#### Example:
```typescript
idbql.users.where({
	age: { $gt: 18 },
	name: { $contains: 'Jo' },
	$or: [
		{ status: 'active' },
		{ featured: true }
	]
});
```

### Dot-path Resolution

All query and transformation methods support dot-paths for nested property access:
```typescript
idbql.orders.where({ 'metadata.order': { $eq: 2 } });
idbql.orders.sortBy({ 'metadata.order': 'asc' });
```

---

## Chainable Methods (ResultSet API)

All methods below are chainable and type-safe, matching idae-query's API:

- **filter(predicate)**: Filter by function
- **map(mapper)**: Transform items
- **distinct(key?)**: Remove duplicates (optionally by dot-path)
- **reverse()**: Reverse order
- **sortBy(sortOptions)**: Multi-criteria sorting
- **groupBy(groupBy, keepUngroupedData?)**: Group by property
- **getPage(page, pageSize)**: Pagination
- **count(criteria?)**: Count items (optionally filtered)
- **pluck(field)**: Extract array of field values
- **reduce(reducer, initialValue)**: Custom reduction
- **first()**: Get first item
- **last()**: Get last item
- **sum(field)**: Sum numeric values
- **avg(field)**: Average numeric values
- **min(field)**: Minimum numeric value
- **max(field)**: Maximum numeric value

#### Example:
```typescript
const adults = idbql.users.where({ age: { $gte: 18 } });
const sorted = adults.sortBy({ age: 'asc', name: 'desc' });
const grouped = adults.groupBy('age');
const page = adults.getPage(1, 10);
const stats = {
	total: adults.count(),
	averageAge: adults.avg('age'),
	minAge: adults.min('age'),
	maxAge: adults.max('age'),
};
```

---

## Aggregation & Transformation Examples

```typescript
// Statistical analysis
const stats = {
	total: idbql.users.count(),
	adults: idbql.users.count({ age: { $gte: 18 } }),
	averageAge: idbql.users.avg('age'),
	minAge: idbql.users.min('age'),
	maxAge: idbql.users.max('age'),
};

// Data transformation pipeline
const report = idbql.users.where({ age: { $gte: 18 } })
	.reduce((acc, item) => {
		acc.total++;
		acc.ages.push(item.age);
		acc.names.push(item.name);
		return acc;
	}, { total: 0, ages: [], names: [] });

// Distinct with filtering
const uniqueRoles = idbql.users.distinct('role').pluck('role');
```

---

## Custom Operators

You can add custom operators via `idae-query`:
```typescript
import { Operators } from '@medyll/idae-query';
Operators.addCustomOperator('isEven', (field, value, data) => data[field] % 2 === 0);
const evenUsers = idbql.users.where({ age: { isEven: true } });
```

---

## Type Safety & Generics

All methods are fully type-safe and support deep generics. Define your model types for maximum safety:
```typescript
type User = { id: number; name: string; age: number; metadata: { order: number } };
const model = { users: { keyPath: '++id', ts: {} as User } };
const { idbql } = createIdbqDb(model, 1).create('my_db');
```

---

## Reactivity

idae-idbql is state-agnostic. Use Svelte 5 runes (`$derived`, `$state`) or idae-stator for reactive updates. All query chains are compatible with Svelte 5 reactivity.

---

## Compatibility

- Fully compatible with all idae-query methods and syntax
- IndexedDB persistence with MongoDB-like querying
- Works in browser environments
- Supports Svelte 5 and idae-stator for reactivity

---

## See Also

- [idae-query README](https://github.com/medyll/idae-query)
- [idae-idbql README](README.md)

### Writing Data
- **put(data)**: Insert or update an item. Returns the inserted/updated item.
- **add(data)**: Insert a new item. Returns the inserted item.
- **update(id, changes)**: Update an item by key.
- **updateWhere(query, changes)**: Bulk update items matching a query.

### Deleting Data
- **delete(id)**: Delete an item by key.
- **del(id)**: Alias for `delete` (deprecated).
- **deleteWhere(query)**: Bulk delete items matching a query.

---

## Method Signatures

```typescript
// Reading
where(query: Where<T>, options?: ResultsetOptions): ResultSet<T> | Promise<ResultSet<T>>
get(id: any, pathKey?: string): T | undefined
getBy(value: any, pathKey?: string): ResultSet<T>
getOne(id: any, pathKey?: string): T | undefined // deprecated
getAll(): ResultSet<T> | Promise<T[]>
count(query?: Where<T>): Promise<number | undefined>

// Writing
put(data: Partial<T>): Promise<T | undefined>
add(data: T): Promise<T | undefined>
update(id: string | number, changes: Partial<T>): Promise<boolean | undefined>
updateWhere(query: Where<T>, changes: Partial<T>): Promise<boolean | undefined>

// Deleting
delete(id: string | number): Promise<boolean | undefined>
del(id: string | number): Promise<boolean | undefined> // deprecated
deleteWhere(query: Where<T>): Promise<boolean | undefined>
```

---

## Usage Example

```typescript
// Insert a user
await idbql.users.put({ name: 'Alice', age: 30 });

// Query users
const adults = await idbql.users.where({ age: { $gte: 18 } });

// Update users
await idbql.users.updateWhere({ active: true }, { lastLogin: Date.now() });

// Delete a user
await idbql.users.delete(123);
```

---

## Notes
- All methods are type-safe and support TypeScript generics.
- Query operators (`$gt`, `$in`, `$or`, etc.) are supported via `@medyll/idae-query`.
- For reactivity, use Svelte 5 runes or idae-stator as described in the main documentation.
- Deprecated methods (`getOne`, `del`) are included for backward compatibility.

---

## Advanced Examples

### Complex Query Example

```typescript
// Complex filtering with object-style syntax
const results = await idbql.posts.where({
	status: 'published',
	tags: { $in: ['svelte', 'idb'] },
	views: { $gt: 100 },
	$or: [
		{ author: 'Mydde' },
		{ featured: true }
	]
}).toArray();
```

### Svelte 5 Runes Example

```svelte
<script lang="ts">
import { createIdbqDb } from '@medyll/idae-idbql';

const { idbql } = createIdbqDb(model, 1).create('my_app_db');

// Use $derived to create reactive views of your data
let adults = $derived(idbql.users.where({ age: { $gte: 18 } }));
</script>

{#each adults.value as user}
	<p>{user.name}</p>
{/each}
```

### idae-stator Example

```typescript
import { createIdbqDb } from '@medyll/idae-idbql';

const { idbql } = createIdbqDb(model, 1, { engine: 'stator' }).create('my_app_db');

const query = idbql.users.where({ role: 'admin' });
query.onchange((oldValue, newValue) => {
	console.log('Data updated:', newValue);
});
```
