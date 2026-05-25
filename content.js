(() => {
  const results = {
    databases: [],
    caches: [],
    orms: [],
    search: [],
    analytics_db: [],
    infra: [],
    confidence: {},
    raw_signals: []
  };

  const signal = (label) => results.raw_signals.push(label);

  // ─── FINGERPRINT RULES ───────────────────────────────────────────────────────
  const DB_SIGNATURES = [

    // ── Relational Databases ──────────────────────────────────────────────────
    {
      name: "MySQL", category: "databases", icon: "🐬",
      color: "#00758F", textColor: "#e0f4f8",
      checks: [
        { type: "cookie", pattern: /mysql|PHPSESSID/i },
        { type: "header", key: "x-powered-by", pattern: /mysql/i },
        { type: "meta", name: "generator", pattern: /mysql/i },
        { type: "global", keys: ["mysql", "MySQLError"] },
        { type: "html", pattern: /mysql_connect|mysqli_|PDO.*mysql/i },
        { type: "error", pattern: /You have an error in your SQL syntax|mysql_fetch|mysql_num_rows/i }
      ]
    },
    {
      name: "PostgreSQL", category: "databases", icon: "🐘",
      color: "#336791", textColor: "#d4e8f5",
      checks: [
        { type: "header", key: "x-powered-by", pattern: /postgresql|postgres/i },
        { type: "global", keys: ["pg", "Pool", "__pg"] },
        { type: "html", pattern: /pg\.connect|sequelize.*postgres|knex.*postgres/i },
        { type: "error", pattern: /PostgreSQL.*ERROR|pg_query|psycopg2/i },
        { type: "cookie", pattern: /pgsession/i }
      ]
    },
    {
      name: "Microsoft SQL Server", category: "databases", icon: "🪟",
      color: "#CC2927", textColor: "#fddcdc",
      checks: [
        { type: "header", key: "x-powered-by", pattern: /asp\.net|mssql/i },
        { type: "header", key: "server", pattern: /microsoft-iis/i },
        { type: "cookie", pattern: /ASP\.NET_SessionId|ASPSESSIONID/i },
        { type: "error", pattern: /Microsoft OLE DB|Unclosed quotation mark|MSSQL|SqlException/i },
        { type: "global", keys: ["SqlConnection", "SqlCommand"] }
      ]
    },
    {
      name: "SQLite", category: "databases", icon: "🪶",
      color: "#003B57", textColor: "#c8e6f5",
      checks: [
        { type: "html", pattern: /sqlite3|better-sqlite|sequelize.*sqlite/i },
        { type: "error", pattern: /SQLite.*error|sqlite_open|no such table/i },
        { type: "global", keys: ["Database", "__sqlite"] }
      ]
    },
    {
      name: "Oracle DB", category: "databases", icon: "🔴",
      color: "#F80000", textColor: "#ffe0e0",
      checks: [
        { type: "header", key: "server", pattern: /oracle/i },
        { type: "header", key: "x-oracle", pattern: /.+/ },
        { type: "cookie", pattern: /oracle/i },
        { type: "error", pattern: /ORA-[0-9]{5}|oracle\.jdbc|cx_Oracle/i }
      ]
    },
    {
      name: "MariaDB", category: "databases", icon: "🦭",
      color: "#C0765A", textColor: "#fde8e0",
      checks: [
        { type: "header", key: "x-powered-by", pattern: /mariadb/i },
        { type: "error", pattern: /MariaDB.*error|mariadb/i },
        { type: "html", pattern: /mariadb|knex.*mariadb/i }
      ]
    },

    // ── NoSQL Databases ───────────────────────────────────────────────────────
    {
      name: "MongoDB", category: "databases", icon: "🍃",
      color: "#4CAF50", textColor: "#e8f5e9",
      checks: [
        { type: "global", keys: ["mongoose", "MongoClient", "__mongo"] },
        { type: "html", pattern: /mongoose|mongodb|MongoClient/i },
        { type: "header", key: "x-powered-by", pattern: /mongo/i },
        { type: "error", pattern: /MongoError|MongoNetworkError|E11000 duplicate key/i },
        { type: "script_src", pattern: /mongodb/i }
      ]
    },
    {
      name: "CouchDB", category: "databases", icon: "🛋️",
      color: "#E42528", textColor: "#fde0e0",
      checks: [
        { type: "header", key: "server", pattern: /couchdb/i },
        { type: "header", key: "x-couchdb", pattern: /.+/ },
        { type: "html", pattern: /couchdb|nano\.use|PouchDB/i }
      ]
    },
    {
      name: "Firebase / Firestore", category: "databases", icon: "🔥",
      color: "#FFCA28", textColor: "#3e2000",
      checks: [
        { type: "script_src", pattern: /firebase|firestore/i },
        { type: "global", keys: ["firebase", "__firebase", "initializeApp"] },
        { type: "html", pattern: /firebaseapp\.com|firebase\.google\.com|initializeApp/i },
        { type: "cookie", pattern: /__session|_ga.*firebase/i }
      ]
    },
    {
      name: "DynamoDB", category: "databases", icon: "⚡",
      color: "#527FFF", textColor: "#d6e4ff",
      checks: [
        { type: "global", keys: ["DynamoDB", "AWS", "__aws"] },
        { type: "html", pattern: /DynamoDB|aws-sdk.*dynamodb|@aws-sdk\/client-dynamodb/i },
        { type: "header", key: "x-amz-request-id", pattern: /.+/ }
      ]
    },
    {
      name: "Cassandra", category: "databases", icon: "👁️",
      color: "#1287B1", textColor: "#d0eef8",
      checks: [
        { type: "html", pattern: /cassandra|cassandra-driver|datastax/i },
        { type: "error", pattern: /com\.datastax|NoHostAvailable|Cassandra/i }
      ]
    },
    {
      name: "Supabase", category: "databases", icon: "⚡",
      color: "#3ECF8E", textColor: "#003820",
      checks: [
        { type: "script_src", pattern: /supabase/i },
        { type: "global", keys: ["supabase", "__supabase", "createClient"] },
        { type: "html", pattern: /supabase\.co|@supabase\/supabase-js/i },
        { type: "cookie", pattern: /sb-.*-auth-token/i }
      ]
    },
    {
      name: "PlanetScale", category: "databases", icon: "🪐",
      color: "#4F46E5", textColor: "#e0dfff",
      checks: [
        { type: "html", pattern: /planetscale|@planetscale\/database/i },
        { type: "header", key: "x-planetscale", pattern: /.+/ }
      ]
    },

    // ── Caches ────────────────────────────────────────────────────────────────
    {
      name: "Redis", category: "caches", icon: "🔴",
      color: "#DC382D", textColor: "#fde8e8",
      checks: [
        { type: "global", keys: ["redis", "__redis", "ioredis"] },
        { type: "html", pattern: /ioredis|redis\.createClient|node-redis/i },
        { type: "header", key: "x-cache", pattern: /redis/i },
        { type: "error", pattern: /WRONGTYPE|ERR.*redis|Redis.*connection/i }
      ]
    },
    {
      name: "Memcached", category: "caches", icon: "🐟",
      color: "#2E8BC0", textColor: "#d5eef8",
      checks: [
        { type: "html", pattern: /memcached|Memcache\(/i },
        { type: "error", pattern: /Memcache.*Error|memcache\.get/i }
      ]
    },
    {
      name: "Varnish Cache", category: "caches", icon: "🏎️",
      color: "#5B8DB8", textColor: "#d8eaf8",
      checks: [
        { type: "header", key: "x-varnish", pattern: /.+/ },
        { type: "header", key: "via", pattern: /varnish/i },
        { type: "header", key: "x-cache", pattern: /varnish/i }
      ]
    },
    {
      name: "Cloudflare Cache", category: "caches", icon: "☁️",
      color: "#F48120", textColor: "#fff4e0",
      checks: [
        { type: "header", key: "cf-cache-status", pattern: /.+/ },
        { type: "header", key: "cf-ray", pattern: /.+/ },
        { type: "header", key: "server", pattern: /cloudflare/i }
      ]
    },

    // ── ORMs & Query Builders ─────────────────────────────────────────────────
    {
      name: "Prisma", category: "orms", icon: "◭",
      color: "#2D3748", textColor: "#e2e8f0",
      checks: [
        { type: "global", keys: ["PrismaClient", "__prisma"] },
        { type: "html", pattern: /@prisma\/client|prisma\.schema/i },
        { type: "script_src", pattern: /prisma/i }
      ]
    },
    {
      name: "Sequelize", category: "orms", icon: "🔗",
      color: "#3B82F6", textColor: "#dbeafe",
      checks: [
        { type: "global", keys: ["Sequelize", "__sequelize"] },
        { type: "html", pattern: /sequelize|sequelize-typescript/i }
      ]
    },
    {
      name: "TypeORM", category: "orms", icon: "🏷️",
      color: "#E83E8C", textColor: "#fde8f3",
      checks: [
        { type: "global", keys: ["typeorm", "DataSource"] },
        { type: "html", pattern: /typeorm|getRepository|createConnection/i }
      ]
    },
    {
      name: "Drizzle ORM", category: "orms", icon: "🌧️",
      color: "#C5F74F", textColor: "#1a2800",
      checks: [
        { type: "html", pattern: /drizzle-orm|drizzle-kit/i },
        { type: "global", keys: ["drizzle"] }
      ]
    },
    {
      name: "SQLAlchemy", category: "orms", icon: "🧪",
      color: "#CC2936", textColor: "#fde0e2",
      checks: [
        { type: "html", pattern: /sqlalchemy|flask-sqlalchemy|alembic/i },
        { type: "error", pattern: /sqlalchemy\.exc|IntegrityError.*sqlalchemy/i }
      ]
    },
    {
      name: "Django ORM", category: "orms", icon: "🎸",
      color: "#092E20", textColor: "#c8f0dc",
      checks: [
        { type: "header", key: "x-frame-options", pattern: /sameorigin/i },
        { type: "cookie", pattern: /csrftoken|sessionid/i },
        { type: "html", pattern: /django|csrfmiddlewaretoken/i },
        { type: "header", key: "x-powered-by", pattern: /django/i }
      ]
    },
    {
      name: "ActiveRecord / Rails", category: "orms", icon: "💎",
      color: "#CC0000", textColor: "#fde0e0",
      checks: [
        { type: "header", key: "x-powered-by", pattern: /phusion passenger|rack/i },
        { type: "cookie", pattern: /_session_id|_rails_session/i },
        { type: "html", pattern: /Rails\.env|ActionController/i }
      ]
    },
    {
      name: "Hibernate", category: "orms", icon: "🌿",
      color: "#59666C", textColor: "#e0eaec",
      checks: [
        { type: "error", pattern: /org\.hibernate|HibernateException|LazyInitializationException/i },
        { type: "html", pattern: /hibernate|HibernateUtil/i }
      ]
    },

    // ── Search Engines ────────────────────────────────────────────────────────
    {
      name: "Elasticsearch", category: "search", icon: "🔍",
      color: "#FEC514", textColor: "#3d2e00",
      checks: [
        { type: "global", keys: ["elasticsearch", "__es", "Client"] },
        { type: "html", pattern: /@elastic\/elasticsearch|elasticsearch/i },
        { type: "header", key: "x-elastic-product", pattern: /.+/ }
      ]
    },
    {
      name: "Algolia", category: "search", icon: "⬡",
      color: "#003DFF", textColor: "#d0d9ff",
      checks: [
        { type: "script_src", pattern: /algolia/i },
        { type: "global", keys: ["algoliasearch", "instantsearch", "aa"] },
        { type: "html", pattern: /algolia|algoliasearch|algoliaInsights/i },
        { type: "cookie", pattern: /algolia/i }
      ]
    },
    {
      name: "MeiliSearch", category: "search", icon: "🔎",
      color: "#FF5CAA", textColor: "#fff0f7",
      checks: [
        { type: "global", keys: ["MeiliSearch", "meilisearch"] },
        { type: "html", pattern: /meilisearch|@meilisearch\/instant-meilisearch/i }
      ]
    },
    {
      name: "Typesense", category: "search", icon: "🦋",
      color: "#D83367", textColor: "#ffe0ec",
      checks: [
        { type: "global", keys: ["Typesense"] },
        { type: "html", pattern: /typesense|typesense-instantsearch/i }
      ]
    },
    {
      name: "Solr", category: "search", icon: "☀️",
      color: "#D9411E", textColor: "#fde0d8",
      checks: [
        { type: "html", pattern: /solr|SolrJ|solrconfig\.xml/i },
        { type: "error", pattern: /org\.apache\.solr/i }
      ]
    },

    // ── Data / Infra ──────────────────────────────────────────────────────────
    {
      name: "GraphQL", category: "infra", icon: "◈",
      color: "#E10098", textColor: "#ffe0f5",
      checks: [
        { type: "global", keys: ["__APOLLO_STATE__", "__RELAY_STORE__", "graphql"] },
        { type: "html", pattern: /graphql|apollo-client|urql|relay-runtime/i },
        { type: "script_src", pattern: /graphql|apollo/i }
      ]
    },
    {
      name: "Apollo GraphQL", category: "infra", icon: "🚀",
      color: "#311C87", textColor: "#ddd4ff",
      checks: [
        { type: "global", keys: ["__APOLLO_STATE__", "ApolloClient"] },
        { type: "html", pattern: /@apollo\/client|apollo-server/i },
        { type: "script_src", pattern: /apollo/i }
      ]
    },
    {
      name: "Kafka", category: "infra", icon: "📨",
      color: "#231F20", textColor: "#ececec",
      checks: [
        { type: "html", pattern: /kafkajs|kafka-node|confluent/i },
        { type: "error", pattern: /org\.apache\.kafka/i }
      ]
    },
    {
      name: "RabbitMQ", category: "infra", icon: "🐇",
      color: "#FF6600", textColor: "#fff4e0",
      checks: [
        { type: "html", pattern: /amqplib|rabbitmq|amqp:\/\//i },
        { type: "error", pattern: /amqp.*error|RabbitMQ/i }
      ]
    },
    {
      name: "AWS RDS", category: "infra", icon: "☁️",
      color: "#232F3E", textColor: "#e8eff8",
      checks: [
        { type: "header", key: "x-amz-request-id", pattern: /.+/ },
        { type: "html", pattern: /amazonaws\.com.*rds|rds\.amazonaws/i }
      ]
    },
    {
      name: "PocketBase", category: "databases", icon: "🗂️",
      color: "#B8DBE4", textColor: "#0a2a30",
      checks: [
        { type: "global", keys: ["PocketBase", "pb"] },
        { type: "html", pattern: /pocketbase|pocketbase\.io/i },
        { type: "header", key: "x-pocketbase", pattern: /.+/ }
      ]
    },
    {
      name: "InfluxDB", category: "databases", icon: "📈",
      color: "#22ADF6", textColor: "#e0f4ff",
      checks: [
        { type: "html", pattern: /influxdb|@influxdata/i },
        { type: "header", key: "x-influxdb-build", pattern: /.+/ }
      ]
    }
  ];

  // ─── DETECTION ENGINE ────────────────────────────────────────────────────────
  const html = document.documentElement.innerHTML;
  const scripts = Array.from(document.querySelectorAll("script[src]")).map(s => s.src);
  const metas = Array.from(document.querySelectorAll("meta[name]")).reduce((acc, m) => {
    acc[m.name.toLowerCase()] = m.content; return acc;
  }, {});
  const cookies = document.cookie;

  // Collect headers via a fetch to current page (best-effort)
  const pageHeaders = {};

  function matchesCheck(check) {
    try {
      switch (check.type) {
        case "html":
          return check.pattern.test(html);
        case "script_src":
          return scripts.some(s => check.pattern.test(s));
        case "global":
          return check.keys.some(k => {
            try { return k in window; } catch { return false; }
          });
        case "cookie":
          return check.pattern.test(cookies);
        case "header":
          return pageHeaders[check.key] && check.pattern.test(pageHeaders[check.key]);
        case "meta":
          return metas[check.name] && check.pattern.test(metas[check.name]);
        case "error":
          return check.pattern.test(html);
        default:
          return false;
      }
    } catch { return false; }
  }

  DB_SIGNATURES.forEach(sig => {
    const matched = sig.checks.filter(c => matchesCheck(c));
    if (matched.length > 0) {
      const confidence = Math.min(100, matched.length * 35 + (matched.length > 1 ? 15 : 0));
      const entry = {
        name: sig.name,
        icon: sig.icon,
        color: sig.color,
        textColor: sig.textColor,
        confidence,
        signals: matched.map(c => c.type)
      };
      results[sig.category].push(entry);
      results.confidence[sig.name] = confidence;
      signal(`${sig.name}: ${matched.map(c => c.type).join(", ")}`);
    }
  });

  // ─── EXTRA: detect framework from globals ────────────────────────────────────
  const fw = [];
  if (window.__NEXT_DATA__) fw.push({ name: "Next.js", hint: "SSR/API likely uses Prisma or Drizzle" });
  if (window.Nuxt || window.__NUXT__) fw.push({ name: "Nuxt.js", hint: "May use Nitro server DB adapters" });
  if (window.Laravel) fw.push({ name: "Laravel", hint: "Likely Eloquent ORM → MySQL/PostgreSQL" });
  results.framework_hints = fw;

  chrome.runtime.sendMessage({ type: "DB_RESULTS", data: results });
})();
