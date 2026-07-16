# Releasing Agentic SWE

Registry publication is a maintainer-only manual action. CI, ordinary contributor workflows, and coding agents may prepare and verify a release, but they must not run `npm publish`, create a release tag, or create a GitHub release without explicit maintainer authorization.

Agentic SWE uses one version across four public packages. Internal dependencies are exact versions, so publish in dependency order and verify every package before continuing:

1. `@agenticswe/core`
2. `@agenticswe/skills`
3. `@agenticswe/node`
4. `@agenticswe/cli`

## 1. Verify registry access

Authenticate as the intended maintainer and confirm access to the `agenticswe` npm organization:

```bash
npm whoami
npm org ls agenticswe
```

Stop on `403`. Create the npm organization or grant the maintainer access before changing tags, package names, or consumer manifests. Do not silently publish under a different scope: a scope change is a public API and documentation change across all four manifests.

Confirm that the version is not already present. For the initial release:

```bash
npm view @agenticswe/core@0.1.0 version
npm view @agenticswe/skills@0.1.0 version
npm view @agenticswe/node@0.1.0 version
npm view @agenticswe/cli@0.1.0 version
```

`E404` is expected before the first publication. Any returned version means that package must not be published again.

## 2. Verify the exact source commit

Merge the release pull request through protected `main`, then validate that exact clean checkout:

```bash
git switch main
git pull --ff-only
git status --short
git rev-parse HEAD
npm ci
npm run generate:check
npm run typecheck
npm test
npm run pack:check
npm run release:check
bash scripts/verify-agentic-project.sh .
```

All commands must pass and `git status --short` must remain empty. `release:check` is non-publishing; it validates package contents and exercises npm's publish dry-run.

After registry access and the source commit are both verified, create and push the annotated repository tag for that exact commit only when the maintainer has authorized the release:

```bash
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0
```

## 3. Publish manually

The maintainer runs these commands, one at a time, from the repository root. Complete npm's current authentication or OTP flow when requested. Local manual publication does not claim provenance; provenance should be added only through a trusted supported CI publisher.

```bash
npm publish ./packages/core --access public
npm view @agenticswe/core@0.1.0 name version dist.integrity --json

npm publish ./packages/skills --access public
npm view @agenticswe/skills@0.1.0 name version dist.integrity --json

npm publish ./packages/node --access public
npm view @agenticswe/node@0.1.0 name version dependencies dist.integrity --json

npm publish ./packages/cli --access public
npm view @agenticswe/cli@0.1.0 name version dependencies bin dist.integrity --json
```

Do not continue after a failed verification. If publication stops partway through, keep already-published packages intact, diagnose the failure, and resume only with packages whose exact version is still absent. Never unpublish a partially released public version as a routine rollback; correct forward with a new patch version when necessary.

## 4. Verify the public consumer path

After all four packages are visible on the registry, verify an install that cannot resolve local workspaces:

```bash
tmpdir="$(mktemp -d)"
cd "$tmpdir"
npm init -y
npm install --save-exact \
  @agenticswe/core@0.1.0 \
  @agenticswe/node@0.1.0 \
  @agenticswe/skills@0.1.0 \
  @agenticswe/cli@0.1.0
./node_modules/.bin/agentic-swe --version
```

Then pin the same exact versions in each host repository and rerun its clean-install, behavior, and end-to-end checks. Interference is released independently; publishing Agentic SWE does not imply an Interference release.

Create the GitHub release only after registry and clean-consumer verification succeed. Record the tag, source commit, package versions, CI run, and consumer evidence in the release notes.
