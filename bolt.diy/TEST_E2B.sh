
# -------------------------------------------------------------------------
# Test Script: E2B Integration
# -------------------------------------------------------------------------

# 1. Enable E2B
echo "Enabling E2B..."
# Using a temporary env file for the test or just exporting variables
export E2B_ON=true

# 2. Check dependencies
echo "Checking dependencies..."
if ! command -v pnpm &> /dev/null; then
    echo "pnpm could not be found"
    exit 1
fi

# 3. Trigger a simple test via the API (simulating the client)
# We can't easily run the full UI test from CLI, but we can hit the API if the dev server is running.
# Assuming the user manually starts the server or has it running.

echo "
To test manually:

1.  Build the custom template (requires Docker running):
    cd e2b-templates/expo
    e2b template build
    
    (Note the Template ID output)

2.  Update .env.local with your E2B API Key:
    E2B_ON=true
    E2B_API_KEY=...

3.  Configure the template ID:
    You can temporarily hardcode it in default_api:api.e2b.execute.ts or we can add a new env var E2B_TEMPLATE_ID.

4.  Start the app:
    pnpm run dev

5.  In the chat interface, ask the AI to 'create a simple file' or 'run a shell command'.
    - If successful, you should see the output in the terminal component.
    - Check your Inngest dashboard to see if the 'e2b/script.execute' event fired.

Current Status:
Docker not found or not running. Please start Docker Desktop to build the template.
"
