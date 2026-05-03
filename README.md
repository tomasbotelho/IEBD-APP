# FreshMart Front-Office

Production-oriented front-office e-commerce application with:

- `backend/`: Node.js + Express REST API
- `frontend/`: React + Vite + Tailwind storefront
- JWT authentication architecture with role-aware route protection
- Stripe Elements checkout flow
- MySQL integration-ready schema and repository layout

## Run

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Install frontend dependencies:

```bash
cd ..\frontend
npm install
```

3. Copy environment files:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

4. From the project root, start the backend:

```bash
npm run dev:backend
```

5. From the project root, start the frontend:

```bash
npm run dev:frontend
```

## Notes

- The backend ships with seeded in-memory demo data for local development.
- Set `USE_FAKE_DB=true` to run without MySQL while keeping the code MySQL-ready.
- Stripe requires real keys in `backend/.env` and `frontend/.env`.
- The SQL reference schema is available at `backend/src/data/schema.sql`.

## Google OAuth

To allow any Google user to sign in:

1. In Google Cloud Console, create an OAuth client of type `Web application`.
2. Set the OAuth consent screen user type to `External`.
3. Change the publishing status to `In production`.
4. Add this authorized redirect URI:

```text
http://localhost:4000/api/auth/oauth/google/callback
```

5. Put the real credentials into `backend/.env`:

```env
GOOGLE_CLIENT_ID=your_real_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_real_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/oauth/google/callback
```

6. Restart the backend after changing `backend/.env`.

If `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` still contain placeholder values like `replace_me_*`,
Google login will be disabled and the app will return a local configuration error instead of sending the
user to Google's `401 invalid_client` page.
