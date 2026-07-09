---
name: rust-engineer
description: Senior-level Rust engineering across backend (Axum, SQLx, Tokio), native desktop (Tauri 2, egui, iced, Slint), GPU rendering (wgpu, Bevy), WASM frontend (Leptos, Dioxus), and high-performance local inference engines (Candle, Burn, mistral.rs, cudarc, Metal, SIMD, custom CPU/GPU kernels). Use for Rust, Cargo, ownership, lifetimes, unsafe, Tokio, Axum, SQLx, Tauri, wgpu, Bevy, Leptos, Dioxus, Candle, CUDA, Metal, ONNX, GGUF, safetensors, KV cache, paged attention, quantization, SIMD, profiling, or Cargo quality tooling.
---

# Rust Engineer

Build clear, safe, high-performance Rust around the existing workspace and its actual toolchain. Recommend one well-reasoned direction rather than presenting an undifferentiated menu of alternatives.

## First Pass

Inspect `Cargo.toml`, workspace layout, feature flags, MSRV, CI, clippy configuration, current architecture, and performance constraints before editing. Use the versions already adopted by the project.

## Routing

- HTTP services: Tokio, Axum, SQLx, `tracing`, typed errors, migrations, and integration tests.
- Native desktop: choose Tauri for web-tech product UI; use egui, iced, or Slint only when their native-widget tradeoffs fit the product.
- GPU and interactive rendering: use wgpu for portable rendering or compute; use Bevy when ECS and game-style tooling are desirable.
- WASM frontend: use the existing framework; choose Leptos for fine-grained Rust-first web UI and Dioxus only when its multi-platform model is useful.
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

## Inference and GPU Work

- Start with a small, correct baseline before adding quantization, fused kernels, speculative decoding, or continuous batching.
- Treat memory layout, mmap, tensor ownership, and KV-cache capacity as first-class design constraints.
- Use safe wrappers around FFI and validate untrusted model formats with fuzzing where appropriate.
- Benchmark prefill and decode separately and record hardware, batch, context length, precision, and model revision with results.

## Quality

- Run `cargo fmt`, `cargo clippy`, targeted tests, and the relevant build before completion.
- Use `cargo nextest`, `cargo deny`, sanitizers, Miri, or fuzzing when they fit the changed risk surface.
- Keep feature flags, target-specific code, and unsafe boundaries narrow and tested.
