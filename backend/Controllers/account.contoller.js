const pool = require('../db');

class AccountContoller{
    async getAccounts(req, res){
        try {
            const result = await pool.query(
                'SELECT account_number, passport_number, bank_branch, contract_date, currency FROM accounts ORDER BY account_number ASC'
            );
            res.json(result.rows);
        } catch (e){
            res.status(500).json({message: 'Ошибка получения счета'});
        }
    }

    async getOneAccount(req, res) {
        try {
            const {id} = req.params;
            const result = await pool.query(
                'SELECT account_number, passport_number, bank_branch, contract_date, currency FROM accounts WHERE account_number = $1',
                [id]
            );

            res.json(result.rows[0]);
        } catch (e){
            res.status(500).json({message: 'Ошибка получения счета'});
        }

    }

    async putAccount(req, res) {
        const { id } = req.params;
        const { passport_number, bank_branch, contract_date, currency } = req.body;
        if (!id) {
            return res.status(400).json({ message: 'ID счета не был предоставлен в URL' });
        }
        const result = await pool.query(
            'UPDATE accounts SET passport_number = $1, bank_branch = $2, contract_date = $3, currency = $4 WHERE account_number = $5 RETURNING *',
            [passport_number, bank_branch, contract_date, currency, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('Счет с таким ID не найден');
        }
        res.json(result.rows[0]);
    };

    async deleteAccount(req, res) {
        try {
            const {id} = req.params;
            const result = await pool.query('DELETE FROM accounts WHERE account_number = $1', [id]);

            if (result.rowCount === 0) {
                return res.status(404).send('Счет с таким ID не найден');
            }
            res.status(204).send();
        } catch (e) {
            res.status(500).json({message: 'Ошибка на сервере при удалении счета'});
        }

    }

    async createAccount(req, res) {
        try {
            const { account_number, passport_number, bank_branch, contract_date, currency } = req.body;
            const sql = `
                INSERT INTO accounts
                    (account_number, passport_number, bank_branch, contract_date, currency)
                VALUES ($1, $2, $3, $4, $5)
                    RETURNING *`;
            const values = [account_number, passport_number, bank_branch, contract_date, currency];
            const result = await pool.query(sql, values);
            res.status(201).json(result.rows[0]);
        } catch (e) {
            console.error('ОШИБКА ПРИ СОЗДАНИИ СЧЕТА (POST):', e);
            res.status(500).json({ message: 'Ошибка на сервере при создании счета' });
        }
    }
}

module.exports = new AccountContoller();