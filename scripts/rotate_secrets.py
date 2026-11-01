#!/usr/bin/env python3
"""
Finculator Zero-Downtime Secret Rotation Engine
Generates cryptographically random 256-bit keys and assists in bi-annual rotation of:
- SECRET_KEY (primary) & SECRET_KEY_FALLBACK (grace window)
- PASSWORD_PEPPER (primary) & PASSWORD_PEPPER_FALLBACK (grace window)
- ADMIN_API_KEY (administrative endpoints)

Usage:
    python scripts/rotate_secrets.py [--apply] [--dry-run]
"""

import os
import sys
import secrets
import argparse

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(ROOT_DIR, '.env')

def generate_key(prefix: str, byte_length: int = 32) -> str:
    """Generates high-entropy cryptographic hex token."""
    return f"{prefix}_{secrets.token_hex(byte_length)}"

def parse_env_file(filepath: str) -> dict:
    """Parses .env file into key-value map while preserving comments and spacing."""
    env_vars = {}
    if not os.path.exists(filepath):
        return env_vars
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            stripped = line.strip()
            if not stripped or stripped.startswith('#') or '=' not in stripped:
                continue
            k, v = stripped.split('=', 1)
            env_vars[k.strip()] = v.strip().strip("'\"")
    return env_vars

def main():
    parser = argparse.ArgumentParser(description="Rotate Finculator cryptographic secrets with zero downtime.")
    parser.add_argument('--apply', action='store_true', help="Apply generated keys directly to local .env file")
    parser.add_argument('--dry-run', action='store_true', help="Print generated keys and rotation commands without modifying files")
    args = parser.parse_args()

    current_env = parse_env_file(ENV_FILE)
    old_secret = current_env.get('SECRET_KEY', '')
    old_pepper = current_env.get('PASSWORD_PEPPER', old_secret)
    old_admin = current_env.get('ADMIN_API_KEY', '')

    new_secret = generate_key("prod_sec", 32)
    new_pepper = generate_key("prod_pep", 32)
    new_admin = generate_key("prod_adm", 24)

    print("=" * 75)
    print("FINCULATOR CRYPTOGRAPHIC SECRET ROTATION UTILITY")
    print("=" * 75)
    print("\n[1] GENERATED CRYPTOGRAPHIC KEYS (256-BIT HIGH ENTROPY):")
    print(f"  NEW SECRET_KEY:             {new_secret}")
    print(f"  NEW PASSWORD_PEPPER:        {new_pepper}")
    print(f"  NEW ADMIN_API_KEY:          {new_admin}")
    print(f"  SECRET_KEY_FALLBACK:        {old_secret if old_secret else '(none - previous key)'}")
    print(f"  PASSWORD_PEPPER_FALLBACK:   {old_pepper if old_pepper else '(none - previous pepper)'}")

    print("\n[2] ZERO-DOWNTIME ROTATION RUNBOOK:")
    print("  Stage 1: Set NEW keys in production environment while keeping fallback keys:")
    print(f"    SECRET_KEY = {new_secret}")
    print(f"    SECRET_KEY_FALLBACK = {old_secret}")
    print(f"    PASSWORD_PEPPER = {new_pepper}")
    print(f"    PASSWORD_PEPPER_FALLBACK = {old_pepper}")
    print("  Stage 2: Deploy server. Active sessions continue verifying via fallback key.")
    print("  Stage 3: Users logging in will have password hashes auto-upgraded to the new pepper.")
    print("  Stage 4: After 24-48 hours (when all active JWT sessions have expired or refreshed),")
    print("           remove the fallback keys to complete the cycle.")

    print("\n[3] VERCEL CLI ENVIRONMENT UPDATE COMMANDS:")
    print("  Run these commands to apply the new keys to your Vercel deployment:")
    print(f"    npx.cmd vercel env add SECRET_KEY production")
    print(f"    npx.cmd vercel env add SECRET_KEY_FALLBACK production")
    print(f"    npx.cmd vercel env add PASSWORD_PEPPER production")
    print(f"    npx.cmd vercel env add PASSWORD_PEPPER_FALLBACK production")
    print(f"    npx.cmd vercel env add ADMIN_API_KEY production")

    if args.apply:
        print("\n[4] APPLYING TO LOCAL .env FILE...")
        # Read full .env lines and replace or append
        lines = []
        if os.path.exists(ENV_FILE):
            with open(ENV_FILE, 'r', encoding='utf-8') as f:
                lines = f.readlines()

        keys_to_set = {
            'SECRET_KEY': new_secret,
            'SECRET_KEY_FALLBACK': old_secret,
            'PASSWORD_PEPPER': new_pepper,
            'PASSWORD_PEPPER_FALLBACK': old_pepper,
            'ADMIN_API_KEY': new_admin
        }

        updated_lines = []
        handled_keys = set()
        for line in lines:
            stripped = line.strip()
            matched = False
            for k, v in keys_to_set.items():
                if stripped.startswith(f"{k}="):
                    updated_lines.append(f"{k}={v}\n")
                    handled_keys.add(k)
                    matched = True
                    break
            if not matched:
                updated_lines.append(line)

        for k, v in keys_to_set.items():
            if k not in handled_keys:
                updated_lines.append(f"{k}={v}\n")

        with open(ENV_FILE, 'w', encoding='utf-8') as f:
            f.writelines(updated_lines)
        print("  [OK] Successfully updated local .env with rotated keys.")
    else:
        print("\n  (Pass --apply to write these rotated keys to local .env)")

    print("\n" + "=" * 75)

if __name__ == '__main__':
    main()
