// Runs once when a server instance boots, before it starts taking requests.
// Prints a startup banner so you can see at a glance whether the database is
// reachable and which parts of the panel are actually configured.

const APP_NAME = "India Gate CMS";

const OK = "✅";
const FAIL = "❌";
const WARN = "⚠️ ";

// The api surface this app mounts. Kept as a list rather than read off the
// filesystem, a production build does not ship the app folder.
const SERVICES = [
  { label: "Auth", route: "/api/auth/{login,refresh,logout}", enabled: true },
  { label: "Dashboard", route: "/api/dashboard", enabled: true },
  { label: "Contacts", route: "/api/contacts", enabled: true },
  { label: "Blogs", route: "/api/blogs", enabled: true },
  { label: "FAQs", route: "/api/faqs", enabled: true },
  { label: "Recipes", route: "/api/recipes", enabled: true },
  { label: "Page SEO", route: "/api/page-meta", enabled: true },
  { label: "Home & Footer", route: "/api/settings", enabled: true },
  { label: "Admins", route: "/api/admins (superadmin only)", enabled: true },
  { label: "Insta Posts", route: "/api/insta-posts", enabled: false },
];

function line(label: string, value: string) {
  console.log(`  ${label.padEnd(11)} ${value}`);
}

export async function register() {
  // instrumentation also runs on the edge runtime, where mysql2 and fs are not
  // available, so everything below is node only
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { checkDatabase } = await import("./app/api/db/db");
  const { UPLOAD_DIR, ensureUploadDir } = await import(
    "./app/lib/utils/upload"
  );
  const { usingS3, isS3Configured, cloudFrontUrl } = await import(
    "./app/lib/utils/storage"
  );
  const { verifyMailer, isMailConfigured, notifyTo } = await import(
    "./app/lib/utils/mailer"
  );

  const env = process.env.NODE_ENV ?? "development";

  console.log("");
  console.log("─".repeat(64));
  console.log(`  ${APP_NAME}  ·  ${env}`);
  console.log("─".repeat(64));

  // ---------- database ----------

  const db = await checkDatabase();

  if (db.ok) {
    line(
      "Database",
      `${OK} connected  mysql ${db.version ?? "?"}  ${db.user}@${db.host}:${db.port}/${db.database}  ${db.latencyMs}ms`,
    );
  } else {
    line(
      "Database",
      `${FAIL} NOT connected  ${db.user}@${db.host}:${db.port}/${db.database}`,
    );
    line("", `   ${db.error}`);
  }

  // ---------- uploads ----------

  if (usingS3) {
    line("Uploads", `${OK} s3 via cloudfront  ${cloudFrontUrl}/blogs_images`);
  } else {
    try {
      ensureUploadDir();

      line("Uploads", `${OK} local  ${UPLOAD_DIR}`);

      // saying so up front avoids the surprise of production writing to a
      // disk that is replaced on the next deploy
      line(
        "",
        isS3Configured
          ? "   s3 is configured, set APP_ENV=production to use it"
          : `   ${WARN}s3 not configured, uploads stay on this machine`,
      );
    } catch (error) {
      line(
        "Uploads",
        `${FAIL} ${UPLOAD_DIR} — ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // ---------- auth ----------

  const hasAccessSecret = !!process.env.JWT_SECRET;
  const hasRefreshSecret = !!process.env.JWT_REFRESH_SECRET;

  if (hasAccessSecret && hasRefreshSecret) {
    line(
      "Auth",
      `${OK} jwt ready  access ${process.env.JWT_EXPIRES_IN ?? "(no expiry set)"} · refresh ${process.env.JWT_REFRESH_EXPIRE ?? "(no expiry set)"}`,
    );
  } else {
    const missing = [
      !hasAccessSecret && "JWT_SECRET",
      !hasRefreshSecret && "JWT_REFRESH_SECRET",
    ]
      .filter(Boolean)
      .join(", ");

    line("Auth", `${FAIL} missing ${missing}, login will fail`);
  }

  // ---------- email ----------

  if (!isMailConfigured) {
    line("Email", `${WARN}not configured, contact form sends no acknowledgement`);
  } else {
    // actually opens the smtp connection and authenticates, so a wrong host or
    // a stale app password shows up here rather than on the first enquiry
    const mail = await verifyMailer();

    if (mail.ok) {
      line("Email", `${OK} smtp ready  ${mail.user}  ${mail.host}:${mail.port}`);
      line(
        "",
        notifyTo.length
          ? `   new enquiries notify ${notifyTo.join(", ")}`
          : `   ${WARN}no CONTACT_NOTIFY_TO set, nobody is told about new enquiries`,
      );
    } else {
      line("Email", `${FAIL} smtp failed  ${mail.host}:${mail.port}`);
      line("", `   ${mail.error}`);
    }
  }

  // ---------- services ----------

  console.log("");
  console.log("  Services");

  for (const service of SERVICES) {
    const mark = service.enabled ? OK : WARN;
    const suffix = service.enabled ? "" : "  (disabled in the ui)";

    console.log(
      `   ${mark} ${service.label.padEnd(12)} ${service.route}${suffix}`,
    );
  }

  console.log("─".repeat(64));
  console.log("");
}
