## Growth Help

Growth Help is a peer-to-peer crowdfunding platform that enables verified users to support each other financially through transparent transactions. The system includes a user-facing app, an admin dashboard, and a backend API.

## Live URLs

[User Pannel](https://growthhelp.in/)
[Admin Pannel](https://admin.growthhelp.in)

## 🧩 Project Structure

This is a **Turborepo** project with multiple apps:

- `api` → Backend API (Node.js + Express)
- `admin` → Admin Dashboard (React / Vite)
- `web` → User Web App (React / Vite)

## 🚀 Prerequisites

Growth Help runs on an in-house PostgreSQL database using Docker.

You must have:

- **Docker**
- **Node.js (v18+)**
- **npm**

## 🐳 Step 1 — Start PostgreSQL (Docker)

```
docker pull postgres
docker run --name growthhelp-db -e POSTGRES_USER=mlm_user -e POSTGRES_PASSWORD=mlm_password -e POSTGRES_DB=mlm_db -p 5432:5432 -d postgres
```

## 🔧 Step 2 — Setup Environment Variables

### ✅ API (Backend)

Create a `.env` file inside the `api/` folder:

```bash
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://username:yourPassowrd@localhost:5432/mlm_db?schema=public"
JWT_SECRET="your_jwt_secret_key"
```

### ✅ Admin App

Create a `.env` file inside the `admin/` folder:

```bash
VITE_USER_APP_URL='http://192.168.31.185:5173'
VITE_BASE_URL="http://192.168.31.185:3000"
```

> Replace `192.168.31.185` with your local IP or use `localhost`.

### ✅ Web App

Create a `.env` file inside the `web/` folder:

```bash
VITE_BASE_URL="http://192.168.31.185:3000"
```

> Replace `192.168.31.185` with your local IP or use `localhost`.

## ⚙️ Step 3 — Install Dependencies

Run from the root of the project:

```bash
npm install
```

## 🏁 Step 4 — Run the Project

```bash
npm run dev
```

## 🧠 Notes

* Make sure the PostgreSQL database is running before starting the project.
* Update the IP addresses in `.env` files if needed.

## 📌 Support

If you face any issues while setting up, feel free to open an issue in this repo.
