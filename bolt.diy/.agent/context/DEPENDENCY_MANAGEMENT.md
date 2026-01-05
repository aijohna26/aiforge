# Dependency Management Policy

## Problem Statement

The E2B SDK version updated unexpectedly from 2.3.3, causing `sandbox.files.writeBytes is not a function` errors. This should NOT happen outside of CI/controlled processes.

## Root Cause

**package.json had caret prefix**: `"@e2b/code-interpreter": "^2.3.3"`
- Allows versions: 2.3.3, 2.3.4, 2.4.0, etc. (anything < 3.0.0)
- Non-deterministic: Different versions could be installed on different machines
- Breaking changes can sneak in via minor/patch updates

## Protection Layers

### Layer 1: Lockfile (Primary Defense) ✅

**File**: `pnpm-lock.yaml`

**Status**: Committed to git, locks E2B to exactly 2.3.3

**How it protects**:
```bash
# Safe - uses lockfile
pnpm install

# Dangerous - ignores lockfile
pnpm install --no-frozen-lockfile
pnpm update @e2b/code-interpreter
```

**Best Practice**:
- ✅ Always commit lockfile changes with dependency updates
- ✅ Review lockfile diffs in PRs
- ❌ NEVER add lockfile to .gitignore
- ❌ NEVER use `pnpm update` without approval

### Layer 2: .npmrc Configuration ✅

**File**: `.npmrc`

**Settings**:
```ini
save-exact=true        # New deps added without ^ or ~
save-prefix=''         # Removes prefixes from existing deps
lockfile=true          # Requires lockfile to exist
```

**How it protects**:
- Running `pnpm add new-package@1.2.3` will save as `"1.2.3"` (not `"^1.2.3"`)
- Prevents version drift for new dependencies

**Note**: This does NOT retroactively fix existing `^` in package.json. You'd need to manually remove them or run:
```bash
pnpm install --save-exact
```

### Layer 3: CI Frozen Lockfile (Recommended)

**Where**: GitHub Actions / CI pipeline

**Configuration**:
```yaml
# .github/workflows/ci.yml
- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

**How it protects**:
- CI will FAIL if lockfile is out of sync with package.json
- Prevents sneaky updates from passing tests
- Forces developers to commit lockfile changes

**Status**: ⚠️ TODO - Add to CI pipeline

### Layer 4: Dependabot / Renovate (Optional)

**Purpose**: Controlled, automated dependency updates via PRs

**Configuration** (Dependabot example):
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/bolt.diy"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    reviewers:
      - "your-team"
```

**How it protects**:
- Updates go through PR review process
- Tests run before merge
- Clear changelog of what changed

**Status**: ⚠️ Optional - Consider adding

## How Version Drift Happens

### Scenario 1: Lost Lockfile
```bash
# Developer accidentally deletes pnpm-lock.yaml
rm pnpm-lock.yaml

# Runs install - gets latest matching versions
pnpm install

# E2B updates from 2.3.3 -> 2.4.0 (breaking change)
```

### Scenario 2: No Frozen Lockfile in CI
```bash
# CI runs install without --frozen-lockfile
pnpm install

# Lockfile is slightly out of sync
# CI auto-updates to latest matching version
# Tests pass with 2.4.0
# Production still has 2.3.3 from old lockfile
```

### Scenario 3: Manual Update Without Testing
```bash
# Developer runs update
pnpm update @e2b/code-interpreter

# Gets 2.4.0, commits lockfile
# Doesn't test thoroughly
# Breaking change deployed to production
```

## Controlled Update Process

### 1. Check for Updates
```bash
# List outdated packages
pnpm outdated

# Check specific package
pnpm outdated @e2b/code-interpreter
```

### 2. Review Changelog
- Visit package repository
- Read CHANGELOG.md for breaking changes
- Check GitHub issues for known bugs

### 3. Update in Isolated Branch
```bash
git checkout -b update/e2b-sdk-2.4.0

# Update specific package
pnpm update @e2b/code-interpreter@2.4.0

# Review lockfile diff
git diff pnpm-lock.yaml
```

### 4. Test Thoroughly
- Run all tests
- Manual testing of affected features
- Check for deprecation warnings

### 5. Commit with Context
```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: Update @e2b/code-interpreter to 2.4.0

- Updated API calls for v2.4.0 compatibility
- Tested sandbox file operations
- No breaking changes detected

Closes #123"
```

### 6. PR Review Checklist
- ✅ Lockfile committed
- ✅ Tests pass
- ✅ Changelog reviewed
- ✅ Manual testing completed
- ✅ No unexpected dependencies updated

## Emergency Rollback

If a bad update makes it to production:

```bash
# Revert the commit
git revert <commit-hash>

# Force reinstall from reverted lockfile
rm -rf node_modules
pnpm install --frozen-lockfile

# Deploy
```

## Package.json Cleanup (Optional)

To remove all `^` and `~` prefixes from existing dependencies:

```bash
# Backup first
cp package.json package.json.backup

# Option 1: Manual (safest)
# Edit package.json and remove ^ and ~ manually

# Option 2: Automated
pnpm install --save-exact
```

**Warning**: This will update ALL dependencies to their latest matching versions. Do this in a controlled environment with full testing.

## Current Status

✅ **Protected**:
- pnpm-lock.yaml committed and tracked
- E2B locked to exactly 2.3.3
- .npmrc enforces exact versions for new deps
- ✅ **ALL `^` and `~` prefixes removed from package.json**
- ✅ Lockfile updated with exact versions

⚠️ **TODO**:
- Add `--frozen-lockfile` to CI pipeline
- Consider Dependabot for automated updates

🛡️ **Risk Level**: Very Low (maximum protection)

## Quick Reference

```bash
# ✅ SAFE COMMANDS
pnpm install                          # Use lockfile
pnpm install --frozen-lockfile        # Fail if out of sync
pnpm add new-package@1.2.3            # Add with exact version

# ⚠️ REQUIRES APPROVAL
pnpm update @e2b/code-interpreter     # Update specific package
pnpm update                           # Update all packages

# ❌ DANGEROUS
pnpm install --no-frozen-lockfile     # Ignore lockfile
rm pnpm-lock.yaml && pnpm install     # Regenerate lockfile
```

## Summary

Your project is already well-protected by the committed lockfile. The E2B version drift likely happened due to one of:
1. Running `pnpm update` manually
2. CI not using `--frozen-lockfile`
3. Lockfile being out of sync

With the new `.npmrc` in place and CI using `--frozen-lockfile`, this won't happen again.
