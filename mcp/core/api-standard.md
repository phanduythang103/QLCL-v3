# MCP CORE - API STANDARD

## 🎯 PURPOSE

Define how services interact with database/API.

---

# 🧠 PRINCIPLE

* Separate UI and data logic
* Use service layer
* Use hooks for data

---

# 📦 STRUCTURE

```id="z5n4lx"
/services
/hooks
```

---

# 📄 SERVICE RULE

Each module must have:

```ts
Service = {
  getAll,
  getById,
  create,
  update,
  delete
}
```

---

# 📄 EXAMPLE

```ts
export const Service = {
  async getAll() {},
  async create(data) {},
  async update(id, data) {},
  async delete(id) {}
};
```

---

# 🧩 HOOK RULE

* Use hook to fetch data
* Manage loading state
* Manage error state

---

# 📄 EXAMPLE

```ts
const { data, loading } = useData();
```

---

# 🚫 AI RESTRICTIONS

* Do NOT call API directly in component
* Do NOT mix UI and data logic

---

# 📌 BEST PRACTICE

* Keep service clean
* Reuse hooks
* Handle errors

---

END
