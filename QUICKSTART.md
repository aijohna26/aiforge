# 🚀 Quick Start Guide - AppForge AI Code Editor

## Start Using the Code Editor in 3 Steps

### 1️⃣ Start Convex

```bash
npx convex dev
```

Wait for: `✓ Convex functions ready! http://127.0.0.1:3210`

---

### 2️⃣ Start Next.js

**New terminal:**
```bash
npm run dev
```

Wait for: `▲ Next.js ready on http://localhost:3000`

---

### 3️⃣ Open the Editor

Visit: **http://localhost:3000/appbuild/test**

---

## ✨ What You'll See

```
┌─────────────┬──────────────────┬─────────────┐
│  File Tree  │   Code Editor    │  AI Chat    │
│             │                  │             │
│ package.json│ import { ... }   │ Type here   │
│ App.tsx ✓   │ export default  │ to chat     │
│ app.json    │ function App()  │ with AI     │
│ README.md   │ { ... }         │             │
└─────────────┴──────────────────┴─────────────┘
```

---

## 🎯 Try These:

1. **Edit Code:**
   - Click `App.tsx` in file tree
   - Edit the code
   - Changes auto-save!

2. **Chat with AI:**
   - Type: "Add a button"
   - Get code suggestions
   - Copy to editor

3. **Navigate Files:**
   - Click files to view
   - Expand folders
   - See changes (green/red numbers)

---

## 🔑 Required Environment Variables

Make sure `.env.local` has:

```bash
# Convex (already set)
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
CONVEX_DEPLOYMENT=local:local-appforge-ai

# AI (add your keys)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 🐛 Troubleshooting

**"Cannot connect to Convex"**
- Check `npx convex dev` is running
- Check port 3210 is not in use

**"AI not responding"**
- Check your API keys in `.env.local`
- Check you have credits with OpenAI/Anthropic

**"Files not loading"**
- Refresh the page
- Check Convex dev logs
- Try a different project ID

---

## 📚 More Info

See full documentation in [`docs/`](docs/) folder:
- `CHEF-INTEGRATION-COMPLETE.md` - Full integration guide
- `PHASE-4-COMPLETE.md` - Convex & AI details
- `PHASE-2-3-COMPLETE.md` - Component details

---

## 🎉 That's It!

You now have a fully functional AI-powered code editor for Expo apps!

**Next:** Wire up the wizard to create projects automatically.
