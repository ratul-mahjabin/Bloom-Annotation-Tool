# Bloom Annotation Tool

## 📌 Purpose

The **Bloom Annotation Tool** is an interactive interface designed to support the annotation of textual data according to **Bloom’s Taxonomy**. It enables researchers, educators, and annotators to systematically label segments of conversations based on cognitive levels such as *Remember, Understand, Apply, Analyze, Evaluate,* and *Create*.

[Bloom’s Taxonomy](https://en.wikipedia.org/wiki/Bloom%27s_taxonomy) is a widely used framework for categorizing learning objectives and cognitive skills, helping structure educational analysis and assessment. This tool simplifies the annotation workflow, making it easier to generate high-quality labeled datasets for research, educational analysis, or training machine learning models.

---

## 🚀 Features

### 👤 Annotator Setup
- Set and manage the **annotator’s name** before starting annotation.

### 🔍 Conversation Browser with Search
- Browse through available conversations for annotation.
- Built-in **search functionality** to quickly locate specific conversation with conversation ID.

### ✏️ Interactive Text Annotation
- Select and annotate specific text spans directly in the interface.
- Annotated text is **visually highlighted** for clarity and easy navigation.

### 🔁 Trace-back & Edit Annotations
- Full **trace-back functionality** to revisit previously annotated segments.
- Label(s) can be modified by directly clicking the highlighted text span
- Modify or update labels seamlessly without losing prior work.

### 📚 Integrated Annotation Rubrics
- All **score rubrics** are available within the UI.
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
2. Select or search for a **conversation** to annotate.
3. Highlight text and assign **Bloom’s taxonomy labels**.
4. Review annotations using trace-back and edit if needed.
5. Save your work locally as a **JSON file**.

---

## 📦 Output Format

Annotations are exported in structured JSON format, typically including:
- Annotator metadata  
- Conversation identifiers  
- Annotated text spans  
- Assigned Bloom’s taxonomy labels
