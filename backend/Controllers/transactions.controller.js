const pool = require('../db');

class TransactionsController{
    async getTransactions(req, res){
        try {
            const result = await pool.query(
                'SELECT transaction_id, bank_branch, currency, transaction_date, transaction_type, transaction_amount FROM transactions ORDER BY transaction_id ASC'
            );
            res.json(result.rows);
        } catch (e) {
            res.status(500).json({message: 'Ошибка получения клиентов'});
        }
    }

    async getOneTransaction(req, res) {
        try {
            const {id} = req.params;
            const result = await pool.query(
                'SELECT transaction_id, bank_branch, currency, transaction_date, transaction_type, transaction_amount FROM transactions WHERE transaction_id = $1',
                [id]
            );
            res.json(result.rows[0]);
        } catch (e) {
            res.status(500).json({message: 'Ошибка получения валют'});
        }
    }


    async putTransaction(req, res) {
        try {
            const { id } = req.params;
            const { bank_branch, currency, transaction_date, transaction_type, transaction_amount } = req.body;

            const result = await pool.query(
                'UPDATE transactions SET bank_branch = $1, currency = $2, transaction_date = $3, transaction_type = $4, transaction_amount = $5 WHERE transaction_id = $6 RETURNING *',
                [bank_branch, currency, transaction_date, transaction_type, transaction_amount, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).send('Валюта с таким ID не найден');
            }
            res.json(result.rows[0]);
        } catch (e) {
            res.status(500).json({message: 'Ошибка изменения валюты'});
        }

    };

    async deleteTransaction(req, res) {
        try {
            const {id} = req.params;
            const result = await pool.query('DELETE FROM transactions WHERE transaction_id = $1', [id]);
            if (result.rowCount === 0) {
                // Исправляем текст сообщения
                return res.status(404).send('Валюта с таким кодом не найдена');
            }
            res.status(204).send();
        } catch (e) {
            res.status(500).json({message: 'Ошибка удаления валюты'});
        }
    }
    async createTransaction(req, res) {
        try {
            const {transaction_id, bank_branch, currency, transaction_date, transaction_type, transaction_amount} = req.body;
            const result = await pool.query(` INSERT INTO transactions (transaction_id, bank_branch, currency, transaction_date, transaction_type, transaction_amount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [transaction_id, bank_branch, currency, transaction_date, transaction_type, transaction_amount]);
            res.status(201).json(result.rows[0]);
        } catch (e) {
            res.status(500).json({message: 'Ошибка на сервере при создании счета'});
        }
    };
}

module.exports = new TransactionsController();