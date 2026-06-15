# Bloom Annotation Tool

## 📌 Purpose

The **Bloom Annotation Tool** is an interactive interface designed to support the annotation of textual data according to **Bloom's Taxonomy**. It enables researchers, educators, and annotators to systematically label segments of conversations based on cognitive levels such as *Remember, Understand, Apply, Analyze, Evaluate,* and *Create*.

[Bloom's Taxonomy](https://en.wikipedia.org/wiki/Bloom%27s_taxonomy) is a widely used framework for categorizing learning objectives and cognitive skills, helping structure educational analysis and assessment. This tool simplifies the annotation workflow, making it easier to generate high-quality labeled datasets for research, educational analysis, or training machine learning models.

---

## 🚀 Features

### 👤 Annotator Setup
- Set and manage the **annotator's name** before starting annotation.

### 🔍 Conversation Browser with Search
- Browse through available conversations for annotation.
- Built-in **search functionality** to quickly locate specific conversations by CID or Prolific ID.
- Cards display three completion states:
  - `○ Not started` — grey
  - `◑ Not finished` — yellow (annotation file exists but ≥1 Bloom score is missing)
  - `✓ Annotated` — green (all 6 Bloom scores filled)

### ⚠️ Confused Cases Panel
- A collapsible amber panel pinned below the home page header.
- Summarises all text spans labeled **"confused"** across every saved annotation, grouped by CID.
- Each CID badge is **clickable** and navigates directly to that annotation page.
- When expanded, the panel has its own vertical scroll area so a large number of cases does not push the conversation browser off-screen.
- Every confused span is shown within its CID card. CIDs with multiple spans expand to their full content height, with separators between spans, and can be reviewed by scrolling the panel.

### 🔀 In-Annotation Navigation
- **`◀ Prev`** and **`Next ▶`** buttons in the annotation banner let annotators jump between users without returning to the home page.
- Navigation **auto-saves** the current annotation before switching.
- **`🏠 Home`** button returns to the conversation browser at any time.

### ✏️ Interactive Text Annotation
- Select and annotate specific text spans directly in the interface.
- Annotated text is **visually highlighted** for clarity and easy navigation.

### 🔁 Trace-back & Edit Annotations
- Full **trace-back functionality** to revisit previously annotated segments.
- Label(s) can be modified by directly clicking the highlighted text span.
- Modify or update labels seamlessly without losing prior work.

### 📊 Cognitive Depth Assessment (Likert Scale)
- Rate each of the six Bloom's levels (1–5) for the overall conversation.
- Add a free-text **overall comment**.

### 📚 Integrated Annotation Rubrics
- All **score rubrics** are available within the UI via a floating 📚 button.
- Supports consistent and informed labeling decisions during annotation.

### 💾 Local JSON Export
- Save annotations locally in **JSON format**.
- Enables easy integration with downstream pipelines such as:
  - Machine learning workflows
  - Data analysis
  - Dataset sharing

---

## 🎥 Demo

![Bloom Tool Demo](bloom_tool_demo.gif)

---

## 🖥️ Installation & Running

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- The conversation CSV file `treatment_transcripts_with_stage.csv` placed in the project root (not tracked by git)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Build the frontend and start the server
npm start
```

The app will be available at **[http://localhost:3000](http://localhost:3000)**.

> **Note:** `http://localhost:5173` is Vite's development server and is only active when running `npm run dev` (frontend only, no API). For full functionality — including loading conversations and saving annotations — always use `npm start` and access port **3000**.

### Switching Annotators

The annotator name is stored in the browser's local storage. To switch to a different annotator on the same machine:

1. Click the **"Change Name"** button in the conversation browser.
2. You will be returned to the welcome screen to enter a new name.
3. Each annotator's saved annotations are stored separately under `annotations/<name>/` on the server.

---

## 🛠️ Usage Overview

1. Enter your **annotator name**.
2. Select or search for a **conversation** to annotate. The card colour shows completion status at a glance.
3. Highlight text spans and assign **Bloom's taxonomy labels**.
4. Rate each Bloom level (1–5) in the **Cognitive Depth Assessment** panel.
5. Use **`◀ Prev`** / **`Next ▶`** to move between users — annotations auto-save before switching.
6. Review trace-back annotations and edit if needed.
7. Save your work at any time with **`💾 Save`**.

---

## 📦 Output Format

Annotations are exported in structured JSON format, including:
- Annotator metadata
- Conversation identifiers
- Annotated text spans with turn index, character offset, and context turns
- Assigned Bloom's taxonomy labels (including `confused`)
- Bloom level Likert scores (1–5 per level)
- Overall comment

---

## 📋 Changelog

See [CHANGE.md](./CHANGE.md) for a full version history.
