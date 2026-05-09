<div align="center">

# AgriTrace — Hệ thống Truy xuất Nguồn gốc Nông sản

**Nền tảng truy xuất nguồn gốc nông sản đầu–cuối, xây dựng trên kiến trúc Microservices, có chữ ký số RSA và neo bằng chứng bất biến lên Ethereum blockchain.**

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![gRPC](https://img.shields.io/badge/gRPC-Protobuf-4285F4?logo=google&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity&logoColor=white)
![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-627EEA?logo=ethereum&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

</div>

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Tính năng chính](#2-tính-năng-chính)
3. [Kiến trúc hệ thống](#3-kiến-trúc-hệ-thống)
4. [Bảo mật, Audit & Blockchain](#4-bảo-mật-audit--blockchain)
5. [Công nghệ sử dụng](#5-công-nghệ-sử-dụng)
6. [Cấu trúc thư mục](#6-cấu-trúc-thư-mục)
7. [Yêu cầu hệ thống](#7-yêu-cầu-hệ-thống)
8. [Hướng dẫn cài đặt & chạy](#8-hướng-dẫn-cài-đặt--chạy)
9. [Biến môi trường](#9-biến-môi-trường)
10. [Scripts npm hữu ích](#10-scripts-npm-hữu-ích)
11. [Demo flow cho thuyết minh](#11-demo-flow-cho-thuyết-minh)
12. [Hướng phát triển](#12-hướng-phát-triển)

---

## 1. Giới thiệu

**AgriTrace** là hệ thống truy xuất nguồn gốc nông sản toàn trình, được xây dựng cho đề tài tốt nghiệp nhằm giải quyết bài toán **minh bạch chuỗi cung ứng nông nghiệp** tại Việt Nam.

Nông dân ghi nhận quy trình canh tác theo thời gian thực, kiểm định viên ký xác thực bằng **chữ ký số RSA-2048**, mọi biến động dữ liệu được ghi vào **audit log WORM (Write-Once-Read-Many)** với hash chain chống giả mạo, và mỗi giờ Merkle root của lô log được **neo (anchor) lên Ethereum Sepolia blockchain** — bất kỳ ai trên thế giới có thể độc lập verify dữ liệu chưa từng bị tampering.

Người tiêu dùng cuối **quét mã QR** trên bao bì để xem đầy đủ xuất xứ, nhật ký canh tác, kết quả kiểm định và bằng chứng on-chain — không cần đăng nhập, không cần tin server.

Hệ thống phục vụ bốn nhóm đối tượng:

| Đối tượng | Vai trò |
|---|---|
| **Admin** | Quản trị hệ thống, phân quyền, cấp/thu hồi khoá số, kiểm duyệt chứng nhận, giám sát audit log + verify on-chain |
| **Nông dân (Farmer)** | Quản lý nông trại, lô sản phẩm, ghi nhật ký canh tác, ký số nhật ký bằng RSA private key, xin chứng nhận VietGAP/GlobalGAP/Organic |
| **Kiểm định viên (Inspector)** | Đánh giá chất lượng theo tiêu chuẩn, ký số kết quả kiểm định bằng RSA private key |
| **Người tiêu dùng** | Quét QR truy xuất công khai, xem trace + badge "Đã xác thực RSA" + link Etherscan tx |

---

## 2. Tính năng chính

### Dành cho Nông dân
- Quản lý danh mục **nông trại** (Farm) với vị trí GPS, diện tích, chứng nhận.
- Tạo **lô sản phẩm** (Batch) gắn với loại cây trồng (CropCategory), state machine: `SEEDING → GROWING → HARVESTED → INSPECTED → PACKED → SHIPPED`.
- Ghi **nhật ký canh tác** (ActivityLog): gieo trồng, tưới tiêu, bón phân, phun thuốc, làm cỏ, thu hoạch, đóng gói…
- **Ký số nhật ký** bằng RSA private key (Web Crypto API, lưu IndexedDB browser, không leak ra server).
- Tải lên ảnh minh hoạ cho nông trại / lô / hoạt động (Cloudinary CDN).
- Xin **chứng nhận** VietGAP / GlobalGAP / Hữu cơ; admin duyệt hoặc từ chối.
- Sinh **mã QR** duy nhất cho mỗi lô — in trên bao bì để consumer truy xuất.

### Dành cho Kiểm định viên
- Tiếp nhận yêu cầu kiểm định trên các lô sản phẩm.
- Đánh giá theo các tiêu chuẩn (`FIELD_VISIT`, `LAB_TEST`, `DOCUMENT_REVIEW`, `FINAL_CERTIFICATION`).
- Ghi nhận kết quả `PASS` / `FAIL` / `CONDITIONAL_PASS` / `PENDING` kèm ảnh chứng cứ.
- **Ký số inspection** bằng RSA private key — backend verify trước khi store.

### Dành cho Quản trị
- CRUD người dùng, gán vai trò (ADMIN / FARMER / INSPECTOR).
- Cấp / thu hồi **JWT key** (rotation định kỳ qua `@nestjs/schedule` cron).
- **Audit log dashboard** (`/audit`): filter theo entity / action / actor, paginate, click row xem before/after JSON diff.
- **Cryptographic verification** (`/audit/[seq]/verify`): kiểm tra hash chain integrity + Merkle proof + on-chain root match — 3 lớp.
- **Trigger anchor thủ công** (button "Anchor ngay") — gửi tx Sepolia ngay lập tức thay vì đợi cron 1 giờ.
- Duyệt / từ chối yêu cầu chứng nhận VietGAP của farmer; gửi notification real-time qua WebSocket.

### Dành cho Người tiêu dùng
- Quét QR trên bao bì bằng điện thoại → mở trang trace công khai.
- Xem timeline đầy đủ: thông tin nông trại, từng hoạt động canh tác (kèm badge "Đã xác thực RSA"), kết quả kiểm định.
- Truy cập không cần đăng nhập, có cache Redis 60s để phản hồi tức thì.
- Click link Etherscan để tự verify on-chain anchor — không cần tin server AgriTrace.

---

## 3. Kiến trúc hệ thống

### Mô hình tổng quan

Hệ thống áp dụng kiến trúc **Microservices** với:
- **REST** giữa client và API Gateway.
- **gRPC + Protobuf** giữa các service nội bộ (low-latency, type-safe).
- **Database-per-Service**: 5 PostgreSQL độc lập.
- **Redis** làm cache + rate limiting tập trung.
- **Cloudinary** lưu media + CDN.
- **WebSocket (Socket.io)** push notification real-time.
- **Ethereum Sepolia** lưu Merkle root anchors (immutable proof).

```mermaid
graph TB
    subgraph Client["Client Layer"]
        WEB["Next.js Web App<br/>(Admin / Farmer / Inspector)"]
        QR["QR Scanner<br/>(Consumer — public)"]
    end

    subgraph Gateway["Edge Layer"]
        GW["API Gateway :8000<br/>JWT · RBAC · ABAC · Throttle<br/>@Auditable Interceptor"]
    end

    subgraph Services["Microservices (gRPC)"]
        US["user-service<br/>:3001 · gRPC :50051"]
        PS["product-service<br/>:3002 · gRPC :50052"]
        TS["trace-service<br/>:3003 · gRPC :50053"]
        MS["media-service<br/>:3004 · gRPC :50054"]
        AS["audit-service<br/>:3005 · gRPC :50055<br/>WORM hash-chain"]
    end

    subgraph Data["Data & Infrastructure"]
        UDB[("user-db :5433")]
        PDB[("product-db :5434")]
        TDB[("trace-db :5435")]
        MDB[("media-db :5436")]
        ADB[("audit-db :5437<br/>WORM trigger")]
        REDIS[("Redis :6379<br/>Cache + Throttle")]
        CDN[["Cloudinary CDN"]]
    end

    subgraph Blockchain["Public Blockchain (Sepolia testnet)"]
        SC["AgriTraceAnchor.sol<br/>0xE777C423...86bC86f9"]
        ETH[["Ethereum Sepolia<br/>chainId 11155111"]]
    end

    WEB -->|HTTPS REST| GW
    QR  -->|HTTPS REST| GW

    GW -.gRPC.-> US
    GW -.gRPC.-> PS
    GW -.gRPC.-> TS
    GW -.gRPC.-> MS
    GW -.gRPC<br/>WriteLog.-> AS

    GW  --> REDIS
    TS  --> REDIS

    US  --> UDB
    PS  --> PDB
    TS  --> TDB
    MS  --> MDB
    AS  --> ADB
    MS  --> CDN

    AS -.cron 1h<br/>ethers.js.-> SC
    SC --> ETH

    classDef chain fill:#fff5e6,stroke:#e8a317,stroke-width:2px
    class SC,ETH chain
```

### Vai trò từng service

| Service | HTTP | gRPC | Trách nhiệm | Database |
|---|:---:|:---:|---|---|
| **api-gateway** | 8000 | — | Cổng vào duy nhất, JWT, RBAC, ABAC ownership, rate limit, **AuditableInterceptor** ghi audit fire-and-forget | — |
| **user-service** | 3001 | 50051 | Người dùng, profile, JWT key rotation, RSA user keys (sign/verify) | `agritrace_users` |
| **product-service** | 3002 | 50052 | Farms, Batches, Crop Categories, certification flow, sinh QR | `agritrace_products` |
| **trace-service** | 3003 | 50053 | ActivityLogs, Inspections, public trace API | `agritrace_traces` |
| **media-service** | 3004 | 50054 | Cloudinary asset, upload pipeline | `agritrace_media` |
| **audit-service** | 3005 | 50055 | WORM hash chain, Merkle root anchor cron, verifyLog 3 lớp | `agritrace_audit` |

---

## 4. Bảo mật, Audit & Blockchain

Đây là điểm khác biệt cốt lõi so với các hệ thống truy xuất thông thường.

### 4.1 Chữ ký số RSA-2048 (Digital Signature)

- **Generate**: server (`user-service`) sinh cặp khoá RSA-2048 bằng `crypto.generateKeyPairSync()`, **chỉ trả private key 1 lần duy nhất** lúc tạo. DB chỉ lưu public key.
- **Frontend lưu private key**: import PEM → IndexedDB (sandbox per-origin), không leak qua localStorage hay server.
- **Sign**: Web Crypto API `crypto.subtle.sign('RSASSA-PKCS1-v1_5')` trên canonical JSON của activity log / inspection.
- **Verify**: API Gateway dùng `crypto.createVerify('RSA-SHA256')` với public key fetched qua gRPC, kiểm 3 điều kiện: chữ ký hợp lệ + key thuộc đúng user + key chưa bị thu hồi → mới forward đến trace-service để store.

### 4.2 WORM Audit Log (Off-chain hash chain)

Mỗi action trên hệ thống (33 endpoints) tự động sinh 1 audit log thông qua decorator `@Auditable`:

```ts
@Auditable(AUDIT_ACTIONS.FARM_CREATED, { entityType: 'Farm' })
@Post()
create(@Body() dto: CreateFarmDto, @CurrentUser() user) { ... }
```

`AuditableInterceptor` global capture `actor_id`, `action`, `before/after`, `metadata { ip, user_agent, request_id }`, sanitize sensitive fields (password/token/secret), gửi gRPC `WriteLog` fire-and-forget tới `audit-service`.

Trong `audit-service`:
- Mỗi log có `record_hash = sha256(prev_hash || canonical(payload))` → **tamper-evident chain**.
- `seq_no` BIGSERIAL monotonic, advisory lock `pg_advisory_xact_lock` đảm bảo single-writer (chain không fork).
- **Postgres trigger `trg_audit_log_worm`** chặn DELETE và mọi UPDATE trừ set `anchor_id` 1 lần (NULL → not NULL).

### 4.3 Blockchain Anchor (On-chain proof)

- **Smart contract**: [`AgriTraceAnchor.sol`](backend/contracts/contracts/AgriTraceAnchor.sol) (~30 dòng Solidity 0.8.24) deployed lên **Sepolia** tại `0xE777C423eafaa029c743f67B7e86999FD6bC86f9`.
- **Anchor Worker** (`@nestjs/schedule` cron `0 * * * *`): mỗi giờ lấy unanchored logs → build Merkle tree (`merkletreejs` + keccak256) → gửi tx `storeAnchor(root, fromSeq, toSeq)` qua ethers.js v6 → save Anchor row + update `anchor_id` cho range logs (transactional).
- **Idempotency**: nếu DB transaction fail sau khi tx mined, lần chạy sau retry với cùng range → có thể có 2 anchors trùng on-chain nhưng OK (verify chỉ cần 1 root hợp lệ).
- **Mutex**: `pg_advisory_lock(0x41475255)` chống 2 instance worker chạy đồng thời.

### 4.4 Verify endpoint 3 lớp

`GET /audit/:seq_no/verify` trả về kết quả của 3 lớp kiểm tra độc lập:

| Lớp | Kiểm tra | Phát hiện được |
|---|---|---|
| **1** | Recompute `record_hash` từ payload + prev_hash → so DB | Sửa lẻ tẻ 1 record (hash chain phá vỡ) |
| **2** | Rebuild Merkle tree từ logs cùng anchor → verify proof | Sửa nhiều record cùng anchor (Merkle root đổi) |
| **3** | Đọc on-chain `anchors[id].merkleRoot` từ contract → so DB | Rewrite cả chain off-chain (vẫn không sửa được on-chain) |

Tampering chỉ có thể được che giấu nếu attacker đồng thời:
1. Bypass Postgres trigger WORM (cần superuser DB)
2. Rewrite hash chain từ điểm tampering trở đi
3. **Sửa lịch sử Ethereum Sepolia** (cần ~50% hash power toàn mạng global) — practically impossible

→ Hệ thống đạt **immutability** tương đương các giải pháp blockchain enterprise nhưng chi phí gần $0 (Sepolia testnet).

### 4.5 Tampering demo (cho thuyết minh)

Mở `psql` vào audit-db rồi chạy:
```sql
ALTER TABLE audit_logs DISABLE TRIGGER trg_audit_log_worm;
UPDATE audit_logs SET action='HACKED' WHERE seq_no=1;
ALTER TABLE audit_logs ENABLE TRIGGER trg_audit_log_worm;
```
→ Refresh `/audit/1/verify` trên FE → Section 1 hiện ✗ đỏ "Không khớp" trong < 1 giây.
→ Click link Etherscan trên Section 2 → Merkle root on-chain vẫn là root cũ → người ngoài cũng phát hiện tampering.

---

## 5. Công nghệ sử dụng

### Backend (NestJS monorepo)

| Hạng mục | Công nghệ | Phiên bản | Vai trò |
|---|---|:---:|---|
| Framework | NestJS | 11 | Monorepo (6 apps) |
| Ngôn ngữ | TypeScript | 5.7 | Type-safe |
| ORM | TypeORM | 0.3 | PostgreSQL mapping |
| RPC | @grpc/grpc-js + proto-loader | 1.14 / 0.8 | gRPC nội bộ |
| Auth | Passport + passport-jwt + @nestjs/jwt | — | JWT access (15m) + refresh (7d) |
| Hashing | bcrypt | 6 | Password hashing |
| Validation | class-validator + class-transformer | 0.15 / 0.5 | DTO validation |
| Cache / Throttle | ioredis + @nestjs/throttler + @nest-lab/throttler-storage-redis | — | Redis-backed rate limit |
| QR | qrcode | 1.5 | Server-side QR generation |
| Media | cloudinary + multer | 2.9 / 1.4 | Image upload |
| Scheduler | @nestjs/schedule | 6.1 | Cron (JWT rotation, anchor worker) |
| WebSocket | @nestjs/websockets + socket.io | — | Real-time notifications |
| **Blockchain** | **ethers** | **6** | **Tx Ethereum, parse events** |
| **Merkle** | **merkletreejs + keccak256** | **0.6 / 1.0** | **Build & verify Merkle tree** |

### Smart Contract (Hardhat sub-project)

| Hạng mục | Công nghệ | Phiên bản |
|---|---|:---:|
| Solidity | solc | 0.8.24 |
| Framework | Hardhat | 2.22 |
| Toolbox | @nomicfoundation/hardhat-toolbox | 5 |
| Testing | Chai + Mocha (built-in) | — |
| Network | Ethereum Sepolia testnet | chainId 11155111 |

### Frontend (Next.js)

| Hạng mục | Công nghệ | Phiên bản | Vai trò |
|---|---|:---:|---|
| Framework | Next.js | 16.2 | App Router |
| UI Runtime | React | 19.2 | Server + Client Components |
| Styling | Tailwind CSS | 4 | Utility-first |
| Components | Radix UI + shadcn/ui | — | Accessible primitives |
| State | Zustand | 5 | Client state |
| Data Fetching | @tanstack/react-query | 5.96 | Cache + sync server state |
| Form | react-hook-form + Zod | 7.72 / 4.3 | Form + schema |
| Chart | Recharts | 3.8 | Dashboard biểu đồ |
| QR UI | qrcode.react | 4.2 | QR display |
| Theme | next-themes | 0.4 | Dark/Light mode |
| Icon | lucide-react + react-icons | — | Icons |
| Notify | sonner | 2 | Toast |
| **Crypto** | **Web Crypto API (native)** | — | **RSA sign client-side** |

### Hạ tầng & DevOps

| Hạng mục | Công nghệ | Vai trò |
|---|---|---|
| Database | PostgreSQL 16 (× 5 instance) | Database-per-service |
| Cache | Redis 7 | Cache QR + rate limit storage |
| Object Storage | Cloudinary | CDN ảnh |
| Container | Docker Compose | Local dev orchestration |
| Process Runner | concurrently | Chạy 6 service song song |
| Test (BE) | Jest + ts-jest + supertest | Unit + E2E |
| Test (Contract) | Hardhat | 12 test cases |
| Code Quality | ESLint 9 + Prettier 3 | Lint + format |
| Blockchain RPC | Alchemy / QuickNode / publicnode | Sepolia endpoint |

---

## 6. Cấu trúc thư mục

```
AgriTrace System/
├── backend/
│   ├── apps/
│   │   ├── api-gateway/            # REST gateway, JWT/RBAC, throttle, AuditableInterceptor
│   │   ├── user-service/           # Users, profiles, JWT keys, RSA user keys
│   │   ├── product-service/        # Farms, Batches, Crops, certification, QR generator
│   │   ├── trace-service/          # ActivityLogs, Inspections, public trace
│   │   ├── media-service/          # Cloudinary assets, upload pipeline
│   │   └── audit-service/          # WORM hash-chain + Merkle Anchor Worker
│   │       └── src/
│   │           ├── audit/          # hash-chain, WORM bootstrap, verifyLog 3 lớp
│   │           ├── anchor/         # MerkleService, BlockchainService, AnchorWorker (cron)
│   │           └── entities/       # audit_logs, anchors
│   ├── contracts/                  # Hardhat sub-project (standalone npm)
│   │   ├── contracts/AgriTraceAnchor.sol
│   │   ├── scripts/deploy.ts + export-abi.js
│   │   ├── test/AgriTraceAnchor.test.ts (12 tests)
│   │   └── hardhat.config.ts
│   ├── libs/
│   │   └── shared/
│   │       ├── proto/              # user/product/trace/media/audit.proto
│   │       ├── abi/                # AgriTraceAnchor.json (export từ Hardhat)
│   │       └── src/                # enums, types (AUDIT_ACTIONS), redis, blockchain.ts
│   ├── seeds/                      # user/product/trace/asset seed
│   ├── scripts/                    # demo-tampering.ts (optional)
│   ├── nest-cli.json               # Monorepo config
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── (app)/                  # Layout có auth
│   │   │   ├── dashboard/          # 3 dashboard theo role
│   │   │   ├── farms/ batches/ crops/ users/ standards/ keys/
│   │   │   └── audit/              # Audit log list + verify pages
│   │   │       └── [seq_no]/verify/
│   │   └── (public)/               # QR trace page (no auth)
│   ├── components/                 # UI components (Radix + shadcn)
│   ├── hooks/                      # use-farms, use-batches, use-audit-logs, …
│   ├── lib/
│   │   ├── api/                    # apiFetch + farmApi/batchApi/auditApi/…
│   │   ├── crypto.ts               # Web Crypto helpers (signData, importPrivateKey)
│   │   └── blockchain.ts           # Sepolia constants + explorer URL helpers
│   └── stores/                     # Zustand auth store
├── docker-compose.yml              # 5 PostgreSQL + Redis
└── README.md
```

---

## 7. Yêu cầu hệ thống

| Công cụ | Phiên bản | Bắt buộc? |
|---|---|---|
| Node.js | ≥ 20.x (Hardhat hỗ trợ tốt nhất 20-22 LTS) | ✅ |
| npm | ≥ 10.x | ✅ |
| Docker Desktop | ≥ 4.x (kèm Compose v2) | ✅ |
| Git | ≥ 2.x | ✅ |
| Cloudinary | Tài khoản free (`cloud_name`, `api_key`, `api_secret`) | ✅ |
| MetaMask | Wallet test mới (KHÔNG dùng wallet có tiền thật) | Chỉ khi muốn deploy contract |
| Sepolia ETH | ≥ 0.01 ETH testnet (faucet free) | Chỉ khi muốn deploy contract |
| Alchemy / QuickNode | Free RPC endpoint Sepolia | Chỉ khi muốn deploy contract |

---

## 8. Hướng dẫn cài đặt & chạy

### Bước 1 — Clone & cài dependencies

```bash
git clone <repo-url>
cd "AgriTrace System"

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Bước 2 — Cấu hình biến môi trường

Tạo `backend/.env` (xem [Section 9](#9-biến-môi-trường) cho danh sách đầy đủ).

Tạo `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Bước 3 — Khởi động hạ tầng (5 PostgreSQL + Redis)

```bash
cd backend
npm run start:db
```

Tạo 6 container: `agritrace-user-db`, `agritrace-product-db`, `agritrace-trace-db`, `agritrace-media-db`, `agritrace-audit-db`, `agritrace-redis`.

### Bước 4 — Seed dữ liệu mẫu

```bash
npm run seed:fresh
```

Tạo 1 admin, 3 farmer, 2 inspector, các nông trại / lô / nhật ký / inspection mẫu.

**Tài khoản demo:**

| Vai trò | Email | Password |
|---|---|---|
| Admin | `admin@gmail.com` | `Adminpassword` env |
| Farmer | `farmer1/2/3@gmail.com` | `userpassword` env |
| Inspector | `inspector1/2@gmail.com` | `userpassword` env |

### Bước 5 — Chạy 6 service backend song song

```bash
npm run start:dev:all
```

Log có 6 prefix màu: `GW`, `USER`, `PROD`, `TRACE`, `MEDIA`, `AUDIT`.

### Bước 6 — Chạy frontend

Mở terminal mới:
```bash
cd frontend
npm run dev
```

### Bước 7 — Truy cập

- Web: **http://localhost:3000**
- API Gateway: **http://localhost:8000**

### Bước 8 — (Tuỳ chọn) Deploy smart contract Sepolia

Nếu muốn dùng feature blockchain anchor:

```bash
cd backend/contracts
npm install

# Tạo .env từ template
cp .env.example .env
# Mở .env, set:
#   SEPOLIA_RPC_URL = Alchemy/QuickNode URL hoặc để trống dùng public
#   DEPLOYER_PRIVATE_KEY = private key MetaMask wallet test
#   ETHERSCAN_API_KEY = optional, cho verify

# Chạy local test (12 tests)
npm run test

# Faucet ETH Sepolia: https://sepolia-faucet.pk910.de/ (PoW, 3 phút)

# Deploy
npm run deploy:sepolia
# → in ra contract address 0x...

# Export ABI để audit-service dùng
npm run export-abi
```

Sau deploy, thêm vào `backend/.env`:
```env
ANCHOR_RPC_URL=<URL Sepolia>
ANCHOR_PRIVATE_KEY=<same private key>
ANCHOR_CONTRACT_ADDRESS=<address vừa deploy>
ANCHOR_CRON=0 * * * *
```

Restart `npm run start:audit-service`. Trên frontend `/audit`, click button **"Anchor ngay"** để gửi tx Sepolia thủ công đầu tiên.

---

## 9. Biến môi trường

### Ports & URLs

| Biến | Mô tả | Mặc định |
|---|---|---|
| `PORT` | Cổng API Gateway | `8000` |
| `FRONTEND_URL` | CORS origin | `http://localhost:3000` |
| `USER_SERVICE_PORT` … `AUDIT_SERVICE_PORT` | HTTP port từng service | `3001` … `3005` |
| `USER_SERVICE_GRPC_URL` … `AUDIT_SERVICE_GRPC_URL` | gRPC địa chỉ | `localhost:50051` … `localhost:50055` |

### Database (5 database riêng)

| Service | Host | Port | User | Pass | DB |
|---|---|---|---|---|---|
| user | `localhost` | `5433` | `user_admin` | `user_pass123` | `agritrace_users` |
| product | `localhost` | `5434` | `product_admin` | `product_pass123` | `agritrace_products` |
| trace | `localhost` | `5435` | `trace_admin` | `trace_pass123` | `agritrace_traces` |
| media | `localhost` | `5436` | `media_admin` | `media_pass123` | `agritrace_media` |
| audit | `localhost` | `5437` | `audit_admin` | `audit_pass123` | `agritrace_audit` |

Mỗi service có 5 biến: `<NAME>_DB_HOST/PORT/USER/PASS/NAME`.

### JWT

| Biến | Mô tả | Mặc định |
|---|---|---|
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Secret ký token | random ≥ 32 chars |
| `JWT_ACCESS_EXPIRATION` | Thời hạn access | `15m` |
| `JWT_REFRESH_EXPIRATION` | Thời hạn refresh | `7d` |

### Redis & Throttle

| Biến | Mô tả | Mặc định |
|---|---|---|
| `REDIS_HOST` / `REDIS_PORT` | Redis | `localhost` / `6379` |
| `RATE_LIMIT_TTL_MS` / `RATE_LIMIT_MAX` | Throttle window | `60000` / `100` |
| `QR_CACHE_TTL_SEC` | Cache QR lookup | `60` |

### Cloudinary & Seed password

| Biến | Mô tả |
|---|---|
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials |
| `Adminpassword` / `userpassword` | Seed password |

### Blockchain Anchor (chỉ cần khi dùng audit-service)

| Biến | Mô tả | Ví dụ |
|---|---|---|
| `ANCHOR_RPC_URL` | Sepolia RPC URL | `https://eth-sepolia.g.alchemy.com/v2/<key>` |
| `ANCHOR_PRIVATE_KEY` | Private key wallet đã deploy contract | `0x...` |
| `ANCHOR_CONTRACT_ADDRESS` | Address contract đã deploy | `0xE777C423...` |
| `ANCHOR_BATCH_SIZE` | Max logs / 1 anchor tx | `1000` |
| `ANCHOR_CRON` | Cron expression cho worker | `0 * * * *` |

---

## 10. Scripts npm hữu ích

### Backend (`cd backend`)

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Bật DB + chạy 6 service song song |
| `npm run start:dev:all` | Chỉ chạy 6 service (DB phải sẵn) |
| `npm run start:api-gateway` / `:user-service` / `:product-service` / `:trace-service` / `:media-service` / `:audit-service` | Chạy riêng từng service (watch) |
| `npm run start:db` / `stop:db` | Docker compose up/down |
| `npm run seed` / `seed:fresh` | Seed dữ liệu (upsert / wipe + reseed) |
| `npm run seed:users` / `:products` / `:traces` | Seed riêng từng module |
| `npm run build` / `start:prod` | Production build & run |
| `npm run test` / `test:cov` / `test:e2e` | Jest unit / coverage / E2E |
| `npm run lint` | ESLint auto-fix |

### Smart Contract (`cd backend/contracts`)

| Lệnh | Mô tả |
|---|---|
| `npm run compile` | Hardhat compile Solidity |
| `npm run test` | 12 unit tests trên Hardhat local node |
| `npm run deploy:local` | Deploy lên Hardhat node nội bộ |
| `npm run deploy:sepolia` | Deploy lên Sepolia testnet (cần `.env`) |
| `npm run verify:sepolia <address>` | Verify source code trên Etherscan |
| `npm run export-abi` | Copy ABI sang `libs/shared/abi/` |
| `npm run clean` | Xoá artifacts/cache |

### Frontend (`cd frontend`)

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Next.js dev server (`http://localhost:3000`) |
| `npm run build` | Build production |
| `npm run start` | Chạy production server |
| `npm run lint` | ESLint |

---

## 11. Demo flow cho thuyết minh

Kịch bản 5 phút show kiến trúc + bảo mật + blockchain:

### A. Show CRUD + audit auto-capture (1 phút)
1. Login admin → tạo 1 farm "Nông trại Sen Vàng"
2. Sửa farm → đổi tên
3. Mở `/audit` → thấy 2 dòng `FARM_CREATED`, `FARM_UPDATED` xuất hiện ngay (~100ms)
4. Click row → modal hiện `before_data` ≠ `after_data` (JSON diff)

### B. Show RSA digital signature (1 phút)
5. Login farmer → tạo activity log "Bón phân"
6. Click "Ký" → upload PEM → toast "Đã ký"
7. Mở public trace `/trace/{batch_code}` → thấy badge "Đã xác thực RSA"
8. Negative: thử sửa body request bằng curl với chữ ký fake → 400 "Chữ ký số không hợp lệ"

### C. Show WORM trigger (1 phút)
9. Mở psql:
   ```sql
   DELETE FROM audit_logs WHERE seq_no=1;
   -- ERROR: audit_logs is WORM — DELETE not allowed
   UPDATE audit_logs SET action='HACKED' WHERE seq_no=1;
   -- ERROR: audit_logs is WORM — only anchor_id may change
   ```

### D. Show tampering detection (1 phút)
10. Bypass trigger → UPDATE action → re-enable trigger
11. Refresh `/audit/1/verify` → Section 1 hiện ✗ đỏ ngay
12. Hash `recomputed_hash` ≠ `record_hash` → highlight đỏ

### E. Show on-chain anchor (1 phút)
13. Click "Anchor ngay" → đợi 15-30s → toast hiện tx hash
14. Click tx → mở Sepolia Etherscan → event `AnchorStored` với `merkleRoot`, `fromSeq`, `toSeq`
15. Verify page log đã anchor → Section 2 ✓ "Khớp on-chain"

→ Slide kết: *"Hệ thống không tin admin DB, không tin một cloud provider, không tin chính nó. Mỗi audit log được khoá bằng hash chain (chống sửa lẻ tẻ), và mỗi giờ Merkle root được khắc lên Ethereum public chain (chống rewrite toàn bộ). Bất kỳ ai có thể độc lập verify."*

---

## 12. Hướng phát triển

### Đã hoàn thành ngoài scope đề tài gốc
- ✅ **Audit service riêng** + WORM hash chain + Postgres trigger
- ✅ **Smart contract `AgriTraceAnchor`** deploy Sepolia
- ✅ **Anchor Worker** cron + Merkle tree + idempotent retry
- ✅ **Verify endpoint 3 lớp** + Admin UI cryptographic proof
- ✅ **WebSocket notifications** real-time

### Roadmap tiếp theo
- [ ] **Public verify page** — không cần đăng nhập, ai cũng verify audit log nào (hiện chỉ admin).
- [ ] **VietGAP / GlobalGAP checklist template** — farmer ghi nhật ký theo template, inspector đánh giá từng mục.
- [ ] **Mobile app** (React Native) cho farmer ghi nhật ký ngoài đồng + ký số trên điện thoại.
- [ ] **IoT sensor integration** — nhiệt độ, độ ẩm kho lạnh tự động ghi audit log.
- [ ] **Message broker (RabbitMQ / Kafka)** — thay 1 phần gRPC đồng bộ bằng event-driven; fan-out audit đến nhiều consumer.
- [ ] **Kubernetes deployment** + CI/CD pipeline.
- [ ] **OpenAPI / Swagger** docs tại `/api/docs`.
- [ ] **Multi-chain anchoring** — anchor song song Sepolia + Polygon Amoy + Arbitrum để tăng resilience.
- [ ] **Layer-2 production** — chuyển sang Polygon mainnet hoặc Arbitrum để tx phí thấp + finality nhanh.

---

<div align="center">

**AgriTrace** — *Trồng sạch, bán minh bạch, ăn an tâm — và bất biến trên blockchain.*

</div>
</content>
