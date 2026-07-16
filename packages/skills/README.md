# `@agenticswe/skills`

Versioned, read-only distribution of the public skills maintained in the Agentic SWE repository. The canonical source remains the root `skills/` directory; package assets and the integrity manifest are generated from it.

```ts
import { listSkills, loadSkill, verifySkillIntegrity } from "@agenticswe/skills";

const metadata = listSkills();
const planner = await loadSkill("iterations-planner");
const valid = await verifySkillIntegrity(planner.name);
```

Hosts can resolve skill metadata and content from the installed package without cloning the repository or embedding copies in their own source tree. No API writes to user skill directories.
