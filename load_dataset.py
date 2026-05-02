"""
load_dataset.py -- Kaggle Amazon Sales Dataset Loader

Loads data from data/amazon.csv (Kaggle Amazon Sales Dataset schema).
Dataset URL: https://www.kaggle.com/datasets/karkavelrajaj/amazon-sales-dataset

CSV Schema (16 columns):
  product_id, product_name, category, discounted_price, actual_price,
  discount_percentage, rating, rating_count, about_product,
  user_id, user_name, review_id, review_title, review_content,
  img_link, product_link

Key parsing details:
  - Prices in Indian Rupee format: price 1,299 strip rupee sign and commas
  - Multiple reviewers per row separated by pipe character
  - category is hierarchical: Electronics|Mobiles - first segment used
  - Ratings like 4.1 need safe float parsing

Interaction derivation logic:
  - Every review -> click (user viewed product before reviewing)
  - Every review -> rate (star value 1-5)
  - rating >= 4.0 -> wishlist
  - rating >= 4.8 -> purchase
"""
import csv
import os
import re
import random
from datetime import datetime, timedelta

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(BASE_DIR, 'data')
AMAZON_CSV = os.path.join(DATA_DIR, 'amazon.csv')


def _random_ts(max_days=30):
    delta = timedelta(days=random.randint(0, max_days),
                      hours=random.randint(0, 23),
                      minutes=random.randint(0, 59))
    return (datetime.now() - delta).strftime('%Y-%m-%d %H:%M:%S')


def _parse_price(raw):
    cleaned = re.sub(r'[^\d.]', '', raw.strip())
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _parse_rating(raw):
    try:
        val = float(raw.split('|')[0].replace(',', '').strip())
        return val if 1.0 <= val <= 5.0 else 0.0
    except (ValueError, IndexError):
        return 0.0


def _top_category(raw):
    return raw.split('|')[0].strip()


def _try_kaggle_download():
    import subprocess, sys
    print('Attempting Kaggle API download...')
    os.makedirs(DATA_DIR, exist_ok=True)
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'kaggle', 'datasets', 'download',
             '-d', 'karkavelrajaj/amazon-sales-dataset',
             '--unzip', '-p', DATA_DIR],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode == 0 and os.path.exists(AMAZON_CSV):
            print('Kaggle download successful.')
            return True
        print('Kaggle download failed: ' + result.stderr[:200])
    except Exception as e:
        print('Kaggle CLI error: ' + str(e))
    return False


def load_csv_to_db(conn):
    """
    Parse data/amazon.csv and populate users, products, interactions tables.
    Tries Kaggle API download if file not found.
    """
    if not os.path.exists(AMAZON_CSV):
        print('amazon.csv not found, trying Kaggle download...')
        if not _try_kaggle_download():
            raise FileNotFoundError(
                'amazon.csv not found at ' + AMAZON_CSV + '\n'
                'Options:\n'
                '  1. pip install kaggle, place kaggle.json in ~/.kaggle/\n'
                '     then delete ecommerce.db and restart the server.\n'
                '  OR\n'
                '  2. Download manually from:\n'
                '     https://www.kaggle.com/datasets/karkavelrajaj/amazon-sales-dataset\n'
                '     and place amazon.csv in the data/ folder.'
            )

    cursor     = conn.cursor()
    seen_users = {}
    prod_map   = {}
    prod_seq   = 1
    user_seq   = 1
    prod_count = 0
    review_count = 0

    with open(AMAZON_CSV, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_pid = row.get('product_id', '').strip()
            if not raw_pid:
                continue

            if raw_pid not in prod_map:
                our_pid = prod_seq
                prod_map[raw_pid] = our_pid
                prod_seq += 1

                name        = row.get('product_name', 'Unknown').strip()
                category    = _top_category(row.get('category', 'General'))
                price       = _parse_price(row.get('discounted_price', '0'))
                actual      = _parse_price(row.get('actual_price', '0'))
                if price == 0.0:
                    price = actual
                description = row.get('about_product', '').strip()
                image       = row.get('img_link', '').strip()

                cursor.execute(
                    'INSERT OR IGNORE INTO products (product_id, name, category, price, description, image)'
                    ' VALUES (?, ?, ?, ?, ?, ?)',
                    (our_pid, name, category, price, description, image)
                )
                prod_count += 1
            else:
                our_pid = prod_map[raw_pid]

            row_rating = _parse_rating(row.get('rating', '0'))

            raw_uids   = row.get('user_id',   '').split('|')
            raw_unames = row.get('user_name', '').split('|')

            for i, uid_str in enumerate(raw_uids):
                uid_str = uid_str.strip()
                if not uid_str:
                    continue

                uname = raw_unames[i].strip() if i < len(raw_unames) else uid_str

                if uid_str not in seen_users:
                    seen_users[uid_str] = user_seq
                    cursor.execute(
                        'INSERT OR IGNORE INTO users (user_id, name) VALUES (?, ?)',
                        (user_seq, uname)
                    )
                    user_seq += 1

                int_uid = seen_users[uid_str]
                star = row_rating if row_rating > 0 else 4.0

                cursor.execute(
                    'INSERT INTO interactions (user_id, product_id, action, rating, timestamp)'
                    ' VALUES (?, ?, ?, ?, ?)',
                    (int_uid, our_pid, 'click', None, _random_ts(35))
                )
                cursor.execute(
                    'INSERT INTO interactions (user_id, product_id, action, rating, timestamp)'
                    ' VALUES (?, ?, ?, ?, ?)',
                    (int_uid, our_pid, 'rate', star, _random_ts(30))
                )
                if star >= 4.0:
                    cursor.execute(
                        'INSERT INTO interactions (user_id, product_id, action, rating, timestamp)'
                        ' VALUES (?, ?, ?, ?, ?)',
                        (int_uid, our_pid, 'wishlist', None, _random_ts(25))
                    )
                if star >= 4.8:
                    cursor.execute(
                        'INSERT INTO interactions (user_id, product_id, action, rating, timestamp)'
                        ' VALUES (?, ?, ?, ?, ?)',
                        (int_uid, our_pid, 'purchase', None, _random_ts(20))
                    )

                review_count += 1

    conn.commit()
    print('Loaded ' + str(prod_count) + ' products, ' +
          str(len(seen_users)) + ' users, and ' +
          str(review_count) + ' review interactions from Kaggle Amazon CSV.')


SEED_CSV = os.path.join(DATA_DIR, 'products_seed.csv')


def load_seed_to_db(conn):
    """
    Load data/products_seed.csv (combined_products.csv format) into the products table.
    Used as a supplementary dataset on deployments where combined_products.csv is unavailable.
    CSV columns: name, main_category, sub_category, image, link, ratings, no_of_ratings,
                 discount_price, actual_price
    """
    if not os.path.exists(SEED_CSV):
        return 0

    cursor = conn.cursor()
    # Find current max product_id to avoid collisions
    row = cursor.execute('SELECT MAX(product_id) FROM products').fetchone()
    seq = (row[0] or 0) + 1
    count = 0

    with open(SEED_CSV, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name  = row.get('name', '').strip()
            if not name:
                continue
            category = (row.get('sub_category') or row.get('main_category') or 'General').strip()
            price    = _parse_price(row.get('discount_price') or row.get('actual_price') or '0')
            actual   = _parse_price(row.get('actual_price', '0'))
            if price == 0.0:
                price = actual
            if price == 0.0:
                continue
            image   = row.get('image', '').strip()
            try:
                rating = float(row.get('ratings', '0') or '0')
            except ValueError:
                rating = 0.0

            cursor.execute(
                'INSERT OR IGNORE INTO products (product_id, name, category, price, image)'
                ' VALUES (?, ?, ?, ?, ?)',
                (seq, name, category, price, image)
            )
            # Seed a synthetic interaction so recommender has signal
            if rating >= 4.0:
                cursor.execute(
                    'INSERT INTO interactions (user_id, product_id, action, rating, timestamp)'
                    ' VALUES (1, ?, ?, ?, ?)',
                    (seq, 'rate', rating, _random_ts(60))
                )
            seq += 1
            count += 1

    conn.commit()
    print(f'Loaded {count} additional products from products_seed.csv.')
    return count

