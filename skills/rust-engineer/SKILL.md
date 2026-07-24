---
name: rust-engineer
description: Senior-level Rust engineering across full-stack web applications (Leptos SSR, Axum, SQLx, browser sessions, progressive enhancement, realtime, testing, and deployment), backend services, native desktop, GPU rendering, WASM frontends, and local inference engines. Use for Rust, Cargo, ownership, lifetimes, unsafe, Tokio, Axum, SQLx, Leptos, Dioxus, Tauri, egui, iced, Slint, wgpu, Bevy, Candle, Burn, mistral.rs, CUDA, Metal, ONNX, GGUF, safetensors, KV cache, quantization, SIMD, profiling, or Cargo quality tooling.
---

# Rust Engineer

Build clear, safe, high-performance Rust around the existing workspace and its actual toolchain. Recommend one well-reasoned direction rather than presenting an undifferentiated menu of alternatives.

## First Pass

Inspect `Cargo.toml`, workspace layout, feature flags, MSRV, CI, clippy configuration, current architecture, and performance constraints before editing. Use the versions already adopted by the project.

## Routing

- Full-stack web application, SaaS, SSR, browser authentication, progressively enhanced forms, realtime UI, or web deployment: read [references/fullstack-web.md](references/fullstack-web.md) before designing or editing. Then apply the backend and frontend rules below.
- HTTP services: Tokio, Axum, SQLx, `tracing`, typed errors, migrations, and integration tests.
- Native desktop: choose Tauri for web-tech product UI; use egui, iced, or Slint only when their native-widget tradeoffs fit the product.
- GPU and interactive rendering: use wgpu for portable rendering or compute; use Bevy when ECS and game-style tooling are desirable.
- Isolated WASM frontend: use the existing framework; choose Leptos for fine-grained Rust-first web UI and Dioxus only when its multi-platform model is useful.
- Local inference: define model format, tokenizer, batch model, KV-cache strategy, memory budget, and benchmark before choosing Candle, mistral.rs, custom kernels, CUDA, Metal, or wgpu compute.

## Core Rust Rules

- Prefer `&str` over `String`, slices over `Vec` references, and owned returns only when ownership is truly transferred.
- Do not clone on hot paths without a concrete ownership or concurrency reason.
- Use newtypes for domain identifiers and exhaustive enums for finite states.
- Use `thiserror` for library-facing typed errors and `anyhow` with context at application boundaries. Do not expose `anyhow` in public library APIs.
- Avoid `unwrap`, `expect`, and `panic` in production paths. Document each unavoidable `unsafe` block with a `SAFETY` invariant.

## Async and Performance

- Use Tokio for concurrent I/O and `spawn_blocking` for CPU-heavy synchronous work.
- Use Rayon for CPU parallelism; do not block the Tokio reactor with CPU-bound work.
- Profile before optimizing. Measure CPU, allocations, latency, throughput, and memory under representative workloads.
- Minimize allocations in hot loops, reuse buffers deliberately, and make cache locality and batch sizes explicit.
- Use architecture-specific optimization only after a portable baseline and benchmarks justify it.

## Backend and Data

- Keep handlers thin and move domain behavior into explicit services or modules.
- Validate every external input and map errors to stable HTTP responses.
- Use SQLx migrations or the repository's migration tool. Never generate production schema implicitly.
- Apply authentication, authorization, pagination, idempotency, and observability at the correct boundary.

## Full-Stack Web

- Default to Leptos SSR with hydration on Axum for a new Rust-first product; start from the official Axum template instead of inventing build plumbing.
- Use Leptos server functions for first-party UI operations and versioned REST endpoints for external consumers. Both must call the same application services.
- Make core navigation, reads, and form submissions work as progressively enhanced HTML where product requirements allow it.
- For browser login, prefer an opaque server-side session in a hardened cookie. Do not put long-lived credentials in browser storage.
- Treat cookie-authenticated mutations, including server functions, as CSRF-sensitive.
- Keep database rows, transport DTOs, view models, and domain types separate.
- Choose SSE for one-way notifications and WebSockets only when the client also needs to send a live stream.

## Inference and GPU Work

- Start with a small, correct baseline before adding quantization, fused kernels, speculative decoding, or continuous batching.
- Treat memory layout, mmap, tensor ownership, and KV-cache capacity as first-class design constraints.
- Use safe wrappers around FFI and validate untrusted model formats with fuzzing where appropriate.
- Benchmark prefill and decode separately and record hardware, batch, context length, precision, and model revision with results.

## Quality

- Run `cargo fmt`, `cargo clippy`, targeted tests, and the relevant build before completion.
- Use `cargo nextest`, `cargo deny`, sanitizers, Miri, or fuzzing when they fit the changed risk surface.
- For full-stack web work, validate server routes, real database behavior, SSR/hydration, and the critical browser journey; do not stop at unit tests.
- Keep feature flags, target-specific code, and unsafe boundaries narrow and tested.
