---
name: melix-llm-lab
description: Research and engineering workflow for training small language models from scratch, including tokenizer training, streaming data preparation, decoder-only Transformers, pretraining, SFT, DPO, evaluation, ONNX export, local Apple Silicon inference, and cloud GPU execution. Use for any small-LLM training lab, from-scratch GPT work, tokenizer, pretraining, fine-tuning, alignment, model evaluation, MLX, or cost-aware cloud training.
---

# Small LLM Research and Training Lab

Build reproducible small language models one validated stage at a time. Use this skill for from-scratch LLM projects.

## Core Rule

Never launch a large or paid cloud run before proving the pipeline locally at minimal scale:

1. Run a proof of life with a tiny model and a toy dataset.
2. Overfit one batch until loss approaches zero.
3. Confirm tokenization, data loading, forward pass, loss, checkpointing, and generation.
4. Scale parameters, data, and hardware gradually after recording an expected cost.

## Pipeline

Work on one stage until it has observable validation:

1. Tokenizer: SentencePiece or BPE with an explicit vocabulary and byte-fallback decision.
2. Data: stream or shard source data without filling local disks unnecessarily.
3. Pretraining: next-token prediction with repeatable configuration and checkpoints.
4. SFT: supervised prompt-response fine-tuning.
5. Alignment: optional preference optimization such as DPO.
6. Evaluation: validation loss, benchmarks, and qualitative samples.
7. Export: portable artifacts such as ONNX when needed.
8. Serving: local or hosted inference with a documented runtime contract.

## Architecture and Project Layout

Use a decoder-only Transformer unless the project has a justified alternative. A practical small-model baseline uses RMSNorm, RoPE, SwiGLU, grouped-query attention, and tied embeddings.

Keep code, experiments, and large artifacts separate:

```text
src/                 Shared model, training, and evaluation code
experiments/<name>/  Configuration, notes, and recorded results
data/                Local data staging when required
checkpoints/         Ignored model artifacts
```

Treat each experiment configuration as the reproducibility record. Capture architecture, tokenizer, data revision, hyperparameters, seed, hardware, cost, evaluation results, and artifact identifiers. Do not commit datasets or checkpoints unless the repository explicitly supports them.

## Local and Cloud Discipline

- Use local hardware for code development, small proofs, tokenizer experiments, lightweight evaluation, and inference.
- Use cloud GPUs only for validated, compute-heavy training stages.
- Estimate cost before every cloud launch: hourly price times expected duration, plus storage and data-transfer considerations.
- Use checkpointing and clear shutdown procedures for interruptible hardware.
- Prefer streaming or remote volumes for large datasets instead of filling a workstation disk.

## Workflow

1. Identify the active pipeline stage and its success criterion.
2. Choose local or cloud execution and record the cost boundary for cloud work.
3. Implement the smallest change that can be validated.
4. Run the relevant proof, overfit check, evaluation, or serving smoke test.
5. Update the experiment configuration and result notes before moving to the next scale.

Read [references/pipeline.md](references/pipeline.md) for stage details and [references/hardware-cloud.md](references/hardware-cloud.md) for execution guidance.
