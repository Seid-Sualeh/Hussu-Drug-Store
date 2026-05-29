

const API_URL = process.env.API_URL || "http://localhost:20105/api/health";
const INTERVAL_MINUTES = parseInt(process.env.INTERVAL_MINUTES || "5", 10);
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

console.log(`🔄 Database Keep-Alive Monitor`);
console.log(`📍 API URL: ${API_URL}`);
console.log(`⏱️  Interval: ${INTERVAL_MINUTES} minutes`);
console.log(`🚀 Started at ${new Date().toISOString()}\n`);

async function ping() {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });

    const data = await response.json();
    const time = new Date().toISOString();

    if (response.ok) {
      console.log(`✅ [${time}] Database OK - Status: ${data.database}`);
    } else {
      console.warn(`⚠️  [${time}] API responded with ${response.status}`);
      console.warn(`   Database: ${data.database || "unknown"}`);
      if (data.error) console.warn(`   Error: ${data.error}`);
    }
  } catch (err) {
    console.error(`❌ [${new Date().toISOString()}] Ping failed:`, err.message);
  }
}

// Initial ping
ping();

// Periodic pings
setInterval(ping, INTERVAL_MS);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Keep-alive monitor stopped");
  process.exit(0);
});
