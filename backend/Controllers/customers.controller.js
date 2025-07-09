const pool = require('../db');

class CustomersController{
    async getCustomers(req, res){
        try {
            const result = await pool.query(
                'SELECT passport_number, full_name, registration_address, date_of_birth, issuing_authority_code FROM customers ORDER BY passport_number ASC'
            );
            res.json(result.rows);
        } catch (e) {
            res.status(500).json({message: 'Ошибка получения клиентов'});
        }
    }

    async getOneCustomer(req, res) {
        try {
            const {id} = req.params;
            const result = await pool.query(
                'SELECT passport_number, full_name, registration_address, date_of_birth, issuing_authority_code FROM customers WHERE passport_number = $1',
                [id]
            );
            res.json(result.rows[0]);
        } catch (e) {
            res.status(500).json({message: 'Ошибка получения валют'});
        }
    }

    async putCustomer(req, res) {
        try {
            const { id } = req.params;
            const { full_name, registration_address, date_of_birth, issuing_authority_code } = req.body;

            const result = await pool.query(
                'UPDATE customers SET full_name = $1, registration_address = $2, date_of_birth = $3, issuing_authority_code = $4  WHERE passport_number = $5 RETURNING *',
                [full_name, registration_address, date_of_birth, issuing_authority_code, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).send('Валюта с таким ID не найден');
            }
            res.json(result.rows[0]);
        } catch (e) {
            res.status(500).json({message: 'Ошибка изменения валюты'});
        }

    };

    async deleteCustomer(req, res) {
        try {
            const {id} = req.params;
            const result = await pool.query('DELETE FROM customers WHERE passport_number = $1', [id]);
            if (result.rowCount === 0) {
                // Исправляем текст сообщения
                return res.status(404).send('Валюта с таким кодом не найдена');
            }
            res.status(204).send();
        } catch (e) {
            res.status(500).json({message: 'Ошибка удаления валюты'});
        }
    }
    async createCustomer(req, res) {
        try {
            const {passport_number, full_name, registration_address, date_of_birth, issuing_authority_code} = req.body;
            const result = await pool.query(` INSERT INTO currencies (passport_number, full_name, registration_address, date_of_birth, issuing_authority_code) VALUES ($1, $2, $3, $4) RETURNING *`, [passport_number, full_name, registration_address, date_of_birth, issuing_authority_code]);
            res.status(201).json(result.rows[0]);
        } catch (e) {
            res.status(500).json({message: 'Ошибка на сервере при создании счета'});
        }
    };
}

module.exports = new CustomersController();