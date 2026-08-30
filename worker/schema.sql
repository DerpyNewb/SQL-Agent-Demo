CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  order_date TEXT NOT NULL,
  customer TEXT NOT NULL
);

INSERT INTO products (id, name, category, price) VALUES
  (1, 'Wireless Mouse', 'Electronics', 15.99),
  (2, 'Mechanical Keyboard', 'Electronics', 59.99),
  (3, 'USB-C Hub', 'Electronics', 24.50),
  (4, 'Notebook', 'Office', 3.25),
  (5, 'Desk Lamp', 'Office', 18.00),
  (6, 'Standing Mat', 'Office', 32.00),
  (7, 'Coffee Mug', 'Kitchen', 8.50),
  (8, 'Water Bottle', 'Kitchen', 12.00),
  (9, 'Backpack', 'Accessories', 45.00),
  (10, 'Phone Stand', 'Accessories', 9.99);

INSERT INTO orders (id, product_id, quantity, order_date, customer) VALUES
  (1, 1, 2, '2026-01-05', 'Alice'),
  (2, 2, 1, '2026-01-06', 'Bob'),
  (3, 3, 3, '2026-01-12', 'Alice'),
  (4, 4, 10, '2026-01-15', 'Carol'),
  (5, 5, 1, '2026-01-20', 'Dan'),
  (6, 2, 2, '2026-02-02', 'Bob'),
  (7, 6, 1, '2026-02-04', 'Alice'),
  (8, 7, 5, '2026-02-10', 'Carol'),
  (9, 8, 4, '2026-02-11', 'Dan'),
  (10, 9, 1, '2026-02-14', 'Alice'),
  (11, 1, 1, '2026-02-18', 'Eve'),
  (12, 10, 6, '2026-02-20', 'Bob'),
  (13, 3, 2, '2026-03-01', 'Carol'),
  (14, 2, 1, '2026-03-03', 'Eve'),
  (15, 9, 2, '2026-03-05', 'Dan'),
  (16, 7, 3, '2026-03-09', 'Alice'),
  (17, 6, 1, '2026-03-12', 'Bob'),
  (18, 5, 2, '2026-03-15', 'Carol'),
  (19, 8, 2, '2026-03-18', 'Eve'),
  (20, 4, 5, '2026-03-22', 'Dan');
