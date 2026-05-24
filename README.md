# Inventory-&-Stock-management

Inventory-&-Stock-management is a React-based inventory and stock management dashboard for tracking products, stock levels, orders, reports, and CSV exports.

## Features

- Product inventory with SKU, category, pricing, and stock quantity
- Low-stock alerts based on reorder levels
- Add product form with MongoDB persistence
- Purchase and sales order overview
- Reports for sales, purchases, and category distribution
- Light and dark theme support
- CSV export for inventory data

## Demo Login

Email: `Example@gmail.com`
Password: `admin123`

The demo user is created automatically by the backend after MongoDB Atlas is connected and you login with the credentials above.

## Backend Setup

1. Copy `.env.example` to `.env`.
2. Copy `server/.env.example` to `server/.env`.
3. Put your MongoDB Atlas connection string in `server/.env` as `MONGODB_URI`.
4. Use a strong `JWT_SECRET` in `server/.env`.

## Deployment

### Render API

Deploy the backend from this `my-app` folder.

- Build command: `npm install`
- Start command: `npm run server`
- Health check path: `/api/health`

Set these Render environment variables:

- `MONGODB_URI`: your MongoDB Atlas URI
- `MONGODB_DB_NAME`: `inventory-db`
- `MONGODB_DNS_SERVERS`: `1.1.1.1,8.8.8.8`
- `JWT_SECRET`: a long random secret
- `JWT_EXPIRES_IN`: `7d`
- `CLIENT_URL`: your deployed frontend URL, for example `https://your-app.vercel.app`

### Vercel Frontend

Deploy the frontend from this `my-app` folder.

- Framework: Create React App
- Build command: `npm run build`
- Output directory: `build`

Set this Vercel environment variable before building:

- `REACT_APP_API_URL`: your Render backend API URL, for example `https://your-api.onrender.com/api`

After both deploys finish, update Render `CLIENT_URL` to the final Vercel URL and redeploy the API.

## Scripts

### `npm start`

Runs the app locally at `http://localhost:3000`.

### `npm run server`

Runs the Node.js API at `http://localhost:5000`.

### `npm run server:dev`

Runs the Node.js API with nodemon.

### `npm run build`

Creates an optimized production build in the `build` folder.

### `npm test`

Runs the test suite in watch mode.

For deployment checks, use `npm test -- --watchAll=false`.
