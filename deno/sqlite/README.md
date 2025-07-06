# **Deno SQLite - Examples**

A multiplayer **MMO RPG** game built using **TypeScript, Deno, WebSockets, PixiJS, and Deno KV** for persistence. The game runs in the browser with real-time multiplayer support.

## **🚀 Features**
- **No External Dependencies** for running locally on air-gapped environments
- **TODO** for future requirements

---

## **📜 Getting Started**
### **1️⃣ Prerequisites**
- [Deno SQLite Module](https://deno.land/x/sqlite) (latest version)
- [Deno Installed](https://deno.com/) (require Deno v2.4.x or later)
- A GitHub repository

### **2️⃣ Run the Example Locally**
#### **Start the Deno SQLite CLI**
```sh
deno run --allow-read --allow-write notes.ts create test.db
deno run --allow-read --allow-write notes.ts record test.db "This sample note!"
deno run --allow-read --allow-write cli.ts test.db
sqlite> .help
sqlite> insert into notes(note, created_at) values ('hello world!', date('now'));
sqlite> select * from notes
```

### **3️⃣ Extend the example**
#### **TODO**

---

## **🛠️ Tech Stack**
- **Deno** - Server runtime
- **Deno SQLite Module** - Local SQL database

---

## **📌 Roadmap**
- ✅ **Example Create DB, SQL query and CRUD operations**
- ⭕ **Web Server and browser-based UI in HTML / JavaScript**

---

## **📜 License**
This project is licensed under the **Apache 2.0**.
