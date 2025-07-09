const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const accountController = require('../backend/Controllers/account.contoller');
const currencyController = require('../backend/Controllers/currencies.controller')
const customersController = require('../backend/Controllers/customers.controller')

// Счета
app.get('/api/accounts', accountController.getAccounts);
app.get('/api/accounts/:id', accountController.getOneAccount);
app.post('/api/accounts', accountController.createAccount);
app.put('/api/accounts/:id', accountController.putAccount);
app.delete('/api/accounts/:id', accountController.deleteAccount);

// Валюты
app.get('/api/currencies', currencyController.getCurrencies);
app.get('/api/currencies/:id', currencyController.getOneCurrency);
app.post('/api/currencies', currencyController.createCurrency)
app.put('/api/currencies/:id', currencyController.putCurrency);
app.delete('/api/currencies/:id', currencyController.deleteCurrency);
// Клиенты
app.get('/api/customers', customersController.getCustomers);
app.get('/api/customers/:id', customersController.getOneCustomer);
app.post('/api/customers', customersController.createCustomer)
app.put('/api/customers/:id', customersController.putCustomer);
app.delete('/api/customers/:id', customersController.deleteCustomer);

// Запускаем сервер
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});