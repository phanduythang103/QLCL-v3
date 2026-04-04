# MCP CORE - DATA TABLE STANDARD

## 🎯 PURPOSE

Define standard table behavior across system.

---

# 🧠 TABLE FEATURES

Every table MUST support:

* Pagination
* Search
* Filter
* Sorting

---

# 📊 STRUCTURE

Table includes:

1. Header (search + actions)
2. Table content
3. Pagination

---

# 🔍 SEARCH RULE

* Search must be real-time or on submit
* Must search by main fields (name, code)

---

# 🔽 FILTER RULE

* Filter by:

  * date
  * category
  * status

---

# ↕ SORT RULE

* Columns must be sortable
* Default sort: created_at DESC

---

# 📄 TABLE UI

* Use class: table-base
* Header: table-header
* Border required (row + column)

---

# 🚫 AI RESTRICTIONS

* Do NOT create plain table without search
* Do NOT skip pagination
* Do NOT hardcode data

---

# 📌 BEST PRACTICE

* Use reusable table component
* Keep data logic separate

---

END
