const pool = require('../db'); // Убедитесь, что путь к db.js правильный

class ExchangeRatesController {
    getRates = async (req, res) => {
        const { currency, rate_date } = req.query;
        if (currency && rate_date) {
            return this.getOneRate(req, res);
        }

        try {
            const result = await pool.query(
                "SELECT currency, TO_CHAR(rate_date, 'YYYY-MM-DD') as rate_date, price FROM exchange_rates ORDER BY currency, rate_date ASC"
            );
            res.json(result.rows);
        } catch (e) {
            console.error('ОШИБКА в getRates (все записи):', e);
            res.status(500).json({ message: 'Ошибка сервера при получении курсов валют' });
        }
    };

    getOneRate = async (req, res) => {
        try {
            const { currency, rate_date } = req.query;
            const result = await pool.query(
                "SELECT currency, TO_CHAR(rate_date, 'YYYY-MM-DD') as rate_date, price FROM exchange_rates WHERE currency = $1 AND rate_date = $2",
                [currency, rate_date]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Запись не найдена' });
            }
            res.json(result.rows[0]);
        } catch (e) {
            console.error('ОШИБКА в getOneRate:', e);
            res.status(500).json({ message: 'Ошибка сервера при получении курса валюты' });
        }
    };

    createRate = async (req, res) => {
        try {
            const { currency, rate_date, price } = req.body;
            if (!currency || !rate_date || price === undefined) {
                return res.status(400).json({ message: 'Не все поля предоставлены' });
            }
            const result = await pool.query(
                `INSERT INTO exchange_rates (currency, rate_date, price) VALUES ($1, $2, $3) RETURNING *, TO_CHAR(rate_date, 'YYYY-MM-DD') as rate_date`,
                [currency, rate_date, price]
            );
            res.status(201).json(result.rows[0]);
        } catch (e) {
            console.error('ОШИБКА в createRate:', e);
            if (e.code === '23505') {
                return res.status(409).json({ message: 'Запись с такой валютой и датой уже существует.' });
            }
            res.status(500).json({ message: 'Ошибка на сервере при создании курса' });
        }
    };

    putRate = async (req, res) => {
        try {
            const { currency, rate_date } = req.query;
            const { price } = req.body;
            if (!currency || !rate_date || price === undefined) {
                return res.status(400).json({ message: 'Необходимы query-параметры и price в теле' });
            }
            const result = await pool.query(
                'UPDATE exchange_rates SET price = $1 WHERE currency = $2 AND rate_date = $3 RETURNING *, TO_CHAR(rate_date, \'YYYY-MM-DD\') as rate_date',
                [price, currency, rate_date]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Запись не найдена' });
            }
            res.json(result.rows[0]);
        } catch (e) {
            console.error('ОШИБКА в putRate:', e);
            res.status(500).json({ message: 'Ошибка сервера при изменении курса' });
        }
    };

    deleteRate = async (req, res) => {
        console.log('Запрос на удаление курса получен. Query:', req.query); // Диагностический лог
        try {
            const { currency, rate_date } = req.query;
            if (!currency || !rate_date) {
                return res.status(400).json({ message: 'Необходимо указать currency и rate_date' });
            }
            const result = await pool.query(
                'DELETE FROM exchange_rates WHERE currency = $1 AND rate_date = $2',
                [currency, rate_date]
            );
            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Курс с такой валютой и датой не найден' });
            }
            res.status(204).send();
        } catch (e) {
            console.error('ОШИБКА в deleteRate:', e);
            res.status(500).json({ message: 'Ошибка на сервере при удалении курса' });
        }
    };
}

module.exports = new ExchangeRatesController();