<div align="center">

# AgriTrace

**Hệ thống truy xuất nguồn gốc nông sản — chữ ký số RSA + audit log WORM + neo bằng chứng lên Ethereum.**

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![gRPC](https://img.shields.io/badge/gRPC-Protobuf-4285F4?logo=google&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600?logo=rabbitmq&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

</div>

---

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Điểm nổi bật](#điểm-nổi-bật)
- [Kiến trúc tổng quan](#kiến-trúc-tổng-quan)
- [Tech stack](#tech-stack)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Setup nhanh](#setup-nhanh)
- [Biến môi trường](#biến-môi-trường)
- [Tài khoản demo](#tài-khoản-demo)
- [Mô hình dữ liệu](#mô-hình-dữ-liệu)
- [Bảo mật](#bảo-mật)
- [Audit log & Blockchain anchor](#audit-log--blockchain-anchor)
- [Notification realtime](#notification-realtime)
- [Smart contract](#smart-contract)
- [RBAC & Phân quyền](#rbac--phân-quyền)
- [Scripts hữu ích](#scripts-hữu-ích)
- [Demo flow](#demo-flow)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [License](#license)

---

## Giới thiệu

**AgriTrace** là nền tảng truy xuất nguồn gốc nông sản đầu–cuối, được xây dựng cho đồ án tốt nghiệp. Hệ thống cho phép:

- **Nông dân (Farmer)** ghi nhật ký canh tác (gieo, bón phân, phun thuốc, thu hoạch…), ký số bằng RSA-2048 để cam kết tính xác thực của dữ liệu.
- **Kiểm định viên (Inspector)** thực hiện kiểm tra hiện trường / phòng lab, ký số kết quả.
- **Quản trị (Admin)** quản lý người dùng, duyệt chứng nhận VietGAP / GlobalGAP / Organic, giám sát audit log.
- **Người tiêu dùng (Consumer)** quét **QR code trên bao bì** để xem truy xuất công khai (không cần đăng nhập, không cần tin tưởng server).

Mỗi biến động dữ liệu được khóa vào **audit log WORM** (hash chain bất biến) và mỗi giờ Merkle root của các log mới được neo lên **Ethereum Sepolia testnet** — bất kỳ ai cũng có thể độc lập verify dữ liệu chưa bị tampering, kể cả khi attacker chiếm quyền database.

---

## Điểm nổi bật

### Chữ ký số client-side (Zero-trust)
- Cặp khóa **RSA-2048** sinh tại server **1 lần duy nhất**, trả về browser, lưu vào **IndexedDB** local.
- Mọi thao tác ký (activity log, inspection) thực hiện **trong browser** bằng **Web Crypto API** — server không bao giờ nhìn thấy private key.
- Public key lưu ở `user_keys` để verify; key có thể bị revoke khi nghi ngờ rò rỉ.

### Audit log bất biến (WORM hash chain)
- Mọi action (CREATE / UPDATE / DELETE) trên entity quan trọng được ghi qua decorator `@Auditable()` → publish event RabbitMQ → audit-service consume → ghi vào bảng `audit_logs`.
- Mỗi record có `record_hash = sha256(seq_no | actor | action | entity | before | after | prev_hash)` → tạo thành **chuỗi hash bất biến**.
- **Postgres trigger WORM** chặn cả `DELETE` lẫn `UPDATE` trên bảng `audit_logs` (bypass được bằng cách disable trigger, nhưng sẽ phá chain và bị phát hiện ngay).

### Merkle Anchor lên blockchain
- Mỗi giờ (cron), audit-service gom các `record_hash` mới chưa anchor → build **Merkle tree** → gửi `storeAnchor(root, fromSeq, toSeq)` lên contract `AgriTraceAnchor.sol` trên Sepolia.
- Ghi `tx_hash`, `block_number`, `onchain_anchor_id` về DB.
- Verify: client tính lại Merkle root từ logs trong dải [fromSeq, toSeq] → so với root đọc từ contract → nếu khác → có tampering.

### Microservices gRPC + Event-driven
- **6 NestJS app** (1 gateway + 5 service), **database-per-service** (5 PostgreSQL độc lập).
- **Protobuf gRPC** giữa các service nội bộ → hiệu năng + type-safe.
- **RabbitMQ** cho 2 luồng async fire-and-forget: audit log write, notification dispatch — có **Dead Letter Exchange (DLX)** để retry message lỗi.
- **REST + Socket.IO** giữa client và gateway.

### Hệ thống chứng nhận động
- Admin tạo **template** chứng nhận (VietGAP / GlobalGAP / Organic) với danh sách checklist items theo nhóm (đất, nước, phân bón, thu hoạch, hồ sơ…).
- Farmer điền checklist cho farm của mình → submit → admin review → APPROVED / REJECTED.
- Khi approved, farm cập nhật `certification_status` và `certified_at`.

---

## Kiến trúc tổng quan

```mermaid
graph LR
    Client["Web / QR Scanner<br/>Next.js 16"] -->|REST + WS| GW["API Gateway :8000<br/>JWT · RBAC · ABAC<br/>Rate limit · Audit"]

    GW -.gRPC.-> US["user-service :50051"]
    GW -.gRPC.-> PS["product-service :50052"]
    GW -.gRPC.-> TS["trace-service :50053"]
    GW -.gRPC.-> MS["media-service :50054"]
    GW -.gRPC.-> AS["audit-service :50055"]

    GW -.publish.-> MQ{{"RabbitMQ<br/>agritrace.events"}}
    MQ -.consume.-> AS
    MQ -.consume.-> US

    US --> UDB[("user-db :5433")]
    PS --> PDB[("product-db :5434")]
    TS --> TDB[("trace-db :5435")]
    MS --> MDB[("media-db :5436")]
    AS --> ADB[("audit-db :5437")]

    GW --> R[("Redis :6379<br/>Cache · Throttle")]
    TS --> R
    MS --> CDN[["Cloudinary CDN"]]
    AS -.cron 1h.-> SC["AgriTraceAnchor.sol<br/>Sepolia Testnet"]

    US -- "Socket.IO" --> Client
```

### Bảng phân chia service

| Service | HTTP | gRPC | Vai trò chính | Database |
|---|:---:|:---:|---|---|
| **api-gateway** | 8000 | — | Edge HTTP, JWT validation, RBAC, ABAC ownership, throttle (Redis), `@Auditable` interceptor publish event | — |
| **user-service** | 3001 | 50051 | Users / profiles, auth (JWT key rotation), RSA keys, notifications, Socket.IO push | `agritrace_users` (5433) |
| **product-service** | 3002 | 50052 | Farms, Batches, Crop categories, Certification templates & checklists | `agritrace_products` (5434) |
| **trace-service** | 3003 | 50053 | Activity logs (có chữ ký số), Inspections, public trace view | `agritrace_traces` (5435) |
| **media-service** | 3004 | 50054 | Upload Cloudinary, metadata assets | `agritrace_media` (5436) |
| **audit-service** | 3005 | 50055 | Consume audit events → WORM hash chain → Merkle Anchor cron | `agritrace_audit` (5437) |

### Hạ tầng dùng chung

| Component | Vai trò | Port |
|---|---|:---:|
| **Redis 7** | Throttle storage, session/cache, JWT key cache | 6379 |
| **RabbitMQ 3.13** | Topic exchange `agritrace.events` + DLX `agritrace.dlx`, management UI :15672 | 5672 / 15672 |
| **Cloudinary** | CDN ảnh / video (free tier) | — |
| **Sepolia testnet** | Lưu Merkle root on-chain | chainId 11155111 |

---

## Tech stack

| Backend | Frontend | Hạ tầng & Blockchain |
|---|---|---|
| NestJS 11 + TypeScript 5.7 | Next.js 16.2 (App Router, RSC) | PostgreSQL 16 × 5 |
| TypeORM 0.3 + Postgres triggers | React 19.2 + Server Components | Redis 7 |
| @grpc/grpc-js + Protobuf | Tailwind CSS 4 + shadcn/ui | RabbitMQ 3.13 (DLX) |
| Passport JWT + bcrypt + key rotation | Zustand 5 + TanStack Query 5 | Cloudinary CDN |
| @nestjs/throttler + Redis storage | react-hook-form + Zod | Docker Compose |
| @nestjs/schedule (cron anchor) | Web Crypto API (RSA sign in browser) | Solidity 0.8.24 + Hardhat 2.22 |
| @golevelup/nestjs-rabbitmq | Socket.IO client (notifications) | ethers v6 + merkletreejs |
| Socket.IO server (notification push) | Recharts, sonner, lucide-react | Ethereum Sepolia testnet |
| `class-validator` + DTO | qrcode.react | keccak256 (Merkle) |

---

## Cấu trúc thư mục

```
AgriTrace System/
├── backend/
│   ├── apps/
│   │   ├── api-gateway/        # Edge HTTP: controllers, DTOs, guards, interceptors
│   │   │   └── src/
│   │   │       ├── common/     # Guards (JWT/RBAC/ABAC), filters, interceptors (Auditable)
│   │   │       └── modules/    # auth, user, product, trace, media, audit, notification
│   │   ├── user-service/       # Users + auth + JWT key rotation + RSA keys + notifications
│   │   ├── product-service/    # Farms, Batches, Crop categories, Certification
│   │   ├── trace-service/      # Activity logs (signed), Inspections, public trace
│   │   ├── media-service/      # Cloudinary upload + asset metadata
│   │   └── audit-service/      # WORM hash chain + Merkle Anchor cron
│   ├── contracts/              # Hardhat: AgriTraceAnchor.sol + deploy/verify scripts
│   │   ├── contracts/AgriTraceAnchor.sol
│   │   ├── scripts/deploy.ts, export-abi.js
│   │   └── test/               # 12 test cases Hardhat
│   ├── libs/shared/            # Shared lib (import qua @app/shared)
│   │   ├── proto/              # .proto files cho 5 service
│   │   └── src/
│   │       ├── enums.ts        # Role, BatchStatus, ActivityType, NotificationType, ...
│   │       ├── rabbitmq.ts     # Constants: exchanges, routing keys, message schemas
│   │       ├── redis/          # Redis module + provider token
│   │       ├── blockchain.ts   # Merkle tree helper
│   │       └── types.ts
│   ├── seeds/                  # Seed scripts: users, products, traces, certifications
│   ├── scripts/                # demo-tampering.ts, restore-audit.ts
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── (app)/              # Routes có auth: dashboard, farms, batches, audit, ...
│   │   │   ├── dashboard/      # Trang chủ sau khi login
│   │   │   ├── farms/          # CRUD farm + xin chứng nhận
│   │   │   ├── batches/        # CRUD batch + QR generation
│   │   │   ├── batch/[id]/     # Detail + activity logs (ký số)
│   │   │   ├── standards/      # Checklist VietGAP / GlobalGAP
│   │   │   ├── audit/          # Audit log list + verify hash chain
│   │   │   ├── audit/[seq]/verify/  # Verify 1 record + Merkle proof on-chain
│   │   │   ├── keys/           # Quản lý RSA keys
│   │   │   ├── users/          # Admin only: quản lý user
│   │   │   ├── crops/          # Admin only: crop categories
│   │   │   └── settings/
│   │   └── (public)/
│   │       ├── login/          # Login + register
│   │       └── trace/[code]/   # QR scan → trace public
│   ├── components/             # Radix + shadcn/ui components
│   ├── hooks/                  # useAuth, useSocket, useCrypto, ...
│   ├── lib/
│   │   ├── api/                # Axios client + typed API wrappers
│   │   ├── crypto.ts           # Web Crypto API: gen keypair, sign, verify
│   │   ├── blockchain.ts       # ethers v6: read anchor từ Sepolia
│   │   └── socket.ts           # Socket.IO client cho notifications
│   ├── stores/                 # Zustand: auth, notifications
│   └── package.json
├── docker-compose.yml          # 5 Postgres + Redis + RabbitMQ
└── README.md
```

---

## Setup nhanh

### Yêu cầu hệ thống

- **Node.js** ≥ 20, **npm** ≥ 10
- **Docker Desktop** (Postgres × 5 + Redis + RabbitMQ)
- Tài khoản **Cloudinary** (free tier — chỉ cần cloud_name / api_key / api_secret)
- (Tùy chọn) Tài khoản **Alchemy/Infura** cho RPC Sepolia + một ít ETH testnet cho anchor

### 1. Clone & cài đặt dependencies

```bash
git clone <repo-url>
cd "AgriTrace System"

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# (Tùy chọn) Hardhat contracts
cd ../backend/contracts
npm install
```

### 2. Tạo file `.env`

Tạo `backend/.env` theo mẫu trong [`Biến môi trường`](#biến-môi-trường). Tạo `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

### 3. Bật hạ tầng

```bash
cd backend
npm run start:db        # 5 Postgres + Redis + RabbitMQ qua docker-compose
```

Kiểm tra: `docker ps` → phải thấy 7 container UP. RabbitMQ management UI: <http://localhost:15672> (user/pass mặc định: `agritrace` / `agritrace_pass123`).

### 4. Seed dữ liệu mẫu

```bash
npm run seed:fresh      # Wipe DB + seed admin/farmer/inspector + farms/batches/templates
```

Hoặc seed từng phần:

```bash
npm run seed:users      # Chỉ users
npm run seed:products   # Farms + batches + crop categories
npm run seed:traces     # Activity logs + inspections
```

### 5. Chạy backend + frontend

```bash
# Terminal 1 — chạy 6 service backend song song
cd backend
npm run start:dev:all

# Terminal 2 — frontend
cd frontend
npm run dev
```

Truy cập:

- **Web app**: <http://localhost:3000>
- **API gateway**: <http://localhost:8000>
- **RabbitMQ UI**: <http://localhost:15672>

---

## Biến môi trường

File `backend/.env` (mẫu rút gọn — xem `.env.example` nếu có):

```env
# ──────── App ────────
NODE_ENV=development
API_PORT=8000

# ──────── JWT ────────
JWT_SECRET=replace-with-strong-secret-min-32-chars
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# ──────── User DB (5433) ────────
USER_DB_HOST=localhost
USER_DB_PORT=5433
USER_DB_USER=user_admin
USER_DB_PASS=user_pass123
USER_DB_NAME=agritrace_users
USER_GRPC_URL=0.0.0.0:50051

# ──────── Product DB (5434) ────────
PRODUCT_DB_HOST=localhost
PRODUCT_DB_PORT=5434
PRODUCT_DB_USER=product_admin
PRODUCT_DB_PASS=product_pass123
PRODUCT_DB_NAME=agritrace_products
PRODUCT_GRPC_URL=0.0.0.0:50052

# ──────── Trace DB (5435) ────────
TRACE_DB_HOST=localhost
TRACE_DB_PORT=5435
TRACE_DB_USER=trace_admin
TRACE_DB_PASS=trace_pass123
TRACE_DB_NAME=agritrace_traces
TRACE_GRPC_URL=0.0.0.0:50053

# ──────── Media DB (5436) ────────
MEDIA_DB_HOST=localhost
MEDIA_DB_PORT=5436
MEDIA_DB_USER=media_admin
MEDIA_DB_PASS=media_pass123
MEDIA_DB_NAME=agritrace_media
MEDIA_GRPC_URL=0.0.0.0:50054

# ──────── Audit DB (5437) ────────
AUDIT_DB_HOST=localhost
AUDIT_DB_PORT=5437
AUDIT_DB_USER=audit_admin
AUDIT_DB_PASS=audit_pass123
AUDIT_DB_NAME=agritrace_audit
AUDIT_GRPC_URL=0.0.0.0:50055

# ──────── Redis ────────
REDIS_HOST=localhost
REDIS_PORT=6379

# ──────── RabbitMQ ────────
RABBITMQ_URL=amqp://agritrace:agritrace_pass123@localhost:5672

# ──────── Rate limit ────────
RATE_LIMIT_TTL_MS=60000
RATE_LIMIT_MAX=100

# ──────── Cloudinary ────────
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# ──────── Seed (demo accounts) ────────
ADMIN_PASSWORD=Adminpassword
USER_PASSWORD=userpassword

# ──────── Blockchain anchor (TÙY CHỌN) ────────
ANCHOR_RPC_URL=https://sepolia.infura.io/v3/<KEY>
ANCHOR_PRIVATE_KEY=0x...              # Ví deploy audit-service (có ETH testnet)
ANCHOR_CONTRACT_ADDRESS=0xE777C423eafaa029c743f67B7e86999FD6bC86f9
ANCHOR_CHAIN_ID=11155111
ANCHOR_CRON=0 * * * *                 # Mỗi giờ
ANCHOR_BATCH_SIZE=500
```

---

## Tài khoản demo

Sau khi chạy `npm run seed:fresh`:

| Vai trò | Email | Password (env) |
|---|---|---|
| **Admin** | `admin@gmail.com` | `${ADMIN_PASSWORD}` |
| **Farmer** | `farmer1@gmail.com` → `farmer3@gmail.com` | `${USER_PASSWORD}` |
| **Inspector** | `inspector1@gmail.com`, `inspector2@gmail.com` | `${USER_PASSWORD}` |

---

## Mô hình dữ liệu

### User service (`agritrace_users`)

| Bảng | Vai trò |
|---|---|
| `users` | Tài khoản (email, password_hash, role, status, refresh_token_hash) |
| `user_profiles` | Hồ sơ chi tiết (full_name, phone, avatar…) |
| `user_keys` | RSA public keys, `is_active`, `revoked_at` |
| `jwt_keys` | Key rotation cho JWT (kid, purpose, status: active/retiring/retired) |
| `revoked_tokens` | JWT blacklist sau logout |
| `notifications` | In-app notifications (user_id, type, title, message, link, data, is_read) |

### Product service (`agritrace_products`)

| Bảng | Vai trò |
|---|---|
| `farms` | Nông trại (owner_id, name, location, area, certification_status) |
| `batches` | Lô sản phẩm (batch_code, farm_id, crop_category_id, status, planting/harvest dates) |
| `crop_categories` | Loại cây trồng (admin quản lý) |
| `certification_templates` | Template chứng nhận VietGAP / GlobalGAP / Organic |
| `checklist_items` | Câu hỏi/tiêu chí trong template |
| `checklist_responses` | Lần farmer điền checklist cho 1 farm (status: DRAFT/SUBMITTED/APPROVED/REJECTED) |
| `checklist_response_items` | Câu trả lời cho từng item |

### Trace service (`agritrace_traces`)

| Bảng | Vai trò |
|---|---|
| `activity_logs` | Nhật ký canh tác (batch_id, activity_type, performed_by, inputs_used, digital_signature) |
| `inspections` | Kiểm tra (inspector_id, type, result, scheduled_at, conducted_at, digital_signature) |

### Audit service (`agritrace_audit`)

| Bảng | Vai trò |
|---|---|
| `audit_logs` | WORM hash chain (seq_no, actor, action, before/after, prev_hash, record_hash, anchor_id) |
| `anchors` | Merkle anchor records (merkle_root, from_seq, to_seq, tx_hash, block_number, chain_id) |

### Media service (`agritrace_media`)

| Bảng | Vai trò |
|---|---|
| `assets` | Metadata Cloudinary assets (entity_type, entity_id, public_id, url, mime, size) |

---

## Bảo mật

### Authentication
- **JWT** access (15m) + refresh (7d), refresh hash lưu DB → có thể revoke khi logout.
- **Key rotation** qua bảng `jwt_keys` (kid + status `active`/`retiring`/`retired`) — đổi secret không invalidate token đang dùng.
- **Bcrypt** cho password (cost 10).
- **JWT blacklist** qua `revoked_tokens` cho logout.

### Authorization (defense in depth)
1. **Rate limiting** — `ThrottlerGuard` + Redis storage, chạy đầu tiên để chặn brute-force sớm.
2. **JwtAuthGuard** — verify JWT, gắn `req.user`, trừ endpoint `@Public()`.
3. **RolesGuard (RBAC)** — check `@Roles(Role.ADMIN | FARMER | INSPECTOR)`. `ADMIN` bypass mọi role check.
4. **OwnershipGuard (ABAC)** — `@OwnsFarm()` / `@OwnsBatch()` chặn user thao tác trên tài nguyên không thuộc về mình.
5. **AuditableInterceptor** — ghi log mọi handler có `@Auditable()` sau khi pass authn/authz.

### Khác
- **Rate limit** áp dụng cả gateway + custom hơn cho endpoint nhạy cảm (login, register).
- **CORS** whitelist origin từ env.
- **Cookie httpOnly + sameSite=lax** cho refresh token.
- **GrpcToHttpExceptionFilter** chuyển gRPC errors → HTTP codes phù hợp (không leak internal).

---

## Audit log & Blockchain anchor

### Cách audit log được ghi

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant GW as API Gateway
    participant PS as product-service
    participant MQ as RabbitMQ
    participant AS as audit-service
    participant DB as audit-db

    C->>GW: POST /farms (cookie + JWT)
    GW->>GW: Guards: JWT → RBAC → ABAC
    GW->>PS: gRPC CreateFarm
    PS-->>GW: { farm }
    GW->>GW: AuditableInterceptor (sau response)
    GW->>MQ: publish audit.log.write { action, before, after, actor }
    MQ-->>AS: consume queue
    AS->>DB: INSERT audit_logs (seq_no, prev_hash, record_hash)
    Note over DB: Trigger WORM chặn DELETE/UPDATE
```

### Hash chain công thức

```
record_hash = sha256(
  seq_no || actor_id || action || entity_type || entity_id ||
  JSON(before) || JSON(after) || prev_hash
)
```

Record đầu tiên dùng `prev_hash = '0' × 64`. Phá 1 record → mọi `record_hash` sau đó đều sai.

### Merkle anchor flow (cron `0 * * * *`)

```mermaid
graph LR
    A[audit_logs<br/>chưa anchor] --> B[Build Merkle Tree<br/>keccak256 leaves]
    B --> C[storeAnchor root, fromSeq, toSeq]
    C --> D[AgriTraceAnchor.sol<br/>Sepolia]
    D --> E[Lưu anchors<br/>tx_hash, block_number]
    E --> F[UPDATE audit_logs<br/>SET anchor_id = X]
```

### Verify trên frontend
- Trang `/audit/[seq]/verify`: fetch record + sibling hashes → tính lại Merkle proof → đọc root từ contract qua ethers v6 → so sánh → render badge **"Đã neo on-chain ✓"** hoặc cảnh báo tampering đỏ.

---

## Notification realtime

```mermaid
graph LR
    GW[API Gateway] -->|publish notification.dispatch| MQ{{RabbitMQ}}
    MQ -->|consume| US[user-service]
    US --> DB[(notifications)]
    US -->|Socket.IO emit| Client[Browser]
```

- **Trigger**: ví dụ admin duyệt chứng nhận → product-service gọi gateway helper → publish event.
- **Consumer**: user-service consume queue, insert vào `notifications`, emit Socket.IO room `user:{userId}`.
- **Frontend**: kết nối Socket.IO sau login, lắng nghe `notification:new` → toast + badge counter.
- **DLX** `agritrace.dlx`: message lỗi được giữ lại để inspect / requeue thủ công.

Notification types hiện hỗ trợ:
- `INSPECTION_CREATED`, `INSPECTION_RESULT`
- `USER_ACCOUNT_UPDATE`
- `CERTIFICATION_REQUESTED`, `CERTIFICATION_APPROVED`, `CERTIFICATION_REJECTED`
- `CERT_CHECKLIST_SUBMITTED`

---

## Smart contract

Phần blockchain anchor **không bắt buộc** để chạy hệ thống — audit-service vẫn hoạt động ở chế độ off-chain (chỉ thiếu phần on-chain verify).

### Contract đã deploy

| Item | Value |
|---|---|
| Network | Sepolia (chainId 11155111) |
| Address | [`0xE777C423eafaa029c743f67B7e86999FD6bC86f9`](https://sepolia.etherscan.io/address/0xE777C423eafaa029c743f67B7e86999FD6bC86f9) |
| ABI | `backend/libs/shared/abi/AgriTraceAnchor.json` |
| Solidity | 0.8.24 |

### Re-deploy nếu cần

```bash
cd backend/contracts
cp .env.example .env             # set SEPOLIA_RPC_URL + DEPLOYER_PRIVATE_KEY
npm run test                     # 12 test cases local (storeAnchor, ownership, revert paths)
npm run deploy:sepolia           # in ra contract address
npm run export-abi               # copy ABI sang libs/shared/abi/
npm run verify:sepolia <addr>    # verify trên Etherscan (tùy chọn)
```

Sau đó set `ANCHOR_CONTRACT_ADDRESS`, `ANCHOR_PRIVATE_KEY`, `ANCHOR_RPC_URL` trong `backend/.env` → restart audit-service. Faucet ETH Sepolia: <https://sepolia-faucet.pk910.de/>.

### API contract (rút gọn)

```solidity
function storeAnchor(bytes32 root, uint256 fromSeq, uint256 toSeq)
    external onlyOwner returns (uint256 anchorId);

function getAnchor(uint256 anchorId) external view returns (Anchor memory);

function transferOwnership(address newOwner) external onlyOwner;
```

Anchor là **append-only** — không có `update` hay `delete`.

---

## RBAC & Phân quyền

| Action | Admin | Farmer | Inspector | Consumer (public) |
|---|:---:|:---:|:---:|:---:|
| Quản lý users | ✓ | — | — | — |
| Quản lý crop categories | ✓ | — | — | — |
| Quản lý certification templates | ✓ | — | — | — |
| Duyệt / reject checklist response | ✓ | — | — | — |
| Tạo / sửa farm của mình | ✓ | ✓ (own) | — | — |
| Tạo / sửa batch của mình | ✓ | ✓ (own) | — | — |
| Ghi activity log + ký số | ✓ | ✓ (own batch) | — | — |
| Điền checklist xin chứng nhận | ✓ | ✓ (own farm) | — | — |
| Tạo / hoàn thành inspection + ký số | ✓ | — | ✓ | — |
| Xem audit log | ✓ | ✓ (filter own actions) | ✓ (own actions) | — |
| Xem trace public qua QR | ✓ | ✓ | ✓ | ✓ |
| Verify Merkle proof on-chain | ✓ | ✓ | ✓ | ✓ |

**Ghi chú**: `ADMIN` bypass mọi RBAC check trong `RolesGuard`. Ownership check (ABAC) vẫn áp dụng cho farmer/inspector.

---

## Scripts hữu ích

| Lệnh | Vị trí | Mô tả |
|---|---|---|
| `npm run dev` | `backend/` | Bật DB + 6 service song song |
| `npm run start:db` / `stop:db` | `backend/` | docker compose up / down |
| `npm run start:dev:all` | `backend/` | Chạy 6 service (DB phải sẵn) |
| `npm run start:<service>` | `backend/` | Chạy 1 service riêng (vd: `start:audit-service`) |
| `npm run seed:fresh` | `backend/` | Wipe DB + seed lại toàn bộ |
| `npm run seed:users` / `:products` / `:traces` | `backend/` | Seed từng phần |
| `npm run test` / `:cov` / `:e2e` | `backend/` | Jest unit / coverage / E2E |
| `npm run lint` | `backend/` | ESLint --fix |
| `npm run demo:tampering` | `backend/` | Disable trigger WORM → sửa 1 record để demo tampering detection |
| `npm run demo:restore` | `backend/` | Khôi phục trigger + dữ liệu sau demo |
| `npm run deploy:sepolia` | `backend/contracts/` | Deploy smart contract |
| `npm run test` | `backend/contracts/` | Hardhat tests |
| `npm run dev` | `frontend/` | Next.js dev server (:3000) |
| `npm run build` / `start` | `frontend/` | Build & serve production |
| `npm run tunnel` | `frontend/` | localtunnel để demo QR scan trên mobile |

---

## Demo flow

> 5–7 phút, đủ trình diễn các điểm nhấn cho hội đồng chấm.

### 1. CRUD có audit ngay (1 phút)
- Login `admin@gmail.com` → vào **/farms** → tạo farm mới "Farm Demo" → sửa địa chỉ.
- Mở tab **/audit** → 2 dòng `FARM_CREATED` / `FARM_UPDATED` xuất hiện ngay (real-time qua RabbitMQ).
- Click 1 row → xem **JSON diff** của `before_data` vs `after_data`.

### 2. Chữ ký số client-side (1.5 phút)
- Login `farmer1@gmail.com` → vào **/keys** → bấm **"Tạo cặp khóa RSA"** → tải file `.pem` về (chỉ 1 lần duy nhất, private key chỉ lưu IndexedDB).
- Vào **/batches** → chọn batch → tab **Activity Logs** → tạo log "Bón phân hữu cơ" → ký bằng PEM upload.
- Mở public trace `/trace/<batch_code>` (không cần login) → activity log hiện badge **"Đã xác thực RSA ✓"**.

### 3. WORM trigger chặn DELETE (30s)
```bash
docker exec -it agritrace-audit-db psql -U audit_admin -d agritrace_audit \
  -c "DELETE FROM audit_logs WHERE seq_no = 1;"
```
→ PostgreSQL báo lỗi: `audit_logs is WORM — UPDATE/DELETE forbidden`.

### 4. Tampering detection (1.5 phút)
```bash
npm run demo:tampering
```
- Script disable trigger → UPDATE record có `seq_no = 5` (sửa `after_data`) → re-enable trigger.
- Mở `/audit/5/verify` → badge **đỏ "Hash chain bị phá vỡ"** + chỉ rõ `expected_hash` vs `actual_hash`.
- Khôi phục: `npm run demo:restore`.

### 5. On-chain anchor (1 phút, cần ETH testnet)
- Vào **/audit** → bấm **"Anchor ngay"** (gọi job thủ công thay vì chờ cron).
- 15–30s sau → notification toast hiện **tx hash Sepolia** → click mở Etherscan thấy event `AnchorStored`.
- Vào `/audit/<seq>/verify` của 1 record đã anchor → hiện **"Đã neo on-chain ✓"** + link tx.

### 6. Certification VietGAP (1 phút)
- Login `farmer1` → **/farms/<id>/certification** → chọn template VietGAP → điền checklist → submit.
- Logout → login `admin` → notification realtime "Có yêu cầu chứng nhận mới" → vào **/standards/<responseId>** → approve.
- Farmer nhận notification "Chứng nhận VietGAP đã được duyệt" → farm chuyển sang `certification_status = VIETGAP`.

---

## Testing

```bash
# Backend
cd backend
npm run test          # Jest unit tests
npm run test:cov      # Coverage report → ./coverage/
npm run test:e2e      # End-to-end (supertest)

# Smart contract
cd contracts
npm run test          # 12 Hardhat test cases
```

Khu vực coverage hiện tại: shared utils, hash chain logic, Merkle build, một số controller. **Coverage frontend chưa có** (roadmap).

---

## Troubleshooting

<details>
<summary><b>Backend không kết nối được Postgres / Redis / RabbitMQ</b></summary>

- Kiểm tra `docker ps` → cả 7 container phải UP.
- Kiểm tra port không bị xung đột: `5433-5437`, `6379`, `5672`, `15672`.
- Xem log: `docker logs agritrace-user-db` (đổi tên container tương ứng).
- Nếu vừa đổi `.env`, restart cả `npm run stop:db && npm run start:db`.

</details>

<details>
<summary><b>"audit_logs is WORM" khi seed</b></summary>

Seed phải chạy **trước khi** trigger WORM được tạo, hoặc dùng `npm run seed:fresh` (script tự drop + recreate trigger). Không tự ý disable trigger trừ demo.

</details>

<details>
<summary><b>Anchor job lỗi "insufficient funds for gas"</b></summary>

Ví trong `ANCHOR_PRIVATE_KEY` hết ETH Sepolia. Xin faucet: <https://sepolia-faucet.pk910.de/> hoặc tạm thời để `ANCHOR_RPC_URL` rỗng để audit-service skip job anchor.

</details>

<details>
<summary><b>Frontend không nhận notification realtime</b></summary>

- Mở DevTools → Network → WS tab → xem socket có connect không.
- Check `NEXT_PUBLIC_SOCKET_URL` đúng origin gateway.
- Verify cookie JWT có valid (Socket.IO middleware require JWT).

</details>

<details>
<summary><b>Browser mất private key sau khi xóa IndexedDB</b></summary>

Đây là tính năng bảo mật, không phải bug. User phải tạo key mới qua **/keys** (revoke key cũ tự động). Mọi log đã ký bằng key cũ vẫn verify được vì public key vẫn lưu DB.

</details>

---

## Roadmap

### Đã hoàn thành (v1.0)
- [x] 6 microservices gRPC + RabbitMQ event-driven
- [x] JWT + key rotation + RBAC + ABAC ownership
- [x] WORM hash chain audit log
- [x] Merkle anchor lên Sepolia + verify on-chain
- [x] Chữ ký số RSA-2048 client-side (Web Crypto API)
- [x] Certification flow VietGAP / GlobalGAP / Organic
- [x] Notification realtime qua Socket.IO + RabbitMQ DLX
- [x] Cloudinary upload + asset management
- [x] Public QR trace (không cần đăng nhập)

### Đang lên kế hoạch
- [ ] OpenAPI / Swagger docs auto-generate
- [ ] Health checks + readiness probe (`@nestjs/terminus`)
- [ ] Public verify page chuẩn (zero-trust hoàn chỉnh)
- [ ] E2E test coverage cho 3 luồng critical (ký số, WORM, tampering)
- [ ] Mobile app React Native cho farmer ghi nhật ký ngoài đồng
- [ ] QR scan analytics dashboard (lượt scan, geo, conversion)
- [ ] IoT sensor integration (nhiệt độ kho lạnh → auto audit)
- [ ] Multi-chain anchoring (Sepolia + Polygon Amoy + Arbitrum Sepolia)
- [ ] Kubernetes Helm chart + GitHub Actions CI/CD
- [ ] Observability: Prometheus + Grafana cho gRPC latency, MQ queue depth

---

## License

[MIT](LICENSE) — Free for academic & commercial use.

---

<div align="center">

**AgriTrace** · *Trồng sạch, bán minh bạch, ăn an tâm — và bất biến trên blockchain.*

Made for graduation thesis · 2026

</div>
