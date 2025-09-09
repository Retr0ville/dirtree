# Dir3 - Directory Tree Generator

A command-line utility to generate directory tree files with customizable ignore patterns.

## Installation

You can run this utility directly with npx without installation:

```bash
npx dir3
```

Or install it globally:

```bash
npm install -g dir3
```

## Usage

Navigate to any directory and run:

```bash
dir3
```

This will:
1. Check for a `.dir3.ignore` file in the current directory
2. If not found, prompt you to create one with default patterns or custom patterns
3. Generate a `directory-tree.txt` file with the directory structure

## Use case example
add dir3 to your `package.json` scripts to generate a directory tree after building your project for new team members (or your future self) to see the project structure at a glance:

```bash
"build": "tsc && dir3"
```

### First Run

On the first run in a directory, you'll be prompted:

```
.dir3.ignore not found. Create with default ignore patterns? (Y/n)
```

- **Yes (default)**: Creates `.dir3.ignore` with common ignore patterns
- **No**: Allows you to specify custom ignore patterns

### Default Ignore Patterns

The default `.dir3.ignore` includes common directories and files that are typically excluded:

- `node_modules` - Node.js dependencies
- `.git` - Git repository data
- `dist`, `build`, `out` - Build outputs
- `__pycache__`, `.pytest_cache` - Python cache
- `venv`, `.venv` - Python virtual environments
- `.idea`, `.vscode` - IDE configuration
- `*.log` - Log files
- `.DS_Store` - macOS system files
- `coverage` - Test coverage reports
- And many more...

## Ignore File Format

The `.dir3.ignore` file supports:

- **Exact names**: `node_modules`
- **Wildcards**: `*.log`, `temp*`
- **Comments**: Lines starting with `#`
- **Empty lines**: Ignored

Example `.dir3.ignore`:
```
# Dependencies
node_modules
vendor

# Build outputs  
dist
build
*.min.js

# Logs
*.log
logs/

# OS files
.DS_Store
Thumbs.db
```

## Output

The generated `directory-tree.txt` contains:

- Generation timestamp
- Root directory path
- Ignore file location
- Tree structure with folders (📁) and files (📄)

Example output:
```
Directory Tree - Generated with dir3 on 2025-01-15T10:30:00.000Z
Root: /Users/example/my-project
Ignore file: .dir3.ignore
────────────────────────────────────────────────────────────────────────────────

📁 .
├── 📁 src
│   ├── 📄 index.ts
│   └── 📄 test.ts
│   └── 📁 components
│       ├── 📄 Header.js
│       └── 📄 Footer.js
├── 📄 .dir3.ignore
├── 📄 package.json
├── 📄 README.MD
└── 📄 tsconfig.json

```

# Run tests
npm test

# Or run directly after building

```bash
npm run build
```

```bash
node dist/test.js
```

## Features

- **Interactive setup**: Prompts for ignore file creation on first run
- **Optimized performance**: Efficient directory traversal with depth limits
- **Smart filtering**: Supports glob-like patterns in ignore files
- **Error handling**: Gracefully handles permission issues and broken symlinks
- **Sorted output**: Directories first, then files, all alphabetically sorted
- **Visual indicators**: Clear folder and file icons in output

## Requirements

- Node.js 14.0.0 or higher

## License

MIT

## Repository
[GitHub - dir3](https://github.com/Retr0ville/dirtree)