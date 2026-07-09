# Training Pipeline

Move through the pipeline one validated stage at a time.

## 1. Tokenizer

Choose SentencePiece or BPE and document vocabulary size, byte fallback, normalization, special tokens, and training corpus. Verify encode/decode round trips and inspect samples before training.

## 2. Data

Use streaming or sharded datasets. Record source, license, filters, deduplication, language mix, train/validation split, and token counts. Do not commit datasets unless the repository explicitly supports them.

## 3. Pretraining

Start with a tiny model and a toy dataset. Then overfit one batch until loss approaches zero. Only then scale context length, width/depth, token count, and hardware.

Record architecture, optimizer, LR schedule, precision, seed, batch size, gradient accumulation, checkpoint cadence, and validation loss.

## 4. SFT

Use supervised prompt-response data with a stable chat template. Separate API DTOs from rendered text format. Keep validation prompts fixed for comparison across runs.

## 5. Preference Optimization

DPO or similar alignment is optional. Use it only after a working SFT checkpoint and a licensed preference dataset.

## 6. Evaluation

Track validation loss, task benchmarks where relevant, qualitative samples, regressions, and safety failures. Keep evaluation scripts deterministic.

## 7. Export and Serving

Export only after the training artifact is validated. Document tokenizer files, model weights, runtime, expected inputs, output format, and sampling defaults. Use ONNX, MLX, GGUF, or another format only when it matches the target runtime.
