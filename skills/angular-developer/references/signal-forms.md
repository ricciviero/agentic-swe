# Signal Forms

## Selection and Version

Use Signal Forms when selected by the project and supported by its Angular version. Check the matching official API documentation and stability status before using form, FormField, submit, schema helpers, or async validation. Preserve an established Reactive Forms setup unless migration is requested.

Examples are API illustrations, not product requirements. Do not force every field to be non-null or change an absent numeric value to zero. Preserve domain/API semantics; use an explicit input adapter when a particular control expects another value representation.

## State Ownership

Signal Forms use a model signal and a field tree derived from it. Define typed model boundaries before binding controls. Keep the model as the owner of its values; avoid duplicate mutable form models and API records.

A field tree node is called to access its field state; the schema path passed to rules is a different object and is not a signal. Consult the selected version's types rather than treating all objects named field as interchangeable.

The following fragment illustrates the core pattern on a version supporting these APIs:

```ts
import {signal} from '@angular/core';
import {form, required, email} from '@angular/forms/signals';

const model = signal({email: ''});
const fields = form(model, (path) => {
  required(path.email);
  email(path.email);
});

const emailValue = fields.email().value();
const touched = fields.email().touched();
```

In a component template, import the supported FormField directive and bind the actual field tree node through [formField]. Keep labels, error messages, and accessibility states explicit.

## Validation and Availability

- Use schema rules matching the actual business contract and version-specific signatures. Keep validation messages in the product language.
- Read sibling values/state through the documented rule context (such as valueOf/stateOf) rather than calling schema paths.
- Keep disabled/readonly rules owned by the form when the directive manages those states; avoid a second conflicting binding on the same control.
- Confirm support for each native/custom control and value type. Do not assume every control accepts null, every checkbox accepts arrays, or every select supports a proposed binding.
- Use documented conditional/array schema helpers for the selected version. Verify callback signatures rather than copying another major's examples.
- For asynchronous validation, use the supported async validation API with cancellation/stale-result behavior, pending feedback, and defined failure handling. A synchronous validator cannot validate a network response.
- Server validation remains authoritative. Preserve domain error mapping for errors returned on submission.

## Submission and Restoration

Use the version's submit API and handle its promise when asynchronous behavior is involved. Verify invalid/pending form behavior, duplicate submissions, success, and failure. Do not impose async keyword style as a substitute for the required return contract.

Keep dirty/touched state, reset behavior, edit data hydration, nullable/unset semantics, and navigation-away behavior aligned with the feature. Explicitly adapt DTOs if their types differ from the form model.

## Testing and Common Diagnosis

Test the relevant user behavior: control binding, validation visibility, async failure, submission, edit/reset, and accessibility. A documentation example does not justify adding product constraints or migrating unrelated screens.

- A missing field-state method often means the field-tree node was not called.
- A non-callable schema path should be read through the documented rule context.
- A rejected value/control type needs a typed adapter or a supported control, not a blind cast.
- A missing pipe usually requires importing the standalone pipe/CommonModule as appropriate; it does not imply replacing locale-aware formatting with toFixed.
- Nested @for scopes use named outer variables; do not assume a $parent variable exists.
- Confirm API declarations for the actual installed version when a snippet does not compile.

## Sources

- [Signal Forms overview](https://angular.dev/guide/forms/signals/overview)
- [Signal Forms API](https://angular.dev/api/forms/signals)
- [Reactive Forms](https://angular.dev/guide/forms/reactive-forms)
