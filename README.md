# 📚 Library Management System (LMS Pro) - Setup Guide

This project is a full-stack Library Management System built with **Node.js, Express, HTML, CSS, and Vanilla JavaScript**. It features an in-memory database, Open Library API integration, and a real-time lending/waitlist system.

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your system.

### 2. Install Dependencies
Open your terminal in the project root directory (`LB`) and run:
```bash
npm install
```
*Note: This installs `express`, `axios`, `uuid`, `cors`, and `body-parser`.*

### 3. Start the Server
Run the following command to start the backend:
```bash
node src/server.js
```
The terminal should display: `Librarian AI is awake at http://localhost:3000`.

### 4. Open the Dashboard
Open your web browser and go to:
**[http://localhost:3000](http://localhost:3000)**

---

## 🛠️ Features How-To

### 📖 Book Catalog
- **Import by ISBN**: Enter a 10 or 13-digit ISBN (e.g., `0747532745` for Harry Potter) in the Search bar area and click **Import**.
- **Search**: Type in the search box to filter books by title or author in real-time.
- **Add Manually**: Click "Add Book" to enter details yourself.

### 👥 Members
- Go to the **Members** tab.
- Click **New Member** to register a user.
- *Note: You must have at least one member registered to lend books.*

### 🔄 Lending & Returns
- **Lend**: Select a book and a member. If the book is available, it is lent immediately. 
- **Waitlist**: If the book is "Borrowed", lending it to another member will automatically place them on the **Waitlist**.
- **Return**: Select a borrowed book to return it. If a waitlist exists, the book is **automatically assigned** to the next person in line.

### 📊 Reports
- Check the **Reports** tab for:
    - **Overdue Books**: Tracks books past their 14-day due date.
    - **Top 5 Books**: Shows most frequently borrowed books.
    - **Active Borrowers**: Statistics on member lending activity.

---

## 📁 Project Structure
- `src/server.js`: Express server, API routes, and logic.
- `public/`: Frontend assets.
    - `index.html`: Main dashboard layout.
    - `style.css`: Professional UI styling.
    - `script.js`: Frontend logic and API integration.

## ⚠️ Notes
- This version uses **In-Memory Storage**. Restarting the server will reset all data (books, members, loans) to the initial seed data.
- Ensure you have an active internet connection for the **Open Library API** (ISBN import) and **FontAwesome** icons to work.
