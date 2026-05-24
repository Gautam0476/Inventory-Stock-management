# Inventory-&-Stock-management Backend

Express + MongoDB Atlas API scaffold for the inventory app.

## Setup

1. Copy `server/.env.example` to `server/.env`.
2. Paste your MongoDB Atlas URI in `MONGODB_URI`.
3. Set `JWT_SECRET` to a long random value.
4. If Node cannot resolve the Atlas SRV record on your network, set `MONGODB_DNS_SERVERS`.
5. Start the API:

```bash
npm run server:dev
```

## API

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products` requires `Authorization: Bearer <token>`
- `POST /api/products` requires `Authorization: Bearer <token>`
- `PUT /api/products/:id` requires `Authorization: Bearer <token>`
- `DELETE /api/products/:id` requires `Authorization: Bearer <token>`
- `POST /api/products/reset/sample-data` requires `Authorization: Bearer <token>`
- `GET /api/orders` requires `Authorization: Bearer <token>`
- `POST /api/orders` requires `Authorization: Bearer <token>`
- `PUT /api/orders/:id` requires `Authorization: Bearer <token>`
- `DELETE /api/orders/:id` requires `Authorization: Bearer <token>`

Default login can be created automatically after MongoDB is connected:

- Email: `Example@gmail.com`
- Password: `admin123`
