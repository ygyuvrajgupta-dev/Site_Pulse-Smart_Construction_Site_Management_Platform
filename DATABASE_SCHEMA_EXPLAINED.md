# Site Pulse — Database Schema Explained
**Prisma ORM + PostgreSQL | Multi-tenant SaaS**

---

## Table of Contents
1. [Enum Reference](#enum-reference)
2. [Platform Owner](#platform-owner)
3. [Company](#company)
4. [Company Admin](#company-admin)
5. [Role & Permission System](#role--permission-system)
6. [User](#user)
7. [Department](#department)
8. [Employee](#employee)
9. [Lead](#lead)
10. [Client](#client)
11. [Project](#project)
12. [Site](#site)
13. [Task & TaskComment](#task--taskcomment)
14. [Inventory Item](#inventory-item)
15. [Manufacturing Order](#manufacturing-order)
16. [Transaction](#transaction)
17. [Document](#document)
18. [Notification](#notification)
19. [Plan & Subscription](#plan--subscription)
20. [Activity Log](#activity-log)
21. [Company Setting](#company-setting)
22. [AI Feature & AI Usage Log](#ai-feature--ai-usage-log)
23. [Relationship Map](#relationship-map)
24. [Production Considerations](#production-considerations)

---

## Enum Reference

| Enum | Purpose | Key Values |
|------|---------|------------|
| `UserStatus` | Account lifecycle | ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION |
| `LeadStatus` | Sales pipeline stages | NEW → CONTACTED → QUALIFIED → PROPOSAL → NEGOTIATION → WON/LOST/DISQUALIFIED |
| `LeadSource` | Lead origin tracking | WEBSITE, REFERRAL, SOCIAL_MEDIA, EMAIL_CAMPAIGN, COLD_CALL, PARTNER, OTHER |
| `ProjectStatus` | Project lifecycle | PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED |
| `TaskStatus` | Task workflow | TODO, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED |
| `TaskPriority` | Priority levels | LOWEST, LOW, MEDIUM, HIGH, HIGHEST, URGENT |
| `SiteStatus` | Monitoring status | ACTIVE, INACTIVE, MAINTENANCE, ARCHIVED |
| `InventoryType` | Inventory categories | RAW_MATERIAL, WORK_IN_PROGRESS, FINISHED_GOODS, SUPPLIES, EQUIPMENT |
| `ManufacturingOrderStatus` | Production status | DRAFT, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD |
| `TransactionType` | Financial type | INCOME, EXPENSE, TRANSFER, REFUND |
| `TransactionStatus` | Reconciliation state | PENDING, CLEARED, RECONCILED, DISPUTED, CANCELLED |
| `DocumentCategory` | Document taxonomy | CONTRACT, INVOICE, REPORT, PROPOSAL, LEGAL, HR, FINANCIAL, TECHNICAL, OTHER |
| `NotificationType` | Severity/kind | INFO, WARNING, ERROR, SUCCESS, ALERT |
| `NotificationChannel` | Delivery channel | IN_APP, EMAIL, BOTH |
| `SubscriptionStatus` | Billing state | ACTIVE, PAST_DUE, CANCELED, EXPIRED, TRIALING, INCOMPLETE |
| `BillingInterval` | Plan cadence | MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL |
| `ActivityAction` | Audit actions | CREATED, UPDATED, DELETED, VIEWED, LOGGED_IN, LOGGED_OUT, EXPORTED, IMPORTED, STATUS_CHANGED, ASSIGNED, COMMENTED |
| `AiModelProvider` | AI vendor | OPENAI, ANTHROPIC, GOOGLE, MISTRAL, CUSTOM |
| `AiFeatureStatus` | Feature toggle | ACTIVE, DISABLED, LIMITED |

---

## Model Explanations

### 1. PlatformOwner
**Purpose:** Super-admin account with global access. Owns and manages the entire platform, all companies, billing, and system-wide settings.

**Key Fields:**
- `email` — Global unique login
- `password` — Hashed credential
- `name` — Display name
- `isActive` — Soft delete / account control
- `lastLoginAt` — Audit

**Relations:**
- `activityLogs` — All platform-level actions

**Production Notes:**
- Store only 1-3 platform owners
- Use bcrypt/argon2 for password hashing
- Implement MFA for high-privilege accounts

---

### 2. Company
**Purpose:** The **tenant boundary**. Each company represents a separate customer organization with complete data isolation.

**Key Fields:**
- `slug` — URL-safe unique identifier (e.g., "acme-corp")
- `name` — Legal business name
- `email/phone` — Contact info
- `address/city/state/country/postalCode` — Full address for invoicing
- `taxId/registrationNo` — Tax compliance
- `logo` — Branding asset path
- `isActive` — Suspension flag
- `metadata` — Flexible JSON for custom fields

**Relations:**
- Has many: `users`, `departments`, `employees`, `leads`, `clients`, `projects`, `sites`, `inventoryItems`, `manufacturingOrders`, `transactions`, `documents`, `subscriptions`, `activityLogs`, `settings`, `aiFeatures`, `aiUsageLogs`, `notifications`, `roles`, `companyAdmins`, `tasks`

**Production Notes:**
- Every data query MUST filter by `companyId`
- Add database-level Row Level Security (RLS) policies
- Index `slug` for fast tenant resolution

---

### 3. CompanyAdmin
**Purpose:** Many-to-many join between users and companies with an ownership flag. Enables users to manage multiple companies.

**Key Fields:**
- `userId` — Reference to user
- `companyId` — Reference to company
- `isOwner` — True if this user owns the company (can delete it)

**Relations:**
- Belongs to: `user`, `company`

**Production Notes:**
- Composite unique constraint `[userId, companyId]`
- Owners bypass certain permission checks

---

### 4. Role & Permission System (RBAC)

#### Model: Role
**Purpose:** Named role template within a company (e.g., "Admin", "Manager", "Viewer").

**Key Fields:**
- `companyId` — Tenant scoping
- `name` — Human-readable ("Admin")
- `slug` — Machine-friendly ("admin")
- `isSystem` — Built-in roles that cannot be deleted

**Relations:**
- Belongs to: `company`
- Has many: `rolePermissions`, `users`

#### Model: Permission
**Purpose:** Atomic action definitions. Global across all companies.

**Key Fields:**
- `name` — Human-readable ("Create Project")
- `slug` — Code-friendly ("project:create")
- `module` — Feature area ("projects", "leads", "finance")

**Relations:**
- Has many: `rolePermissions`

#### Model: RolePermission
**Purpose:** Join table defining which permissions a role has.

**Relations:**
- Belongs to: `role`, `permission`
- Composite primary key `[roleId, permissionId]`

**Production Notes:**
- Seed system permissions on first run
- Cache permission checks in Redis for performance

---

### 5. User
**Purpose:** Authenticated person within a company. The identity backbone for all actions.

**Key Fields:**
- `companyId` — Tenant isolation
- `roleId` — Permission inheritance
- `email` — Global unique login
- `password` — Hashed credential
- `name` — Full name
- `phone` — Contact
- `status` — Account state machine
- `emailVerified` — Verification flag
- `lastLoginAt` — Audit
- `preferences` — JSON blob for UI settings

**Relations:**
- Belongs to: `company`, `role`, `employee`, `headedDepartment`
- Has many: `assignedTasks`, `createdTasks`, `assignedLeads`, `notifications`, `activityLogs` (as user), `createdActivityLogs` (as actor), `companyAdmins`, `documents`, `comments`, `subscriptions`

**Production Notes:**
- Email uniqueness scoped to platform, not just company
- Password hashing: bcrypt (cost 12) or argon2id
- Implement rate limiting on login endpoints

---

### 6. Department
**Purpose:** Organizational unit for grouping employees.

**Key Fields:**
- `companyId` — Tenant scoping
- `name` — Department name
- `code` — Short code (e.g., "ENG")
- `headId` — Department head (unique per department)

**Relations:**
- Belongs to: `company`, `head` (User)
- Has many: `employees`

**Production Notes:**
- `headId` must be unique per department
- Consider circular reference validation if users can report to departments

---

### 7. Employee
**Purpose:** Employment record with HR-specific fields. Extends User with job details.

**Key Fields:**
- `userId` — One-to-one with User
- `companyId` — Tenant scoping
- `departmentId` — Grouping
- `employeeCode` — Internal ID (e.g., "EMP-001")
- `jobTitle` — Position
- `employmentType` — full-time, part-time, contract, intern
- `hireDate` — Start date
- `terminationDate` — End date (null = active)
- `salary` — Compensation
- `currency` — Salary currency
- `reportingToId` — Manager (self-referential)

**Relations:**
- Belongs to: `user`, `company`, `department`, `manager`
- Has many: `directReports`

**Production Notes:**
- Self-referencing `manager` creates org chart
- Salary field should be encrypted at rest in sensitive deployments
- Termination date implies soft-delete

---

### 8. Lead
**Purpose:** Sales opportunity in the pipeline. Core CRM entity.

**Key Fields:**
- `companyId` — Tenant scoping
- `assignedToId` — Sales rep
- `convertedToClientId` — Link to Client after conversion
- `firstName/lastName` — Contact name
- `companyName` — Lead's organization
- `source` — Acquisition channel
- `status` — Pipeline stage
- `score` — AI/UX lead score
- `budget` — Potential value
- `customFields` — Extensible data
- `lastContactedAt` — Follow-up tracking

**Relations:**
- Belongs to: `company`, `assignedTo`
- Has many: `clients`, `documents`

**Production Notes:**
- Score can be calculated by AI module
- `convertedToClientId` ensures traceability from lead to client
- Indexed by `status` for pipeline views

---

### 9. Client
**Purpose:** Converted customer. Active account with projects and sites.

**Key Fields:**
- `companyId` — Tenant scoping
- `leadId` — Back-reference to originating lead
- `name` — Business name
- `email/phone/website` — Contact
- `address/city/state/country/postalCode` — Billing/shipping
- `taxId` — Invoice compliance
- `isActive` — Account status

**Relations:**
- Belongs to: `company`, `lead`
- Has many: `projects`, `sites`, `documents`

**Production Notes:**
- `leadId` is nullable for direct client creation
- Can have multiple projects and sites per client

---

### 10. Project
**Purpose:** Container for client work. Groups sites and tasks.

**Key Fields:**
- `companyId` — Tenant scoping
- `clientId` — Optional client link
- `name/code` — Identification
- `status` — Lifecycle
- `priority` — Business priority
- `startDate/endDate` — Timeline
- `budget/actualCost/currency` — Financials
- `progress` — Percentage complete
- `customFields` — Extensible data

**Relations:**
- Belongs to: `company`, `client`
- Has many: `sites`, `tasks`

**Production Notes:**
- `actualCost` defaults to 0 and should be updated by transactions
- Progress auto-calculated from task completion recommended

---

### 11. Site
**Purpose:** Monitored endpoint or physical location. **Core entity for Site Pulse.**

**Key Fields:**
- `companyId` — Tenant scoping
- `clientId` — Optional client
- `projectId` — Optional project
- `name/code` — Identification
- `url` — Website URL being monitored
- `type` — e.g., "ecommerce", "saas"
- `status` — Monitoring state
- `address/city/state/country` — Physical location
- `latitude/longitude` — Geo data
- `settings` — JSON for monitoring config (frequency, alerts, etc.)

**Relations:**
- Belongs to: `company`, `client`, `project`

**Production Notes:**
- `settings` JSON stores monitor-specific configuration
- Consider separate `SiteCheck` table for uptime logs
- Geo fields enable mapping views

---

### 12. Task & TaskComment

#### Model: Task
**Purpose:** Work item within a project. Supports subtasks.

**Key Fields:**
- `companyId` — Tenant scoping
- `projectId` — Parent project
- `parentId` — For subtasks (self-referential)
- `creatorId` — Who created
- `title/description` — Content
- `status` — Workflow state
- `priority` — Urgency
- `assigneeId` — Who's responsible
- `dueDate` — Deadline
- `estimatedHours/actualHours` — Time tracking
- `sortOrder` — Manual ordering

**Relations:**
- Belongs to: `company`, `project`, `parent`, `assignee`, `creator`
- Has many: `subtasks`, `comments`

#### Model: TaskComment
**Purpose:** Collaboration thread on tasks.

**Relations:**
- Belongs to: `task`, `user`

**Production Notes:**
- Index `taskId` for fast comment retrieval
- Consider `parentId` for threaded replies

---

### 13. InventoryItem
**Purpose:** Tracks stock for manufacturing/warehouse.

**Key Fields:**
- `companyId` — Tenant scoping
- `name/sku` — Identification
- `type` — RAW_MATERIAL, WORK_IN_PROGRESS, FINISHED_GOODS, SUPPLIES, EQUIPMENT
- `quantity` — Current stock
- `unit` — pcs, kg, liters
- `unitPrice` — Per-unit cost
- `reorderPoint` — Low-stock threshold
- `location/supplier` — Logistics

**Relations:**
- Belongs to: `company`

**Production Notes:**
- Consider `InventoryMovement` table for audit trail
- `reorderPoint` triggers low-stock alerts

---

### 14. ManufacturingOrder
**Purpose:** Production run tracking.

**Key Fields:**
- `companyId` — Tenant scoping
- `orderNo` — Unique production order number
- `productName` — What's being made
- `quantity/producedQuantity` — Target vs actual
- `status` — Production state
- `startDate/endDate/dueDate` — Timeline

**Relations:**
- Belongs to: `company`

**Production Notes:**
- `producedQuantity` tracks yield
- Can link to `InventoryItem` for raw material consumption

---

### 15. Transaction
**Purpose:** Financial record for income/expense tracking.

**Key Fields:**
- `companyId` — Tenant scoping
- `type` — INCOME, EXPENSE, TRANSFER, REFUND
- `status` — Reconciliation state
- `amount/currency` — Value
- `category` — e.g., "Salaries", "Rent"
- `referenceNo` — External invoice/receipt
- `transactionDate/paidAt` — Dates

**Relations:**
- Belongs to: `company`

**Production Notes:**
- Indexed by `transactionDate` for reporting
- `referenceNo` enables bank reconciliation

---

### 16. Document
**Purpose:** Unified file management across all entities.

**Key Fields:**
- `companyId` — Tenant scoping
- `uploaderId` — Who uploaded
- `leadId/clientId` — Optional entity link
- `category` — Document taxonomy
- `name/fileName/fileSize/mimeType` — File metadata
- `url` — Cloud storage path (S3, GCS, etc.)
- `tags` — Array for search/filtering
- `isArchived` — Soft delete

**Relations:**
- Belongs to: `company`, `uploader`, `lead`, `client`

**Production Notes:**
- Store files in S3 or compatible object storage
- `tags` enables full-text search via Postgres `GIN` index
- Consider virus scanning on upload

---

### 17. Notification
**Purpose:** In-app and email notifications.

**Key Fields:**
- `companyId` — Tenant scoping
- `userId` — Recipient
- `type` — INFO, WARNING, ERROR, SUCCESS, ALERT
- `channel` — IN_APP, EMAIL, BOTH
- `title/message` — Content
- `link` — Deep link to resource
- `isRead/readAt` — Read state

**Relations:**
- Belongs to: `company`, `user`

**Production Notes:**
- Index `[userId, isRead]` for unread queries
- Background job for email channel delivery
- Consider `NotificationTemplate` table for templated messages

---

### 18. Plan & Subscription

#### Model: Plan
**Purpose:** Subscription plan definition (Starter, Pro, Enterprise).

**Key Fields:**
- `name/slug` — Unique identifiers
- `price/currency/interval` — Pricing
- `trialDays` — Free trial period
- `features` — JSON feature flags and limits
- `sortOrder` — Display ordering

**Relations:**
- Has many: `subscriptions`

#### Model: Subscription
**Purpose:** Active or past subscription for a company.

**Key Fields:**
- `companyId/planId/userId` — Links
- `status` — TRIALING, ACTIVE, PAST_DUE, CANCELED, etc.
- `startDate/endDate/trialEndsAt/canceledAt` — Timeline
- `autoRenew` — Auto-charge flag
- `stripeSubscriptionId/stripeCustomerId` — Payment provider refs

**Relations:**
- Belongs to: `company`, `plan`, `user`

**Production Notes:**
- Sync with Stripe webhooks
- `metadata` stores invoice metadata

---

### 19. ActivityLog
**Purpose:** Immutable audit trail for compliance and debugging.

**Key Fields:**
- `companyId` — Tenant scoping
- `userId` — Who performed (nullable)
- `creatorId` — Who triggered the event (nullable)
- `platformOwnerId` — Platform action (nullable)
- `action` — CREATED, UPDATED, DELETED, VIEWED, etc.
- `entity/entityId` — What was affected (e.g., "Lead", "abc123")
- `metadata` — Previous/new values snapshot
- `ipAddress/userAgent` — Request context

**Relations:**
- Belongs to: `company`, `user` (as ActivityUser), `creator` (as ActivityCreator), `platformOwner`

**Production Notes:**
- Immutable once written (no updates/deletes allowed)
- Partition by `createdAt` for retention policies
- Consider `TimescaleDB` hypertable for high-volume logging

---

### 20. CompanySetting
**Purpose:** Key-value store for company configuration.

**Key Fields:**
- `companyId` — Tenant scoping
- `key/value` — Setting pair

**Relations:**
- Belongs to: `company`

**Production Notes:**
- Unique constraint `[companyId, key]`
- Cache commonly accessed settings

---

### 21. AiFeature & AiUsageLog

#### Model: AiFeature
**Purpose:** AI configuration per company (which models, limits, keys).

**Key Fields:**
- `companyId` — Tenant scoping
- `name` — Feature name ("lead-scoring", "chat-assistant")
- `provider` — OPENAI, ANTHROPIC, etc.
- `modelName` — e.g., "gpt-4"
- `apiKey` — Encrypted API key
- `status` — ACTIVE, DISABLED, LIMITED
- `monthlyLimit/usedThisMonth` — Quota tracking

**Relations:**
- Belongs to: `company`
- Has many: `usageLogs`

#### Model: AiUsageLog
**Purpose:** Record of AI API calls for billing/monitoring.

**Key Fields:**
- `companyId/featureId/userId` — Links
- `modelName` — Which model
- `tokensIn/tokensOut` — Token usage
- `duration` — Latency
- `cost` — Cost in company currency

**Relations:**
- Belongs to: `company`, `feature`

**Production Notes:**
- Use for quota enforcement and billing
- Consider TTL/partitioning for retention

---

## Relationship Map

```
PlatformOwner
  └── ActivityLog

Company
  ├── User
  │   ├── Employee
  │   ├── Department (head)
  │   ├── Task (assignee, creator)
  │   ├── Lead (assigned)
  │   ├── Notification
  │   ├── ActivityLog (user, creator)
  │   ├── Document
  │   ├── CompanyAdmin
  │   ├── Comment
  │   └── Subscription
  ├── Department
  │   ├── Employee
  ├── Employee (manager hierarchy)
  ├── Lead
  │   ├── Client (converted)
  │   ├── Document
  │   └── ActivityLog
  ├── Client
  │   ├── Project
  │   │   ├── Site
  │   │   └── Task
  │   │       └── TaskComment
  │   ├── Site
  │   └── Document
  ├── Project
  │   ├── Site
  │   └── Task
  ├── Site
  ├── Task
  │   ├── TaskComment
  │   └── Task (subtasks)
  ├── InventoryItem
  ├── ManufacturingOrder
  ├── Transaction
  ├── Document
  ├── Subscription
  │   ├── Plan
  ├── ActivityLog
  ├── CompanySetting
  ├── AiFeature
  │   └── AiUsageLog
  ├── Notification
  ├── Role
  │   ├── Permission (via RolePermission)
  └── CompanyAdmin
```

---

## Production Considerations

1. **Multi-tenancy**
   - Always filter by `companyId`
   - Add database RLS policies where possible
   - Use connection pooling (PgBouncer)

2. **Indexing Strategy**
   - `companyId` indexed on all tenant-scoped tables
   - Composite indexes for common queries (e.g., `[userId, isRead]` on notifications)
   - `createdAt` descending for activity logs

3. **Data Integrity**
   - Use `onDelete: Cascade` for dependent data
   - `onDelete: SetNull` for optional references
   - Prevent hard deletes via application logic

4. **Scaling**
   - Partition `ActivityLog` and `AiUsageLog` by `createdAt`
   - Archive old `Subscription` and `Transaction` data
   - Consider read replicas for reporting

5. **Security**
   - Hash all passwords with Argon2id
   - Encrypt sensitive fields (`apiKey`, `salary`) at rest
   - Audit mutable records with `ActivityLog`

6. **Soft Deletes**
   - Use `isActive` flags instead of hard deletes
   - Archive pattern for documents and logs

7. **JSON Fields**
   - `metadata`, `preferences`, `settings`, `customFields` use Postgres `JSONB`
   - Add GIN indexes if full-text search is needed

---

*Generated for Site Pulse Multi-tenant SaaS Architecture*