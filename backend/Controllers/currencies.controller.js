const pool = require('../db');

class CurrenciesController{
    async getCurrencies(req, res){
        try {
            const result = await pool.query(
                'SELECT currency, issuing_country, symbol, measurement_unit FROM currencies ORDER BY currency ASC'
            );
            res.json(result.rows);
        } catch (e) {
            res.status(500).json({message: 'Ошибка получения валюты'});
        }
    }

    async getOneCurrency(req, res) {
        try {
            const {id} = req.params;
            const result = await pool.query(
                'SELECT currency, issuing_country, symbol, measurement_unit FROM currencies WHERE currency = $1',
                [id]
            );
            res.json(result.rows[0]);
        } catch (e) {
            res.status(500).json({message: 'Ошибка получения валют'});
        }
    }

    async putCurrency(req, res) {
        try {
            const { id } = req.params;
            const { issuing_country, symbol, measurement_unit } = req.body;

            const result = await pool.query(
                'UPDATE currencies SET issuing_country = $1, symbol = $2, measurement_unit = $3 WHERE currency = $4 RETURNING *',
                [issuing_country, symbol, measurement_unit, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).send('Валюта с таким ID не найден');
            }
            res.json(result.rows[0]);
        } catch (e) {
            res.status(500).json({message: 'Ошибка изменения валюты'});
        }

    };

    async deleteCurrency(req, res) {
        try {
            const {id} = req.params;
            const result = await pool.query('DELETE FROM currencies WHERE currency = $1', [id]);
            if (result.rowCount === 0) {
                // Исправляем текст сообщения
                return res.status(404).send('Валюта с таким кодом не найдена');
            }
            res.status(204).send();
        } catch (e) {
            res.status(500).json({message: 'Ошибка удаления валюты'});
        }
    }
    async createCurrency(req, res) {
        try {
            const {currency, issuing_country, symbol, measurement_unit} = req.body;
            const result = await pool.query(` INSERT INTO currencies (currency, issuing_country, symbol, measurement_unit) VALUES ($1, $2, $3, $4) RETURNING *`, [currency, issuing_country, symbol, measurement_unit]);
            res.status(201).json(result.rows[0]);
        } catch (e) {
            res.status(500).json({message: 'Ошибка на сервере при создании счета'});
        }
    };
}

module.exports = new CurrenciesController();