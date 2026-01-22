# Contributing to Apex StudyOS

First off, thank you for considering contributing to Apex StudyOS! 🎉 It's people like you that make Apex StudyOS such a great tool.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

## 💡 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include screenshots if possible**
- **Include your environment details** (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Provide specific examples to demonstrate the feature**
- **Explain why this enhancement would be useful**

### Pull Requests

- Fill in the required template
- Follow the [Style Guidelines](#style-guidelines)
- Update documentation as needed
- Add tests if applicable

## 🛠️ Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR-USERNAME/Apex-StudyOS.git
   cd Apex-StudyOS
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up the database**

   ```bash
   npx prisma migrate dev
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔄 Pull Request Process

1. **Create a new branch** from `main`

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit them with clear, descriptive messages

   ```bash
   git commit -m "Add: Brief description of your changes"
   ```

3. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request** with a clear title and description

5. **Wait for review** - maintainers will review your PR and may request changes

6. **Update your PR** if changes are requested

7. **Merge** - once approved, your PR will be merged!

## 📝 Style Guidelines

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider using conventional commit prefixes:
  - `Add:` for new features
  - `Fix:` for bug fixes
  - `Update:` for updates to existing features
  - `Refactor:` for code refactoring
  - `Docs:` for documentation changes
  - `Style:` for formatting changes
  - `Test:` for test additions/changes

### TypeScript Style Guide

- Use TypeScript for all new code
- Use meaningful variable and function names
- Add type annotations where TypeScript can't infer types
- Avoid using `any` type
- Use interfaces for object shapes
- Use enums for fixed sets of values

### Code Formatting

- We use **Prettier** for code formatting
- Run `npm run format` before committing
- Use **ESLint** for code quality - run `npm run lint`
- Follow the existing code style in the project

### Component Guidelines

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper TypeScript types for props
- Add comments for complex logic

## 🧪 Testing

- Write tests for new features when applicable
- Ensure all tests pass before submitting a PR
- Update tests when modifying existing features

## 📚 Documentation

- Update the README.md if you change functionality
- Comment your code where necessary
- Update inline documentation for public APIs

## 🎯 Project Structure

```
Apex-StudyOS/
├── src/
│   ├── main/          # Electron main process
│   ├── preload/       # Electron preload scripts
│   └── renderer/      # React frontend
│       ├── components/
│       ├── pages/
│       ├── stores/    # Zustand state management
│       └── utils/
├── prisma/            # Database schema and migrations
├── resources/         # App resources (icons, etc.)
└── build/            # Build configuration
```

## ❓ Questions?

Feel free to open an issue with the "question" label if you have any questions about contributing!

---

Thank you for contributing to Apex StudyOS! 🚀
