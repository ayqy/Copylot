This snippet builds a prompt payload and should preserve code fences when copied as a mixed Markdown block.

```
function buildPrompt() {
  const tag = "\#summary";
  const docs = ["\[intro\]", "outline"];

  return docs.join("\\n");
}
```

```
const steps = [
  "install",
  "verify",
];
```
