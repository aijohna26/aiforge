# Studio Chatbox Testing Guide

## ✅ Implementation Complete!

The Studio chatbox is now **fully functional** and connected to the StudioAgent with the new `generateImage` tool. You can now test both features together!

---

## 🎯 What the Chatbox Can Do Now

The chatbox interprets natural language prompts and automatically generates appropriate mobile screens. It can now:

✅ **Generate Any Screen Type** from text prompts
✅ **Use AI Tools** including the new `generateImage` tool for custom imagery
✅ **Add Screens to Canvas** automatically after generation
✅ **Maintain Brand Consistency** using your wizard settings

---

## 🧪 How to Test

### Step 1: Complete the Design Wizard

1. Start at http://localhost:5173
2. Go through all wizard steps (1-4):
   - Step 1: App basics (name, description, etc.)
   - Step 2: UI style & personality
   - Step 3: Colors & logo
   - Step 4: Navigation
3. Click **"Initialize Studio"** on Step 5

### Step 2: Open the Chatbox

Once in the Studio canvas:
1. Look for the **sparkle icon** button (✨) in the top toolbar
2. Click it to open the AI Design Engine chatbox
3. You'll see a textarea with placeholder: *"Ask me to design a new screen or style..."*

### Step 3: Test with These Prompts

Try these prompts to test different features:

#### 🎨 Test 1: Simple Screen (No Image Generation)
**Prompt:** `create a login screen`

**Expected:**
- Generates a login screen with email/password inputs
- Adds it to the canvas automatically
- No custom images (uses stock or gradients)

---

#### 🖼️ Test 2: Trigger Image Generation
**Prompt:** `create a splash screen with motivational hero imagery`

**Expected:**
- Generates splash screen layout
- **Calls `generateImage` tool** for custom hero background
- Takes ~30-60 seconds (image generation via Kie API)
- Shows loading toast: "🎨 AI is designing your screen..."
- Final result includes custom generated Supabase image URL

**Watch Console for:**
```
[StudioAgent] Generating custom image: { description: "...", imageType: "hero" }
[Inngest] Starting image generation:
[Inngest] Kie task created: {taskId}
[Inngest] Image generation succeeded:
[Canvas Chat] Generation successful: Splash Screen
```

---

#### 🎭 Test 3: Empty State with Illustration
**Prompt:** `make an empty state screen with a friendly illustration`

**Expected:**
- Generates empty state layout
- **Calls `generateImage` tool** for custom illustration
- Shows encouraging message
- Call-to-action button

---

#### 📱 Test 4: Onboarding with Visuals
**Prompt:** `create an onboarding screen showing fitness goals with custom illustration`

**Expected:**
- Generates onboarding layout
- **Calls `generateImage` tool** for branded fitness illustration
- Progress indicators
- Next/Skip buttons

---

#### 🏠 Test 5: Home Screen (No Custom Images)
**Prompt:** `create a home screen with search bar and category cards`

**Expected:**
- Generates home/dashboard layout
- Uses `searchImages` tool for stock photos (faster/cheaper)
- **Does NOT** use `generateImage` (generic content doesn't need custom imagery)

---

## 🔍 Monitoring & Debugging

### Browser Console
Open DevTools (F12) and watch for:

**Chatbox Submission:**
```
[Canvas Chat] Submitting prompt: create a splash screen...
```

**API Call:**
```
POST /api/studio/custom-prompt
```

**StudioAgent Tool Usage:**
```
[StudioAgent] Generating custom image: { description: "...", imageType: "hero", aspectRatio: "9:16" }
```

**Inngest Job:**
```
[Inngest] Starting image generation:
[Inngest] Kie task created: abc123
[Inngest] Poll attempt 1/10
...
[Inngest] Image generation succeeded: https://...
```

**Success:**
```
[Canvas Chat] Generation successful: Splash Screen
✨ Created: Splash Screen!
```

### Network Tab
Filter by "studio" or "inngest" to see:
- `POST /api/studio/custom-prompt` - Chatbox request
- `POST /api/inngest` - Image generation event
- `GET /api/jobs/{jobId}` - Polling for completion

### Server Logs
If running in terminal, watch for:
```bash
[Studio Custom Prompt] Request: { prompt: "...", appName: "..." }
[Studio Custom Prompt] Interpreted as: { type: "splash", name: "Splash Screen" }
[Studio Custom Prompt] Generation complete: Splash Screen
```

---

## 🎨 Testing Image Generation Specifically

### Prompts That WILL Trigger `generateImage`:

✅ `"splash screen with hero background"`
✅ `"onboarding with custom illustration"`
✅ `"empty state with friendly illustration"`
✅ `"create a feature card with branded imagery"`

### Prompts That WON'T Trigger It:

❌ `"login screen"` (too generic)
❌ `"settings page"` (no imagery needed)
❌ `"list of items"` (uses stock photos via `searchImages`)

---

## ⏱️ Expected Timing

| Action | Time |
|--------|------|
| Simple screen (no images) | ~5-10 seconds |
| Screen with stock photos | ~10-15 seconds |
| Screen with custom AI image | ~30-60 seconds |

**Why longer for custom images?**
- 10s: Create Kie API task
- 20-40s: Kie generates the image (polling)
- 5-10s: Download & upload to Supabase

---

## ✅ Success Criteria

You'll know it's working when:

1. ✅ Chatbox opens and closes smoothly
2. ✅ Prompt submission shows loading state
3. ✅ Toast notifications appear:
   - "🎨 AI is designing your screen..."
   - "✨ Created: [Screen Name]!"
4. ✅ New screen appears on canvas
5. ✅ Generated HTML contains images (inspect in DevTools)
6. ✅ For image generation prompts:
   - Supabase URL in the generated HTML
   - Image visible in Supabase Dashboard → Storage → images/generated/

---

## 🐛 Troubleshooting

### Issue: "Missing Google API Key"
**Fix:** Make sure `GOOGLE_GENERATIVE_AI_API_KEY` is in `.env.local`

### Issue: "Branding information is missing"
**Fix:** Complete all wizard steps before opening Studio

### Issue: Chatbox doesn't open
**Fix:** Make sure you clicked "Initialize Studio" first

### Issue: Image generation times out
**Check:**
- `KIE_API_KEY` is valid
- Kie API is accessible: https://api.kie.ai
- Check Inngest logs for errors

### Issue: Image not appearing
**Check:**
- `SUPABASE_SERVICE_ROLE_KEY` is set
- "images" bucket exists in Supabase
- Bucket is public or has proper RLS policies

### Issue: "Failed to generate screen"
**Debug:**
1. Open browser console
2. Check network tab for failed requests
3. Look at response body for error details
4. Check server logs

---

## 📊 Testing Checklist

- [ ] Chatbox opens when clicking sparkle icon
- [ ] Textarea accepts input
- [ ] Character counter updates (0/500)
- [ ] Button is disabled when empty
- [ ] Button shows loading state during generation
- [ ] Simple prompts work (login, settings)
- [ ] Image generation prompts trigger the tool
- [ ] New screens appear on canvas
- [ ] Screens are positioned correctly
- [ ] Error handling works (try invalid prompt)
- [ ] Success toasts appear
- [ ] Chatbox closes after success
- [ ] Prompt clears after generation

---

## 🎓 Example Test Session

```bash
# 1. Start dev server
pnpm run dev

# 2. Open browser to http://localhost:5173

# 3. Complete wizard with:
   - App Name: "FitTracker"
   - UI Style: "Modern & Energetic"
   - Colors: Purple gradient
   - Description: "Fitness tracking app"

# 4. Click "Initialize Studio"

# 5. Click sparkle icon to open chatbox

# 6. Type: "create a splash screen with motivational hero imagery"

# 7. Click "Initialize Generation"

# 8. Watch console logs for:
   - [Canvas Chat] Submitting prompt
   - [StudioAgent] Generating custom image
   - [Inngest] Image generation succeeded

# 9. Wait 30-60 seconds

# 10. Verify:
   - Toast: "✨ Created: Splash Screen!"
   - New frame on canvas
   - Image visible in the screen
   - Supabase URL in HTML (inspect element)

# 11. Check Supabase Dashboard:
   - Storage → images → generated/
   - Should see new .png file
```

---

## 🚀 Next Steps

Once the chatbox is working:

1. **Test More Prompts** - Try different screen types
2. **Test Edge Cases** - Very long prompts, special characters, etc.
3. **Performance** - Monitor generation times
4. **Cost** - Each AI-generated image costs $0.06
5. **Polish** - Add more prompt templates, better parsing logic

---

## 📝 Notes

- The chatbox uses **simple keyword matching** for screen type detection
- You can enhance `/api/studio/custom-prompt.ts` with LLM-based parsing for better accuracy
- Image generation is **automatic** - the LLM decides when to use it based on the system prompt
- All screens maintain **brand consistency** from your wizard settings

---

**Happy Testing!** 🎉

If you encounter any issues, check the console logs first - they're very detailed and will show exactly what's happening at each step.
