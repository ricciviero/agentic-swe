# Hardware and Cloud Execution

Use local hardware for code development, tokenizer experiments, toy runs, overfit checks, lightweight evaluation, and inference smoke tests. Use cloud GPUs only after the pipeline is proven locally.

## Local Work

- Tokenizer training and validation.
- Tiny-model proof of life.
- One-batch overfit.
- Dataset streaming checks.
- Generation smoke tests.
- Export and inference tests.

Apple Silicon is useful for local iteration with MLX, PyTorch MPS, and small inference runs, but it is not a substitute for validated cloud training when the experiment requires sustained GPU throughput.

## Cloud Work

Before launching a paid GPU run, record:

- Model size and expected tokens.
- Dataset and shard source.
- Batch size, context length, precision, and checkpoint cadence.
- Expected runtime and hourly price.
- Storage and data transfer assumptions.
- Shutdown command or lifecycle policy.

Prefer interruptible/spot instances only when checkpointing is reliable. Keep checkpoints on durable storage and test resume before relying on it.

## Cloud Safety Checklist

- [ ] Local proof of life passed.
- [ ] One-batch overfit passed.
- [ ] Cost estimate recorded.
- [ ] Checkpoint/resume tested.
- [ ] Logs stream to persistent storage.
- [ ] Large datasets are streamed or mounted, not copied blindly to small disks.
- [ ] Shutdown path is documented.
