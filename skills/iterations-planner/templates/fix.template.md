# Fix Plan - <NN> <Title>

> Write this plan after diagnosis, not before it.

## Root cause

<State where the defect originates and why, with file and line references. If unknown, make investigation the first step. Do not describe only the symptom.>

## Correction

### Step 1 - <name>

<specific change and files>

### Step 2 - <name>

<specific change and files>

## Propagation check

Search for the faulty pattern across the relevant module and record every result.

Pattern searched: `<pattern>`

- [ ] `<file:line>` - <corrected | already correct>
- [ ] `<file:line>` - <corrected | already correct>

## Regression validation

- [ ] A test fails before the fix and passes after it.
- [ ] The reported reproduction no longer fails.
- [ ] Adjacent paths verified: <paths>
- [ ] Relevant type, build, and test commands pass.

## Final report

| Check | Status | Evidence |
| --- | --- | --- |
| Root cause corrected | pass / partial / fail | `file:line` |
| Propagation complete | pass / partial / fail | searched locations |
| Regression coverage | pass / partial / fail | `test:line` |
| Adjacent paths checked | pass / partial / fail | summary |

Do not mark the fix resolved while a required row is partial or failing; state the remaining work explicitly.
