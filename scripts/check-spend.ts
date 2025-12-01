
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load env vars manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf8");
    envConfig.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpend() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const { count, error } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("role", "assistant")
        .gte("timestamp", todayIso);

    if (error) {
        console.error("Error fetching messages:", error);
        return;
    }

    const messageCount = count || 0;
    // Estimate: $0.02 per message (average)
    const estimatedCost = messageCount * 0.02;

    console.log(`Assistant messages today: ${messageCount}`);
    console.log(`Estimated spend: $${estimatedCost.toFixed(2)}`);
}

checkSpend();
