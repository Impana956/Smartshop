"""
database.py  –  Database Initialization & Connection Management

Supports PostgreSQL (Supabase/Render via DATABASE_URL) and SQLite (local fallback).
"""

import os
import sqlite3
from datetime import datetime, timedelta

DATABASE_URL = os.environ.get('DATABASE_URL', '')  # set on Render/Supabase
DATABASE     = 'ecommerce.db'                       # SQLite fallback for local

USE_POSTGRES = bool(DATABASE_URL)


class _PgRow(dict):
    """Make psycopg2 rows behave like sqlite3.Row (column access by name)."""
    def __getitem__(self, key):
        if isinstance(key, int):
            return list(self.values())[key]
        return super().__getitem__(key)
    def keys(self):
        return super().keys()


class _PgCursor:
    """Thin wrapper so psycopg2 cursor behaves like sqlite3 connection."""
    def __init__(self, conn):
        self._conn = conn
        self._cur  = conn.cursor()
        self.lastrowid = None

    def _adapt(self, sql):
        """Convert SQLite-style ? placeholders and AUTOINCREMENT to PostgreSQL."""
        import re
        sql = sql.replace('?', '%s')
        sql = re.sub(r'INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT',
                     'SERIAL PRIMARY KEY', sql, flags=re.IGNORECASE)
        sql = re.sub(r'INSERT\s+OR\s+IGNORE\s+INTO', 'INSERT INTO', sql, flags=re.IGNORECASE)
        return sql

    def execute(self, sql, params=()):
        sql = self._adapt(sql)
        self._cur.execute(sql, params)
        try:
            self.lastrowid = self._cur.fetchone()[0]
        except Exception:
            self.lastrowid = None
        return self

    def executemany(self, sql, seq):
        sql = self._adapt(sql)
        self._cur.executemany(sql, seq)
        return self

    def executescript(self, sql):
        # Split on ';' and run each statement individually
        import re
        stmts = [s.strip() for s in re.split(r';\s*', sql) if s.strip()]
        for s in stmts:
            try:
                self._cur.execute(self._adapt(s))
            except Exception:
                pass
        return self

    def fetchone(self):
        row = self._cur.fetchone()
        if row is None:
            return None
        cols = [d[0] for d in self._cur.description]
        return _PgRow(zip(cols, row))

    def fetchall(self):
        rows = self._cur.fetchall()
        if not rows:
            return []
        cols = [d[0] for d in self._cur.description]
        return [_PgRow(zip(cols, r)) for r in rows]


class _PgConn:
    """Wraps psycopg2 connection to look like sqlite3 connection."""
    def __init__(self, raw):
        self._raw = raw

    def cursor(self):
        return _PgCursor(self._raw)

    def execute(self, sql, params=()):
        c = _PgCursor(self._raw)
        return c.execute(sql, params)

    def executescript(self, sql):
        c = _PgCursor(self._raw)
        return c.executescript(sql)

    def executemany(self, sql, seq):
        c = _PgCursor(self._raw)
        return c.executemany(sql, seq)

    def commit(self):
        self._raw.commit()

    def close(self):
        self._raw.close()


def get_db():
    """Return a database connection (PostgreSQL or SQLite)."""
    if USE_POSTGRES:
        import psycopg2
        raw = psycopg2.connect(DATABASE_URL, sslmode='require')
        return _PgConn(raw)
    conn = sqlite3.connect(DATABASE, timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=30000")
    return conn


def init_db():
    """
    Create tables and seed sample data if the database is empty.
    Called once at Flask application startup.
    """
    conn = get_db()
    cursor = conn.cursor()

    if USE_POSTGRES:
        # PostgreSQL DDL
        stmts = [
            '''CREATE TABLE IF NOT EXISTS users (
                user_id        SERIAL PRIMARY KEY,
                name           TEXT    NOT NULL,
                email          TEXT    UNIQUE,
                password_hash  TEXT,
                loyalty_points INTEGER DEFAULT 0
            )''',
            '''CREATE TABLE IF NOT EXISTS products (
                product_id  SERIAL PRIMARY KEY,
                name        TEXT    NOT NULL,
                category    TEXT    NOT NULL,
                price       REAL    NOT NULL,
                description TEXT,
                image       TEXT,
                stock       INTEGER DEFAULT 100
            )''',
            '''CREATE TABLE IF NOT EXISTS interactions (
                id          SERIAL PRIMARY KEY,
                user_id     INTEGER NOT NULL REFERENCES users(user_id),
                product_id  INTEGER NOT NULL REFERENCES products(product_id),
                action      TEXT    NOT NULL,
                rating      REAL,
                timestamp   TEXT    NOT NULL
            )''',
            '''CREATE TABLE IF NOT EXISTS orders (
                order_id       SERIAL PRIMARY KEY,
                user_id        INTEGER NOT NULL REFERENCES users(user_id),
                status         TEXT    NOT NULL DEFAULT 'placed',
                total          REAL    NOT NULL,
                discount       REAL    NOT NULL DEFAULT 0,
                coupon_code    TEXT,
                address        TEXT    NOT NULL,
                payment_method TEXT    NOT NULL DEFAULT 'cod',
                payment_id     TEXT,
                created_at     TEXT    NOT NULL,
                updated_at     TEXT    NOT NULL
            )''',
            '''CREATE TABLE IF NOT EXISTS order_items (
                id         SERIAL PRIMARY KEY,
                order_id   INTEGER NOT NULL REFERENCES orders(order_id),
                product_id INTEGER NOT NULL REFERENCES products(product_id),
                quantity   INTEGER NOT NULL DEFAULT 1,
                unit_price REAL    NOT NULL
            )''',
            '''CREATE TABLE IF NOT EXISTS coupons (
                id             SERIAL PRIMARY KEY,
                code           TEXT    NOT NULL UNIQUE,
                discount_type  TEXT    NOT NULL,
                discount_value REAL    NOT NULL,
                min_order      REAL    NOT NULL DEFAULT 0,
                max_uses       INTEGER NOT NULL DEFAULT 1000,
                used_count     INTEGER NOT NULL DEFAULT 0,
                expires_at     TEXT,
                is_active      INTEGER NOT NULL DEFAULT 1
            )''',
            '''CREATE TABLE IF NOT EXISTS flash_sales (
                id             SERIAL PRIMARY KEY,
                product_id     INTEGER NOT NULL UNIQUE REFERENCES products(product_id),
                sale_price     REAL    NOT NULL,
                original_price REAL    NOT NULL,
                discount_pct   INTEGER NOT NULL,
                end_time       TEXT    NOT NULL,
                is_active      INTEGER NOT NULL DEFAULT 1
            )''',
            '''CREATE TABLE IF NOT EXISTS price_history (
                id          SERIAL PRIMARY KEY,
                product_id  INTEGER NOT NULL REFERENCES products(product_id),
                price       REAL    NOT NULL,
                recorded_at TEXT    NOT NULL
            )''',
            'CREATE INDEX IF NOT EXISTS idx_inter_user    ON interactions(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_inter_product ON interactions(product_id)',
            'CREATE INDEX IF NOT EXISTS idx_inter_action  ON interactions(action)',
            'CREATE INDEX IF NOT EXISTS idx_inter_ts      ON interactions(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_prod_cat      ON products(category)',
            'CREATE INDEX IF NOT EXISTS idx_prod_name     ON products(name)',
            'CREATE INDEX IF NOT EXISTS idx_inter_rating  ON interactions(product_id, rating)',
            'CREATE INDEX IF NOT EXISTS idx_ph_prod       ON price_history(product_id)',
        ]
        for s in stmts:
            try:
                cursor.execute(s)
                conn.commit()
            except Exception:
                conn.commit()
    else:
        # SQLite DDL (original)
        cursor.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                user_id       INTEGER PRIMARY KEY AUTOINCREMENT,
                name          TEXT    NOT NULL,
                email         TEXT    UNIQUE,
                password_hash TEXT,
                loyalty_points INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS products (
                product_id  INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT    NOT NULL,
                category    TEXT    NOT NULL,
                price       REAL    NOT NULL,
                description TEXT,
                image       TEXT,
                stock       INTEGER DEFAULT 100
            );
            CREATE TABLE IF NOT EXISTS interactions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                product_id  INTEGER NOT NULL,
                action      TEXT    NOT NULL,
                rating      REAL,
                timestamp   TEXT    NOT NULL,
                FOREIGN KEY (user_id)    REFERENCES users(user_id),
                FOREIGN KEY (product_id) REFERENCES products(product_id)
            );
            CREATE TABLE IF NOT EXISTS orders (
                order_id       INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id        INTEGER NOT NULL,
                status         TEXT    NOT NULL DEFAULT 'placed',
                total          REAL    NOT NULL,
                discount       REAL    NOT NULL DEFAULT 0,
                coupon_code    TEXT,
                address        TEXT    NOT NULL,
                payment_method TEXT    NOT NULL DEFAULT 'cod',
                payment_id     TEXT,
                created_at     TEXT    NOT NULL,
                updated_at     TEXT    NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            );
            CREATE TABLE IF NOT EXISTS order_items (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id   INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity   INTEGER NOT NULL DEFAULT 1,
                unit_price REAL    NOT NULL,
                FOREIGN KEY (order_id)   REFERENCES orders(order_id),
                FOREIGN KEY (product_id) REFERENCES products(product_id)
            );
            CREATE TABLE IF NOT EXISTS coupons (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                code           TEXT    NOT NULL UNIQUE,
                discount_type  TEXT    NOT NULL,
                discount_value REAL    NOT NULL,
                min_order      REAL    NOT NULL DEFAULT 0,
                max_uses       INTEGER NOT NULL DEFAULT 1000,
                used_count     INTEGER NOT NULL DEFAULT 0,
                expires_at     TEXT,
                is_active      INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS flash_sales (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id     INTEGER NOT NULL UNIQUE,
                sale_price     REAL    NOT NULL,
                original_price REAL    NOT NULL,
                discount_pct   INTEGER NOT NULL,
                end_time       TEXT    NOT NULL,
                is_active      INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY (product_id) REFERENCES products(product_id)
            );
            CREATE TABLE IF NOT EXISTS price_history (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id  INTEGER NOT NULL,
                price       REAL    NOT NULL,
                recorded_at TEXT    NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(product_id)
            );
            CREATE INDEX IF NOT EXISTS idx_interactions_user    ON interactions(user_id);
            CREATE INDEX IF NOT EXISTS idx_interactions_product ON interactions(product_id);
            CREATE INDEX IF NOT EXISTS idx_interactions_action  ON interactions(action);
            CREATE INDEX IF NOT EXISTS idx_interactions_ts      ON interactions(timestamp);
            CREATE INDEX IF NOT EXISTS idx_products_category    ON products(category);
            CREATE INDEX IF NOT EXISTS idx_products_name        ON products(name);
            CREATE INDEX IF NOT EXISTS idx_interactions_rating  ON interactions(product_id, rating);
            CREATE INDEX IF NOT EXISTS idx_price_hist_prod      ON price_history(product_id);
        ''')
        conn.commit()
        # SQLite migrations for old DBs
        for col in [('password_hash','TEXT'),('email','TEXT'),('loyalty_points','INTEGER DEFAULT 0')]:
            try:
                cursor.execute(f'ALTER TABLE users ADD COLUMN {col[0]} {col[1]}')
                conn.commit()
            except Exception:
                pass
        try:
            cursor.execute('ALTER TABLE products ADD COLUMN image TEXT')
            conn.commit()
        except Exception:
            pass
        try:
            cursor.execute('ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 100')
            conn.commit()
        except Exception:
            pass

    conn.execute("UPDATE products SET stock = (ABS(RANDOM()) %% 91 + 10) WHERE stock IS NULL" if USE_POSTGRES
                 else "UPDATE products SET stock = (ABS(RANDOM()) % 91 + 10) WHERE stock IS NULL")
    conn.commit()

    # ── Seed coupons (once) ────────────────────────────────────────────────
    if conn.execute('SELECT COUNT(*) FROM coupons').fetchone()[0] == 0:
        exp = (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d %H:%M:%S')
        demo_coupons = [
            ('SAVE10',    'percent', 10,  0,    1000, exp),
            ('FLAT50',    'fixed',   50,  200,  500,  exp),
            ('FLAT100',   'fixed',   100, 500,  200,  exp),
            ('WELCOME20', 'percent', 20,  0,    2000, exp),
            ('BIGDEAL',   'percent', 25,  1000, 100,  exp),
        ]
        cursor.executemany(
            'INSERT INTO coupons (code, discount_type, discount_value, min_order, max_uses, expires_at)'
            ' VALUES (?,?,?,?,?,?)',
            demo_coupons
        )
        conn.commit()

    # ── Seed flash sales (once) ────────────────────────────────────────────
    if conn.execute('SELECT COUNT(*) FROM flash_sales').fetchone()[0] == 0:
        prods = conn.execute(
            'SELECT product_id, price FROM products WHERE price > 100 ORDER BY RANDOM() LIMIT 12'
        ).fetchall()
        end_time = (datetime.now() + timedelta(hours=48)).strftime('%Y-%m-%d %H:%M:%S')
        for p in prods:
            sale_price = round(p['price'] * 0.70, 2)
            try:
                if USE_POSTGRES:
                    cursor.execute(
                        'INSERT INTO flash_sales (product_id, sale_price, original_price, discount_pct, end_time)'
                        ' VALUES (%s,%s,%s,%s,%s) ON CONFLICT (product_id) DO NOTHING',
                        (p['product_id'], sale_price, p['price'], 30, end_time)
                    )
                else:
                    cursor.execute(
                        'INSERT OR IGNORE INTO flash_sales'
                        ' (product_id, sale_price, original_price, discount_pct, end_time)'
                        ' VALUES (?,?,?,?,?)',
                        (p['product_id'], sale_price, p['price'], 30, end_time)
                    )
            except Exception:
                pass
        conn.commit()

    # ── Seed price history (once) ──────────────────────────────────────────
    if conn.execute('SELECT COUNT(*) FROM price_history').fetchone()[0] == 0:
        import random as _rand
        _rand.seed(42)
        _prods = conn.execute(
            'SELECT product_id, price FROM products ORDER BY product_id LIMIT 300'
        ).fetchall()
        _now = datetime.now()
        _entries = []
        for _p in _prods:
            _pw = float(_p['price'])
            for _day in range(29, -1, -1):
                _date = (_now - timedelta(days=_day)).strftime('%Y-%m-%d')
                _pw = round(max(1, _pw * _rand.uniform(0.93, 1.07)), 2)
                _entries.append((_p['product_id'], _pw, _date))
        cursor.executemany(
            'INSERT INTO price_history (product_id, price, recorded_at) VALUES (?,?,?)',
            _entries
        )
        conn.commit()

    # ── Seed products/users (once) ─────────────────────────────────────────
    user_count = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
    if user_count == 0:
        from load_dataset import load_csv_to_db, load_seed_to_db
        load_csv_to_db(conn)
        load_seed_to_db(conn)

    conn.close()


