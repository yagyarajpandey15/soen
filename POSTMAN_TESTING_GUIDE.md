# 🚀 Postman API Testing Guide

## 📋 Prerequisites
1. **Start the Backend Server**: Run `npm start` in the backend directory (should be running on `http://localhost:3000`)
2. **Database**: Ensure PostgreSQL database is connected and seeded with test data
3. **Postman**: Download and install Postman from [postman.com](https://www.postman.com/)

## 🔐 Test Data (Seeded Users)
- **john@example.com** / password: `password123`
- **jane@example.com** / password: `password456`  
- **bob@example.com** / password: `password789`

---

## 📝 API Endpoints Testing

### 1. 👤 **User Registration**
**POST** `http://localhost:3000/api/users/register`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "newuser@example.com",
  "password": "newpassword123"
}
```

**Expected Response (201):**
```json
{
  "user": {
    "id": "user_id_here",
    "email": "newuser@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

---

### 2. 🔑 **User Login**
**POST** `http://localhost:3000/api/users/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response (200):**
```json
{
  "user": {
    "id": "user_id_here",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

**⚠️ Important:** Copy the `token` from the response - you'll need it for authenticated requests!

---

### 3. 👥 **Get All Users** (Authenticated)
**GET** `http://localhost:3000/api/users/all-users`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Expected Response (200):**
```json
{
  "users": [
    {
      "id": "user_id_1",
      "email": "jane@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "user_id_2", 
      "email": "bob@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 4. 👤 **Get User Profile** (Authenticated)
**GET** `http://localhost:3000/api/users/profile`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Expected Response (200):**
```json
{
  "user": {
    "email": "john@example.com",
    "id": "user_id_here"
  }
}
```

---

### 5. 📁 **Create Project** (Authenticated)
**POST** `http://localhost:3000/api/projects/create`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Body (raw JSON):**
```json
{
  "name": "my-new-project"
}
```

**Expected Response (201):**
```json
{
  "id": "project_id_here",
  "name": "my-new-project",
  "fileTree": {},
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "users": [
    {
      "id": "project_user_id",
      "userId": "user_id",
      "projectId": "project_id",
      "user": {
        "id": "user_id",
        "email": "john@example.com"
      }
    }
  ]
}
```

---

### 6. 📂 **Get All Projects** (Authenticated)
**GET** `http://localhost:3000/api/projects/all`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Expected Response (200):**
```json
{
  "projects": [
    {
      "id": "project_id_1",
      "name": "react-todo-app",
      "fileTree": { /* file structure */ },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "users": [
        {
          "user": {
            "id": "user_id",
            "email": "john@example.com"
          }
        }
      ]
    }
  ]
}
```

---

### 7. 🔍 **Get Project by ID** (Authenticated)
**GET** `http://localhost:3000/api/projects/get-project/PROJECT_ID_HERE`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Expected Response (200):**
```json
{
  "project": {
    "id": "project_id_here",
    "name": "react-todo-app",
    "fileTree": {
      "src/": {
        "components/": {
          "TodoList.jsx": "import React from 'react';\n\nexport default function TodoList() {\n  return <div>Todo List</div>;\n}"
        }
      }
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "users": [
      {
        "user": {
          "id": "user_id",
          "email": "john@example.com"
        }
      }
    ]
  }
}
```

---

### 8. 👥 **Add Users to Project** (Authenticated)
**PUT** `http://localhost:3000/api/projects/add-user`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Body (raw JSON):**
```json
{
  "projectId": "PROJECT_ID_HERE",
  "users": ["USER_ID_1", "USER_ID_2"]
}
```

**Expected Response (200):**
```json
{
  "project": {
    "id": "project_id_here",
    "name": "project_name",
    "users": [
      /* updated users list */
    ]
  }
}
```

---

### 9. 🌳 **Update File Tree** (Authenticated)
**PUT** `http://localhost:3000/api/projects/update-file-tree`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Body (raw JSON):**
```json
{
  "projectId": "PROJECT_ID_HERE",
  "fileTree": {
    "src/": {
      "components/": {
        "NewComponent.jsx": "import React from 'react';\n\nexport default function NewComponent() {\n  return <div>New Component</div>;\n}"
      },
      "App.jsx": "import React from 'react';\n\nfunction App() {\n  return <div>Updated App</div>;\n}\n\nexport default App;"
    },
    "package.json": "{\n  \"name\": \"updated-project\",\n  \"version\": \"1.0.0\"\n}"
  }
}
```

**Expected Response (200):**
```json
{
  "project": {
    "id": "project_id_here",
    "name": "project_name",
    "fileTree": {
      /* updated file tree */
    },
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 10. 🚪 **Logout** (Authenticated)
**POST** `http://localhost:3000/api/users/logout`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Expected Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## 🔧 **Testing Tips**

### 1. **Environment Variables**
Create a Postman environment with:
- `base_url`: `http://localhost:3000`
- `auth_token`: (set this after login)

### 2. **Authentication Flow**
1. First, register a new user OR login with existing credentials
2. Copy the JWT token from the response
3. Use this token in the `Authorization` header for all protected routes
4. Format: `Bearer YOUR_JWT_TOKEN_HERE`

### 3. **Common Error Responses**
- **401 Unauthorized**: Missing or invalid JWT token
- **400 Bad Request**: Invalid request body or missing required fields
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error (check backend logs)

### 4. **Testing Workflow**
1. **Register/Login** → Get JWT token
2. **Create Project** → Get project ID
3. **Get All Projects** → Verify project creation
4. **Add Users to Project** → Test collaboration features
5. **Update File Tree** → Test file management
6. **Get Project by ID** → Verify updates

---

## 🎯 **Quick Test Sequence**

1. **Login**: `POST /api/users/login` with `john@example.com`
2. **Get Profile**: `GET /api/users/profile` 
3. **Get Projects**: `GET /api/projects/all`
4. **Create Project**: `POST /api/projects/create` with name "test-project"
5. **Update File Tree**: `PUT /api/projects/update-file-tree` with new files
6. **Get Users**: `GET /api/users/all-users`
7. **Add User to Project**: `PUT /api/projects/add-user`

---

## 🐛 **Troubleshooting**

- **Connection Refused**: Make sure backend server is running on port 3000
- **Database Errors**: Ensure PostgreSQL is connected and migrations are run
- **Token Errors**: Make sure to include `Bearer ` prefix in Authorization header
- **CORS Errors**: Backend should have CORS enabled for frontend requests

---

**🎉 Happy Testing!** 

Your backend API is now ready for testing with Postman. The seeded data provides realistic test scenarios for user authentication, project management, and collaboration features.
