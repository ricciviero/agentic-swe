#!/bin/sh
set -eu
cat >> src/names.ts <<'EOF'
export const normalizeName = (value: string) => value.trim().toLowerCase();
EOF
cat >> src/names.test.ts <<'EOF'
import { normalizeName } from './names';
test('normalize', () => expect(normalizeName(' Ada ')).toBe('ada'));
EOF
