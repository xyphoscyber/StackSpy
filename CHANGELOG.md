# Changelog

All notable changes to StackSpy will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-05-25

### Added
- Initial release
- 30+ technology signatures across 5 categories (databases, ORMs, caches, search engines, data infrastructure)
- Multi-signal detection engine: DOM/HTML, JavaScript globals, script URLs, cookies, HTTP headers, meta tags, error patterns
- Confidence scoring per detection (Low / Medium / High)
- Exposure score — visual risk bar
- Security hints tab (Firebase RLS, MongoDB auth, Redis, Elasticsearch, Supabase)
- Framework hints (Next.js, Nuxt, Laravel)
- Raw signals audit trail
- Export findings to JSON
- Rescan without page reload
- Chrome Manifest v3 compliant
- Dark theme UI with JetBrains Mono + Syne typography

### Detected Technologies (v1.0)
**Databases:** MySQL, PostgreSQL, MongoDB, SQLite, Oracle DB, MariaDB, CouchDB, Firebase/Firestore, DynamoDB, Cassandra, Supabase, PlanetScale, PocketBase, InfluxDB

**ORMs:** Prisma, Sequelize, TypeORM, Drizzle ORM, SQLAlchemy, Django ORM, Rails ActiveRecord, Hibernate

**Caches:** Redis, Memcached, Varnish Cache, Cloudflare Cache

**Search:** Elasticsearch, Algolia, MeiliSearch, Typesense, Solr

**Infra:** GraphQL, Apollo GraphQL, Kafka, RabbitMQ, AWS RDS
