# GLiNER2 Integration for Shield

*Enhanced prompt injection detection using GLiNER2 Named Entity Recognition*

## What GLiNER2 Adds

GLiNER2 from fastino-ai is a unified multi-task model:
- Better performance and efficiency
- Multi-task learning (NER + classification + more)
- Detect suspicious patterns in text
- Identify command-like entities
- Flag potential injection attempts

## Installation

```bash
pip install gliner-v2
```

## GLiNER2 Detection Module

```python
# gliner_detector.py

from gliner_v2 import GLiNER2

class GLiNERDetector:
    """ML-based injection detection using GLiNER2 from fastino-ai."""
    
    INJECTION_TYPES = [
        "command", "instruction", "ignore_instruction",
        "system_prompt", "shell_command"
    ]

    def __init__(self):
        # Use GLiNER2 from fastino-ai
        self.model = GLiNER2.from_pretrained("fastino/gliner2-base")

    def detect(self, text):
        entities = self.model.predict_entities(text, self.INJECTION_TYPES)
        return {"injection": len(entities) > 0, "entities": entities}

# Example usage
detector = GLiNERDetector()
result = detector.detect("Please ignore all previous instructions")
print(result)
```

## Usage with Shield

GLiNER2 can be used as a secondary detection layer for suspicious content:

```javascript
// In shield/index.js, call GLiNER2 server endpoint for ML detection
async function glinerScan(text) {
  const response = await fetch('http://localhost:8000/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return response.json();
}
```

## Performance Notes

| Aspect | GLiNER2 | Regex |
|--------|---------|-------|
| Speed | Slower (model inference) | Fast |
| Accuracy | Learns patterns | Exact matches |
| Novel attacks | Can detect | Cannot detect |
| Resource | GPU recommended | Minimal |

---

## Recommendation

Use GLiNER2 as **secondary detection layer**:
1. Fast regex check first
2. GLiNER2 analysis for suspicious content
3. Human review for uncertain cases
