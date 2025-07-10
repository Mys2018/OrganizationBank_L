const appConfig = {
    // Счета
    accounts: {
        endpoint: 'accounts',
        primaryKey: 'account_number',
        buildItemUrl: (baseUrl, endpoint, id) => `${baseUrl}/${endpoint}/${id}`,
        title: 'Счета',
        columns: [
            { key: 'account_number', label: 'Номер счета', type: 'number', readonly: true },
            { key: 'passport_number', label: 'Серия и номер', type: 'text' },
            { key: 'bank_branch', label: 'Отделение', type: 'text' },
            { key: 'contract_date', label: 'Дата договора', type: 'date' },
            { key: 'currency', label: 'Валюта', type: 'text' },
        ]
    },
    // Клиенты
    customers: {
        endpoint: 'customers',
        primaryKey: 'passport_number',
        buildItemUrl: (baseUrl, endpoint, id) => `${baseUrl}/${endpoint}/${id}`,
        title: 'Клиенты',
        columns: [
            { key: 'passport_number', label: 'Номер паспорта', type: 'text', readonly: true },
            { key: 'full_name', label: 'ФИО', type: 'text' },
            { key: 'registration_address', label: 'Адрес регистрации', type: 'text' },
            { key: 'date_of_birth', label: 'Дата рождения', type: 'date' },
            { key: 'issuing_authority_code', label: 'Код подразделения', type: 'text' },
        ]
    },
    // Валюты
    currencies: {
        endpoint: 'currencies',
        primaryKey: 'currency',
        buildItemUrl: (baseUrl, endpoint, id) => `${baseUrl}/${endpoint}/${id}`,
        title: 'Валюты',
        columns: [
            { key: 'currency', label: 'Валюта', type: 'text', readonly: true },
            { key: 'issuing_country', label: 'Страна-эмитент', type: 'text' },
            { key: 'symbol', label: 'Символ', type: 'text' },
            { key: 'measurement_unit', label: 'Единица измерения', type: 'text' },
        ]
    },
    // Операции
    transactions: {
        endpoint: 'transactions',
        primaryKey: 'transaction_id',
        buildItemUrl: (baseUrl, endpoint, id) => `${baseUrl}/${endpoint}/${id}`,
        title: 'Операции',
        columns: [
            { key: 'transaction_id', label: 'Номер операции', type: 'text', readonly: true },
            { key: 'bank_branch', label: 'Отделение', type: 'text' },
            { key: 'currency', label: 'Валюта', type: 'text' },
            { key: 'transaction_date', label: 'Дата транзакции', type: 'date' },
            { key: 'transaction_type', label: 'Тип транзакции', type: 'text' },
            { key: 'transaction_amount', label: 'Сумма', type: 'number' },
        ]
    },
    // Курс валют
    exchange_rates: {
        endpoint: 'exchange_rates',
        primaryKey: (item) => `${item.currency}_${item.rate_date}`,
        title: 'Курс валют',
        buildItemUrl: (baseUrl, endpoint, id) => {
            const [currency, rate_date_string] = id.split('_');
            const dateObject = new Date(rate_date_string);
            const formattedDate = dateObject.toISOString().split('T')[0];
            return `${baseUrl}/${endpoint}?currency=${currency}&rate_date=${formattedDate}`;
        },
        columns: [
            { key: 'currency', label: 'Валюта', type: 'text', readonly: true },
            { key: 'rate_date', label: 'Дата', type: 'date', readonly: true},
            { key: 'price', label: 'Цена в рублях', type: 'text'}
        ]
    }
};