const pool = require('../db');

class DataProcessingController {
    async calculateAndStoreFinancialData(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const calculationQuery = `
                WITH TransactionChanges AS (
                    SELECT
                        "transaction_date",
                        "bank_branch",
                        "currency",
                        CASE
                            WHEN "transaction_type" = 'DEPOSIT' THEN "transaction_amount"
                            WHEN "transaction_type" = 'WITHDRAWAL' THEN -"transaction_amount"
                            ELSE 0
                        END as net_change
                    FROM "transactions"
                ),
                YearlyAggregates AS (
                    SELECT
                        EXTRACT(YEAR FROM "transaction_date")::integer as "year",
                        "bank_branch",
                        "currency",
                        SUM(CASE WHEN net_change > 0 THEN net_change ELSE 0 END) as "deposited_funds_amount",
                        SUM(CASE WHEN net_change < 0 THEN -net_change ELSE 0 END) as "withdrawn_funds_amount"
                    FROM TransactionChanges
                    GROUP BY "year", "bank_branch", "currency"
                ),
                CumulativeBalance AS (
                    SELECT DISTINCT
                        EXTRACT(YEAR FROM "transaction_date")::integer as "year",
                        "bank_branch",
                        "currency",
                        SUM(net_change) OVER (
                            PARTITION BY "bank_branch", "currency"
                            ORDER BY EXTRACT(YEAR FROM "transaction_date")
                        ) as end_of_year_balance
                    FROM TransactionChanges
                )
                SELECT
                    agg.year,
                    agg.bank_branch,
                    agg.currency,
                    COALESCE(LAG(bal.end_of_year_balance, 1, 0) OVER (
                        PARTITION BY agg.bank_branch, agg.currency
                        ORDER BY agg.year
                    ), 0) as "stored_funds_amount",
                    agg.deposited_funds_amount,
                    agg.withdrawn_funds_amount
                FROM YearlyAggregates agg
                JOIN CumulativeBalance bal 
                    ON agg.year = bal.year 
                    AND agg.bank_branch = bal.bank_branch 
                    AND agg.currency = bal.currency
                ORDER BY agg.year, agg.bank_branch, agg.currency;
            `;

            const calculatedDataResult = await client.query(calculationQuery);
            const calculatedRows = calculatedDataResult.rows;

            if (calculatedRows.length === 0) {
                await client.query('COMMIT');
                client.release();
                return res.status(200).json([]);
            }

            await client.query('TRUNCATE TABLE "financial_data" RESTART IDENTITY');

            for (const row of calculatedRows) {
                const insertQuery = `
                    INSERT INTO "financial_data" (year, bank_branch, currency, stored_funds_amount, deposited_funds_amount, withdrawn_funds_amount)
                    VALUES ($1, $2, $3, $4, $5, $6);
                `;

                await client.query(insertQuery, [
                    row.year,
                    row.bank_branch,
                    row.currency,
                    row.stored_funds_amount,
                    row.deposited_funds_amount,
                    row.withdrawn_funds_amount
                ]);
            }

            await client.query('COMMIT');

            res.status(200).json(calculatedRows);

        } catch (e) {
            await client.query('ROLLBACK');
            console.error("Ошибка при обработке финансовых данных:", e);
            res.status(500).json({ error: "Ошибка на сервере при обработке данных" });
        } finally {
            client.release();
        }
    }
}

module.exports = new DataProcessingController();