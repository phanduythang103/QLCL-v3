# MCP CORE - UI SYSTEM (ENTERPRISE)

## 🎯 PURPOSE

Define UI/UX standards for the entire system.

Ensure:

* Consistency
* Readability
* Efficiency in medical workflow

---

# 🎨 COLOR SYSTEM

## Primary

* Primary color: #009900
* Used for:

  * Headers
  * Buttons
  * Active tabs
  * Key highlights

## Text

* Header text: white
* Normal text: #333

---

# 🔤 FONT SYSTEM

## Font Family

Use system font stack:

* Windows: Segoe UI
* macOS/iOS: San Francisco
* Android: Roboto
* Fallback: Arial, Helvetica, sans-serif

---

## Font Size

| Element       | Size    |
| ------------- | ------- |
| Table content | 13px    |
| Table header  | 12px    |
| Sidebar       | 12px    |
| Button        | 11px    |
| Title         | 16–18px |

---

# 📊 TABLE SYSTEM

## Table Rules

* Must have borders:

  * Rows
  * Columns
* border-collapse: collapse
* width: 100%

---

## Table Header

* background: #009900
* color: white
* font-weight: bold
* font-size: 12px

---

## Table Cell

* border: 1px solid #ccc
* padding: 6px 8px

---

## Required Classes

* table-base
* table-header

---

# 🧩 FORM SYSTEM

## Structure

Each form must include:

1. Card container
2. Section title
3. Grid layout
4. Input elements

---

## Layout

* Use: form-grid
* 2 columns layout
* Gap: 12px

---

## Input

* Class: input-base
* Full width
* Clear label above

---

## Button

* Class: btn-primary
* Background: #009900
* Text: white

---

# 📦 CARD SYSTEM

## Rules

* Border: 1px solid #ddd
* Padding: 12px
* Margin-bottom: 12px

---

## Class

* card

---

# 📑 TAB SYSTEM

## Required Tabs

Every module MUST include:

1. Tổng quan (overview)
2. Danh sách (list)
3. Thống kê (statistics)

Default active tab: Danh sách

---

## Tab Style

* Horizontal layout
* Active tab:

  * border-bottom: 2px solid #009900
  * color: #009900
  * font-weight: bold

---

## Classes

* tab-container
* tab-item
* tab-active

---

# 🧠 UX PRINCIPLES

## General

* Clear layout
* Minimal clutter
* Fast data entry

---

## Medical Context

* Avoid complex UI
* Prioritize readability
* Reduce user errors

---

## Interaction

* Inputs must be easy to access
* Important actions clearly visible
* Feedback after actions (save, delete)

---

# 📐 SPACING SYSTEM

* Standard gap: 12px
* Section spacing: 16px
* Page padding: 16px

---

# 🚫 AI RESTRICTIONS

AI MUST NOT:

* Change primary color (#009900)
* Remove table borders
* Use random font sizes
* Break form structure
* Mix layout styles

---

# 📌 CLASS STANDARD

Use ONLY these class names:

* input-base
* btn-primary
* form-grid
* card
* table-base
* table-header
* tab-container
* tab-item
* tab-active

---

# 📌 AI PRIORITY

When generating UI:

1. Consistency
2. Readability
3. Speed of use

---

# 📌 FINAL RULE

ALWAYS follow this UI system before generating any UI.

---

END OF UI SYSTEM
