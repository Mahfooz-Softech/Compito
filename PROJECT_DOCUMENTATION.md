## Project Overview

This monorepo contains a Laravel backend (`backend/`) and a React + Vite frontend (`frontend/`). The application is a services marketplace with roles: admin, worker, and customer. Core features include service discovery, messaging (chat), offers, bookings, payments, reviews, and notifications.

### Tech Stack
- Backend: PHP 8, Laravel, Sanctum auth, Eloquent ORM, PostgreSQL/SQLite (configurable), Stripe SDK (simulated flows included)
- Frontend: React, TypeScript, Vite, Tailwind, Lucide icons

---

## Backend (Laravel)

### Key Directories
- `app/Http/Controllers/`:
  - `AuthController.php`: registration, login, profile (Sanctum)
  - `AdminController.php`: admin data, workers management, categories, payments views, worker accounts (activate/deactivate/reactivate), metrics
  - `PublicController.php`: public endpoints (services, categories, reviews, worker profiles, aggregated public data)
  - `CustomerController.php`: customer dashboard data (`/customer-data/{id}`), service requests, reviews
  - `WorkerController.php`: worker analytics, services CRUD, requests, profile
  - `ServiceRequestController.php`: service request lifecycle, offers, messages, reviews, bookings stats
  - `MessageController.php`: conversations, send/read messages, unread counts
  - `BlockedConversationController.php`: block/unblock
  - `NotificationController.php`: list, unread count, mark read, create, delete
  - `PaymentController.php`: checkout (simulated), complete payment, status, and admin/customer/worker notifications

- `app/Models/`:
  - `Profile`: users (workers/customers/admins) – personal data, location
  - `WorkerProfile`: worker-specific data (rating, total_reviews, availability, etc.)
  - `Service`: services offered by workers; relations to `Category`, `WorkerProfile`, and `Profile` (via `worker_id`)
  - `Booking`, `Offer`, `ServiceRequest`, `Payment`, `Notification`, etc.

- `routes/api.php`: all API routes (public + `auth:sanctum` protected)

### Authentication
- Sanctum-based auth. Protected routes grouped under `Route::middleware('auth:sanctum')`.
- Use Authorization: Bearer <token> from frontend `apiClient`.

### Core Data Flow
- Services: `PublicController@getServices` (public mappable variant) and `CustomerController@getCustomerData` (authenticated) provide service data. `Service` eager loads `worker.profile` and `profile` relations. Location is sourced from `profiles.location` (via `worker_id`).
- Browse page (frontend) primarily consumes `GET /customer-data/{id}` → `allServices`.

### Messaging (Chat)
- Endpoints: `GET /messages/conversations`, `GET /messages/conversation/{userId}`, `POST /messages` (send), `PUT /messages/{id}/read`, `PUT /messages/mark-read-batch`.
- Blocking: `GET/POST/DELETE /blocked-conversations` to fetch, block, and unblock.
- Server enforces blocked constraints (worker cannot message a customer who blocked them).

### Service Requests and Offers
- Customer creates request: `POST /customer/create-service-request`.
- Worker lists requests: `GET /service-requests/worker`.
- Worker sends offer: `POST /service-requests/offers`.
- Customer accepts/rejects: `PUT /offers/{id}/accept`, `PUT /offers/{id}/reject`.

### Bookings & Payments
- Complete payment: `POST /payments/complete` (Stripe session verification simulated) → creates `Booking` and `Payment` and fires notifications.
- Payment status: `GET /payments/status` (simulated).
- Simulated admin/customer/worker notifications on payment success/cancel/fail: `POST /payments/cancel`, `POST /payments/fail`.
- Worker marks complete: `PUT /worker/bookings/{id}/complete`.
- Customer approves completion: `PUT /customer/bookings/{id}/approve`.

### Notifications
- Model: `Notification` (UUID id, `user_id`, `type`, `title`, `message`, `data` JSON, `is_read`).
- Endpoints:
  - `GET /notifications`, `GET /notifications/unread-count`
  - `PUT /notifications/{id}/read`, `PUT /notifications/mark-all-read`
  - `POST /notifications` (admin-only creation), `DELETE /notifications/{id}`
- Triggers implemented:
  - Customer → Worker: service request (type: `service_request_received`)
  - Worker → Customer: offer received (type: `offer_received`, includes worker name and service title)
  - Customer → Worker: offer accepted (`offer_accepted`), offer rejected (`offer_rejected`)
  - Messaging: receiver gets `message_received`
  - Payments: booking confirmed (worker), `payment_succeeded` (customer), plus admin variants `payment_completed_admin`, `payment_cancelled_admin`, `payment_failed_admin`
  - Work lifecycle: `booking_completed` (customer), `work_approved` (worker)
  - Worker reactivation: `worker_reactivation_request` (admins)

### Public Endpoints
- `GET /public/services` – service list with category and worker profile; used for public pages (optional when authenticated path exists)
- `GET /public/categories`, `GET /public/profiles`, `GET /public/reviews`, `GET /public/worker-profiles`, `GET /public/data`

---

## Frontend (React/Vite)

### Key Directories
- `src/pages/`:
  - `customer/Browse.tsx`: customer browse services grid; filters by title/provider/category/location. Displays provider, dynamic star rating, reviews, and location.
  - `customer/EnhancedDashboard.tsx`: customer dashboard view.
  - `admin/*`: admin pages (Dashboard, Workers, Settings, Analytics, Payments, etc.)

- `src/components/`:
  - `dashboard/DashboardLayout.tsx`: shared layout with sidebar, header, and `NotificationCenter` bell.
  - `NotificationCenter.tsx`: bell button, unread badge, list panel; uses `useNotifications`.
  - `admin/WorkerProfileDrawer.tsx`: worker profile details for admins.
  - `customer/MessageCenter.tsx`, `worker/ConversationManager.tsx`: messaging UIs.

- `src/hooks/`:
  - `useCustomerData.ts`: fetches authenticated customer dashboard payload from `/customer-data/{id}`.
  - `useNotifications.ts`: fetch list and unread count; mark read/all; polls every 5s.
  - `usePublicData.ts`, `useAdminData.ts`, `useAdminServices.ts`: admin/public helpers.

- `src/lib/apiClient.ts`: centralized HTTP client; handles token and GET/POST/PUT/DELETE helper wrappers.

### Primary Data Flows
- Authentication: `useAuth` context wraps user info and token management.
- Services: `useCustomerData` → `allServices` → `Browse.tsx`.
- Notifications: `useNotifications` → `NotificationCenter` (in header) shows a badge and panel; polling refreshes counts.
- Messaging: polling-based refresh in chat UIs; messages are fetched and marked read via API.

### UI Highlights
- Browse cards show: title, provider, category badge, dynamic stars (1–5), reviews count, price range, location (or "Location not set").
- Admin pages include pagination, filters, verification/rejection flows, and drawers for detail views.

---

## API Reference (Selected)

Public
- `GET /public/services?limit=n`
- `GET /public/categories`
- `GET /public/data` (profiles, reviews, worker profiles, services, grouped categories, marketing stats)

Auth Required (Sanctum)
- Auth: `POST /auth/login`, `POST /auth/register`, `POST /auth/logout`, `GET/PUT /auth/profile`
- Customer data: `GET /customer-data/{id}`
- Messages: `GET /messages/conversations`, `GET /messages/conversation/{userId}`, `POST /messages`, `PUT /messages/{id}/read`, `PUT /messages/mark-read-batch`
- Blocked: `GET/POST/DELETE /blocked-conversations`
- Service requests: `POST /customer/create-service-request`, `GET /service-requests/worker`, `POST /service-requests/offers`, `PUT /service-requests/{id}/decline`, `PUT /offers/{id}/accept`, `PUT /offers/{id}/reject`
- Bookings: `GET /customer/bookings`, `GET /worker/bookings`, `PUT /worker/bookings/{id}/complete`, `PUT /customer/bookings/{id}/approve`
- Payments: `POST /payments/create-checkout` (via `CheckoutController`), `POST /payments/complete`, `POST /payments/cancel`, `POST /payments/fail`, `GET /payments/status`
- Notifications: `GET /notifications`, `GET /notifications/unread-count`, `PUT /notifications/{id}/read`, `PUT /notifications/mark-all-read`, `POST /notifications` (admin-only), `DELETE /notifications/{id}`
- Admin: various `/admin/*` endpoints for workers, categories, payments, and dashboard data

---

## Notifications Matrix (Who gets notified and when)

- Customer → Worker
  - Create service request: worker gets `service_request_received`

- Worker → Customer
  - Send offer: customer gets `offer_received` (title includes worker name; message includes service title)
  - Decline request: customer gets `request_declined`

- Customer → Worker
  - Accept offer: worker gets `offer_accepted`
  - Reject offer: worker gets `offer_rejected`

- Chat (either side → other)
  - Send message: receiver gets `message_received`

- Payments
  - Success: worker gets `booking_confirmed`, customer gets `payment_succeeded`, admins get `payment_completed_admin`
  - Cancelled: customer + worker get `payment_cancelled`, admins get `payment_cancelled_admin`
  - Failed: customer + worker get `payment_failed`, admins get `payment_failed_admin`

- Work lifecycle
  - Worker marks complete: customer gets `booking_completed`
  - Customer approves: worker gets `work_approved`

- Worker reactivation
  - Reactivation request: admins get `worker_reactivation_request`

---

## Local Development

### Backend
1. Copy `.env.example` to `.env`, configure DB (SQLite/Postgres), Sanctum, and Stripe keys.
2. `composer install`
3. `php artisan key:generate`
4. `php artisan migrate --seed` (if seeders exist)
5. `php artisan serve`

### Frontend
1. `cd frontend`
2. `npm install` or `bun install`
3. Configure base API URL in `src/lib/apiClient.ts` (defaults to `http://127.0.0.1:8000/api`)
4. `npm run dev`

---

## Testing Notifications (Manual)

Use two authenticated accounts (customer and worker) and optionally an admin account. After each action, verify:
- `GET /notifications` for the expected recipient
- `GET /notifications/unread-count`
- Frontend bell badge updates (polling every 5s)

Recommended sequence:
1. Customer → `POST /customer/create-service-request` → worker sees `service_request_received`
2. Worker → `POST /service-requests/offers` → customer sees `offer_received`
3. Customer → `PUT /offers/{id}/accept` → worker sees `offer_accepted`
4. Customer → `POST /payments/complete` → worker `booking_confirmed`, customer `payment_succeeded`, admins `payment_completed_admin`
5. Worker → `PUT /worker/bookings/{id}/complete` → customer `booking_completed`
6. Customer → `PUT /customer/bookings/{id}/approve` → worker `work_approved`

---

## Conventions & Notes

- UUID primary keys across domain models.
- All computed fields for Browse are handled server-side where possible. For authenticated customers, `GET /customer-data/{id}` is the source of truth.
- Location precedence for service cards: `profiles.location` (trimmed). If missing, frontend shows "Location not set".
- Real-time behavior is simulated with polling (4–10 seconds) for chat and notifications.

---

## Future Improvements

- Replace polling with WebSockets (Laravel Echo / Pusher) for messages and notifications.
- Harden review aggregation (PublicController) to match production schema.
- Add Admin notifications page with filters and bulk actions.
- Add automated tests (Feature: notifications, payments; Unit: controllers/services).


