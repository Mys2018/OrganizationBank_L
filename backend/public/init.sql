-- Валюты С1
CREATE TABLE currencies
(
    currency         VARCHAR(50)  NOT NULL PRIMARY KEY,
    issuing_country  VARCHAR(100) NOT NULL,
    symbol           VARCHAR(5)   NOT NULL,
    measurement_unit VARCHAR(50)  NOT NULL
);

-- Клиенты С4
CREATE TABLE customers
(
    passport_number        VARCHAR(20)  NOT NULL PRIMARY KEY,
    full_name              VARCHAR(255) NOT NULL,
    registration_address   TEXT         NOT NULL,
    date_of_birth          DATE         NOT NULL,
    issuing_authority_code TEXT         NOT NULL
);

-- Курс валют С2
CREATE TABLE exchange_rates
(
    currency  VARCHAR(50)    NOT NULL,
    rate_date DATE           NOT NULL,
    price     DECIMAL(18, 6) NOT NULL,
    PRIMARY KEY (currency, rate_date)
);

-- Финансовые данные С3
CREATE TABLE financial_data
(
    bank_id                INT  NOT NULL PRIMARY KEY,
    bank_branch            VARCHAR(100)   NOT NULL UNIQUE,
    currency               VARCHAR(50)    NOT NULL UNIQUE,
    year                   INTEGER        NOT NULL UNIQUE,
    stored_funds_amount    DECIMAL(18, 2) NOT NULL DEFAULT '0',
    deposited_funds_amount DECIMAL(18, 2) NOT NULL DEFAULT '0',
    withdrawn_funds_amount DECIMAL(18, 2) NOT NULL DEFAULT '0'

);

-- Операции С7
CREATE TABLE transactions
(
    transaction_id     INT  NOT NULL PRIMARY KEY,
    bank_branch        VARCHAR(100)   NOT NULL,
    currency           VARCHAR(50)    NOT NULL,
    transaction_date   TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
    transaction_type   VARCHAR(50)    NOT NULL,
    transaction_amount DECIMAL(18, 2) NOT NULL
);

-- Счета С5
CREATE TABLE accounts
(
    account_number  INT NOT NULL PRIMARY KEY,
    passport_number VARCHAR(20)   NOT NULL,
    bank_branch     VARCHAR(100)  NOT NULL,
    contract_date   DATE          NOT NULL,
    currency        VARCHAR(50)   NOT NULL
);

-- Внешние ключи
ALTER TABLE
    financial_data
    ADD CONSTRAINT fk_financial_data_currency FOREIGN KEY (currency) REFERENCES currencies (currency);
ALTER TABLE
    accounts
    ADD CONSTRAINT fk_accounts_currency FOREIGN KEY (currency) REFERENCES currencies (currency);
ALTER TABLE
    accounts
    ADD CONSTRAINT fk_accounts_customer FOREIGN KEY (passport_number) REFERENCES customers (passport_number);
ALTER TABLE
    exchange_rates
    ADD CONSTRAINT fk_exchange_rates_currency FOREIGN KEY (currency) REFERENCES currencies (currency);
ALTER TABLE
    transactions
    ADD CONSTRAINT fk_transactions_currency FOREIGN KEY (currency) REFERENCES currencies (currency);

-- Данные
-- 1. Заполнение таблицы "Клиенты"
INSERT INTO customers (passport_number, full_name, registration_address, date_of_birth, issuing_authority_code)
VALUES ('4510 123456', 'Иванов Иван Иванович', 'г. Москва, ул. Ленина, д. 1, кв. 10', '1985-05-20', '770-001'),
       ('4615 987654', 'Петрова Мария Сергеевна', 'г. Санкт-Петербург, Невский пр-т, д. 25, кв. 5', '1992-11-10',
        '780-015'),
       ('4720 112233', 'Сидоров Алексей Петрович', 'г. Новосибирск, ул. Красный проспект, д. 100', '1978-01-30',
        '540-002');

-- 2. Заполнение таблицы "Валюты"
INSERT INTO currencies (currency, issuing_country, symbol, measurement_unit)
VALUES ('RUB', 'Российская Федерация', '₽', 'Российский рубль'),
       ('USD', 'Соединенные Штаты Америки', '$', 'Доллар США'),
       ('EUR', 'Европейский союз', '€', 'Евро');

-- 3. Заполнение таблицы "Курс валют"
INSERT INTO exchange_rates (currency, rate_date, price)
VALUES ('USD', '2023-10-26', 93.500000),
       ('EUR', '2023-10-26', 98.800000),
       ('RUB', '2023-10-26', 1.000000),
       ('USD', '2023-10-27', 93.750000),
       ('EUR', '2023-10-27', 99.100000),
       ('RUB', '2023-10-27', 1.000000);

-- 4. Заполнение таблицы "Счета"
INSERT INTO accounts (account_number, passport_number, bank_branch, contract_date, currency)
VALUES (1, '4510 123456', 'Центральное отделение, Москва', '2020-03-15', 'RUB'),
       (2, '4615 987654', 'Невское отделение, Санкт-Петербург', '2021-08-01', 'USD'),
       (3, '4510 123456', 'Центральное отделение, Москва', '2022-01-20', 'EUR'),
       (4, '4720 112233', 'Филиал "Сибирский", Новосибирск', '2023-05-18', 'RUB');

-- 5. Заполнение таблицы "Операции" (transactions)
INSERT INTO transactions (transaction_id, bank_branch, currency, transaction_date, transaction_type,
                          transaction_amount)
VALUES (1, 'Центральное отделение, Москва', 'RUB', '2023-10-20 10:00:00', 'DEPOSIT', 50000.00),
       (2, 'Невское отделение, Санкт-Петербург', 'USD', '2023-10-21 14:30:00', 'WITHDRAWAL', 1000.00),
       (3, 'Центральное отделение, Москва', 'EUR', '2023-10-22 11:15:00', 'DEPOSIT', 500.00),
       (4, 'Центральное отделение, Москва', 'RUB', '2023-10-25 16:45:00', 'WITHDRAWAL', 15000.00),
       (5, 'Филиал "Сибирский", Новосибирск', 'RUB', '2023-10-27 09:05:12', 'DEPOSIT', 120000.00);

-- Удаление
DROP TABLE currencies CASCADE;
DROP TABLE customers CASCADE;
DROP TABLE exchange_rates CASCADE;
DROP TABLE financial_data CASCADE;
DROP TABLE transactions CASCADE;
DROP TABLE accounts CASCADE;