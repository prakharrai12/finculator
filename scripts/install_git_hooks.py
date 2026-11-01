#!/usr/bin/env python3
"""
Finculator Local Git Pre-Commit Hook Installer
Installs an automated client-side pre-commit hook in .git/hooks/pre-commit
to prevent accidental commits of API keys, private keys, or .env files.
"""

import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GIT_HOOKS_DIR = os.path.join(ROOT_DIR, '.git', 'hooks')
PRE_COMMIT_PATH = os.path.join(GIT_HOOKS_DIR, 'pre-commit')

def get_hook_content():
    # Assembled dynamically to avoid false-positive detection during self-scanning
    pattern_private = "BEGIN (RSA|EC|DSA|OPENSSH)? ?PRIVATE KEY"
    pattern_google = "AIza" + "[-0-9A-Za-z_]{35}"
    pattern_openai = "sk-" + "[0-9A-Za-z]{32,}"
    combined = f"({pattern_private}|{pattern_google}|{pattern_openai})"

    return f'''#!/bin/sh
# Finculator Pre-Commit Secret Scanner Hook
# Blocks committing secret keys, API credentials, or .env files.

echo "[SECURITY CHECK] Scanning staged files for secret credentials..."

# 1. Prevent staging .env files (except .env.example)
STAGED_ENV=$(git diff --cached --name-only | grep -E '^(\\.env|\\.env\\..*)$' | grep -v '\\.env\\.example$')
if [ -n "$STAGED_ENV" ]; then
    echo "ERROR: Attempting to commit an environment file with potential secrets: $STAGED_ENV"
    echo "Aborting commit. Keep .env files local and untracked."
    exit 1
fi

# 2. Prevent staging private keys or high-risk API key patterns
SECRET_MATCHES=$(git diff --cached -G"{combined}" --name-only)
if [ -n "$SECRET_MATCHES" ]; then
    echo "ERROR: Potential cryptographic key or API token detected in staged files: $SECRET_MATCHES"
    echo "Aborting commit. Please scrub all credentials before committing."
    exit 1
fi

echo "[SECURITY CHECK] Staged files verified clean."
exit 0
'''

def main():
    if not os.path.exists(GIT_HOOKS_DIR):
        print(f"Error: Git hooks directory not found at {GIT_HOOKS_DIR}")
        sys.exit(1)

    content = get_hook_content()
    with open(PRE_COMMIT_PATH, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

    try:
        import stat
        st = os.stat(PRE_COMMIT_PATH)
        os.chmod(PRE_COMMIT_PATH, st.st_mode | stat.S_IEXEC | stat.S_IXGRP | stat.S_IXOTH)
    except Exception:
        pass

    print(f"[OK] Pre-commit security hook installed successfully to: {PRE_COMMIT_PATH}")

if __name__ == '__main__':
    main()
