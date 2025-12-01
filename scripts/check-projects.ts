
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

async function checkProjects() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayIso);

    if (error) {
        console.error("Error fetching projects:", error);
        return;
    }

    console.log(`Projects created today: ${count}`);
}

checkProjects();
