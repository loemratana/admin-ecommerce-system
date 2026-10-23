src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   ├── providers.tsx
│   └── config.ts
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Select.tsx
│   │   └── DataTable.tsx
│   │
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   │
│   └── common/
│       ├── Loading.tsx
│       ├── ErrorState.tsx
│       ├── EmptyState.tsx
│       └── Pagination.tsx
│
├── features/
│   ├── auth/
│   │   ├── api/
│   │   │   └── auth.api.ts
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   └── ForgotPasswordPage.tsx
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   └── store/
│   │       └── auth.store.ts
│   │
│   ├── users/
│   │   ├── api/
│   │   │   └── users.api.ts
│   │   ├── components/
│   │   │   ├── UserTable.tsx
│   │   │   ├── UserForm.tsx
│   │   │   └── UserDetail.tsx
│   │   ├── hooks/
│   │   │   └── useUsers.ts
│   │   ├── pages/
│   │   │   ├── UsersPage.tsx
│   │   │   ├── CreateUserPage.tsx
│   │   │   └── EditUserPage.tsx
│   │   ├── types/
│   │   │   └── user.types.ts
│   │   └── schemas/
│   │       └── user.schema.ts
│   │
│   ├── products/
│   │   ├── api/
│   │   │   └── products.api.ts
│   │   ├── components/
│   │   │   ├── ProductTable.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   └── ProductCard.tsx
│   │   ├── hooks/
│   │   │   └── useProducts.ts
│   │   ├── pages/
│   │   │   ├── ProductsPage.tsx
│   │   │   ├── ProductDetailPage.tsx
│   │   │   └── CreateProductPage.tsx
│   │   ├── types/
│   │   │   └── product.types.ts
│   │   └── schemas/
│   │       └── product.schema.ts
│   │
│   └── categories/
│       ├── api/
│       │   └── categories.api.ts
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── types/
│       └── schemas/
│
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── interceptors.ts
│   │   └── endpoints.ts
│   │
│   ├── auth/
│   │   ├── token.ts
│   │   └── permissions.ts
│   │
│   └── utils/
│       ├── cn.ts
│       ├── formatDate.ts
│       ├── formatCurrency.ts
│       └── error.ts
│
├── hooks/
│   ├── useDebounce.ts
│   ├── usePagination.ts
│   └── useMediaQuery.ts
│
├── types/
│   ├── api.types.ts
│   ├── pagination.types.ts
│   └── common.types.ts
│
├── constants/
│   ├── routes.ts
│   ├── roles.ts
│   └── permissions.ts
│
├── styles/
│   ├── globals.css
│   └── variables.css
│
└── main.tsx