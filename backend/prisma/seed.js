import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create test users
  const hashedPassword1 = await bcrypt.hash('password123', 10);
  const hashedPassword2 = await bcrypt.hash('password456', 10);
  const hashedPassword3 = await bcrypt.hash('password789', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      password: hashedPassword1,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      password: hashedPassword2,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      password: hashedPassword3,
    },
  });

  console.log('✅ Created test users:', {
    user1: user1.email,
    user2: user2.email,
    user3: user3.email,
  });

  // Create test projects
  const project1 = await prisma.project.create({
    data: {
      name: 'react-todo-app',
      fileTree: {
        'src/': {
          'components/': {
            'TodoList.jsx': 'import React from "react";\n\nexport default function TodoList() {\n  return <div>Todo List</div>;\n}',
            'TodoItem.jsx': 'import React from "react";\n\nexport default function TodoItem() {\n  return <div>Todo Item</div>;\n}'
          },
          'App.jsx': 'import React from "react";\nimport TodoList from "./components/TodoList";\n\nfunction App() {\n  return (\n    <div className="App">\n      <TodoList />\n    </div>\n  );\n}\n\nexport default App;',
          'index.js': 'import React from "react";\nimport ReactDOM from "react-dom";\nimport App from "./App";\n\nReactDOM.render(<App />, document.getElementById("root"));'
        },
        'package.json': '{\n  "name": "react-todo-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.0.0",\n    "react-dom": "^18.0.0"\n  }\n}',
        'README.md': '# React Todo App\n\nA simple todo application built with React.'
      }
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'node-api-server',
      fileTree: {
        'src/': {
          'routes/': {
            'users.js': 'const express = require("express");\nconst router = express.Router();\n\nrouter.get("/", (req, res) => {\n  res.json({ message: "Get all users" });\n});\n\nmodule.exports = router;'
          },
          'models/': {
            'User.js': 'const mongoose = require("mongoose");\n\nconst userSchema = new mongoose.Schema({\n  name: String,\n  email: String\n});\n\nmodule.exports = mongoose.model("User", userSchema);'
          },
          'app.js': 'const express = require("express");\nconst app = express();\n\napp.use("/api/users", require("./routes/users"));\n\nmodule.exports = app;'
        },
        'package.json': '{\n  "name": "node-api-server",\n  "version": "1.0.0",\n  "dependencies": {\n    "express": "^4.18.0",\n    "mongoose": "^6.0.0"\n  }\n}',
        'README.md': '# Node API Server\n\nA RESTful API server built with Node.js and Express.'
      }
    },
  });

  console.log('✅ Created test projects:', {
    project1: project1.name,
    project2: project2.name,
  });

  // Add users to projects
  await prisma.projectUser.create({
    data: {
      userId: user1.id,
      projectId: project1.id,
    },
  });

  await prisma.projectUser.create({
    data: {
      userId: user2.id,
      projectId: project1.id,
    },
  });

  await prisma.projectUser.create({
    data: {
      userId: user1.id,
      projectId: project2.id,
    },
  });

  await prisma.projectUser.create({
    data: {
      userId: user3.id,
      projectId: project2.id,
    },
  });

  console.log('✅ Added users to projects');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Test Data Summary:');
  console.log('Users:');
  console.log('  - john@example.com (password: password123)');
  console.log('  - jane@example.com (password: password456)');
  console.log('  - bob@example.com (password: password789)');
  console.log('\nProjects:');
  console.log('  - react-todo-app (users: john, jane)');
  console.log('  - node-api-server (users: john, bob)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





