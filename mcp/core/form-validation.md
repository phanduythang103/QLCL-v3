# MCP CORE - FORM VALIDATION

## 🎯 PURPOSE

Ensure all forms have proper validation.

---

# 🧠 VALIDATION RULE

Every form MUST:

* Validate required fields
* Validate data type
* Show error message

---

# 📊 REQUIRED FIELDS

* Name
* Date
* Key identifiers (e.g. patient ID)

---

# ⚠️ ERROR DISPLAY

* Show error under input
* Use red color
* Clear message

---

# 📄 EXAMPLE

```tsx
{error && <p className="error-text">Required</p>}
```

---

# 🚫 AI RESTRICTIONS

* Do NOT allow empty submit
* Do NOT skip validation

---

# 🏥 MEDICAL RULE

* Date must be valid
* Numeric values must be correct range
* No ambiguous input

---

# 📌 BEST PRACTICE

* Validate before submit
* Validate again on server

---

END
