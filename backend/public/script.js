// Файл: script.js (Финальная универсальная версия)

document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = 'http://localhost:3000/api';

    // --- Глобальное состояние ---
    let currentState = {
        config: null,
        selectedRowId: null,
        isEditing: false,
    };

    // --- Элементы UI ---
    const viewTable = document.getElementById('view-table');
    const viewEditForm = document.getElementById('view-edit-form');
    const tableTitle = document.getElementById('table-title');
    const thead = viewTable.querySelector('thead');
    const tbody = viewTable.querySelector('tbody');
    const formTitle = document.getElementById('form-title');
    const formFieldsContainer = document.getElementById('dynamic-form-fields');

    // Кнопки
    const addButton = document.getElementById('add-row-button');
    const editButton = document.getElementById('edit-row-button');
    const deleteButton = document.getElementById('delete-row-button');
    const saveButton = document.getElementById('save-row-button');
    const cancelButton = document.getElementById('cancel-button');

    // --- ФУНКЦИИ ГЕНЕРАЦИИ UI ---

    function renderTable(config, data) {
        tableTitle.textContent = config.title;
        thead.innerHTML = '';
        tbody.innerHTML = '';

        const headerRow = document.createElement('tr');
        config.columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.label;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        data.forEach(item => {
            const row = document.createElement('tr');
            row.dataset.id = item[config.primaryKey];

            config.columns.forEach(col => {
                const td = document.createElement('td');
                let value = item[col.key] || '';
                if (col.type === 'date' && value) {
                    value = new Date(value).toLocaleDateString('ru-RU');
                }
                td.textContent = value;
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
    }

    function renderForm(config, data = {}) {
        formTitle.textContent = currentState.isEditing ? `Изменение: ${config.title}` : `Добавление: ${config.title}`;
        formFieldsContainer.innerHTML = '';

        config.columns.forEach(col => {
            const isReadonly = col.readonly && currentState.isEditing;
            const value = data[col.key] || '';
            const inputId = `edit-${col.key}`;

            let formattedValue = value;
            if (col.type === 'date' && value) {
                formattedValue = new Date(value).toISOString().split('T')[0];
            }

            const inputHtml = col.type === 'textarea'
                ? `<textarea id="${inputId}" name="${col.key}" ${isReadonly ? 'readonly' : ''}>${formattedValue}</textarea>`
                : `<input type="${col.type}" id="${inputId}" name="${col.key}" value="${formattedValue}" ${isReadonly ? 'readonly' : ''}>`;

            formFieldsContainer.innerHTML += `
                <div class="form-field">
                    <label for="${inputId}">${col.label}</label>
                    ${inputHtml}
                </div>`;
        });
    }

    // --- УПРАВЛЕНИЕ ВИДАМИ ---

    function showTableView() {
        viewEditForm.classList.add('hidden');
        viewTable.classList.remove('hidden');
        deselectAllRows();
    }

    async function showEditForm(isEditing) {
        currentState.isEditing = isEditing;
        let data = {};

        if (isEditing) {
            if (!currentState.selectedRowId) return;
            try {
                const response = await fetch(`${apiBaseUrl}/${currentState.config.endpoint}/${currentState.selectedRowId}`);
                if (!response.ok) throw new Error('Не удалось получить данные для редактирования.');
                data = await response.json();
            } catch (error) {
                console.error(error);
                alert(error.message);
                return;
            }
        }

        renderForm(currentState.config, data);
        viewTable.classList.add('hidden');
        viewEditForm.classList.remove('hidden');
    }

    // --- УПРАВЛЕНИЕ СОСТОЯНИЕМ ---

    async function switchView(viewName) {
        const config = appConfig[viewName];
        if (!config) return;

        currentState.config = config;

        try {
            const response = await fetch(`${apiBaseUrl}/${config.endpoint}`);
            const data = await response.json();
            renderTable(config, data);
            showTableView();
        } catch (error) {
            console.error(`Ошибка при загрузке данных для "${config.title}":`, error);
        }
    }

    function deselectAllRows() {
        const selectedRow = tbody.querySelector('tr.selected');
        if (selectedRow) {
            selectedRow.classList.remove('selected');
        }
        currentState.selectedRowId = null;
        updateActionButtons();
    }

    function updateActionButtons() {
        editButton.disabled = currentState.selectedRowId === null;
        deleteButton.disabled = currentState.selectedRowId === null;
    }

    // --- ОБРАБОТЧИКИ CRUD ---

    async function saveForm() {
        const config = currentState.config;
        const dataToSave = {};

        config.columns.forEach(col => {
            const input = formFieldsContainer.querySelector(`#edit-${col.key}`);
            if (input && !(col.readonly && currentState.isEditing)) {
                dataToSave[col.key] = input.value;
            }
        });

        const url = currentState.isEditing
            ? `${apiBaseUrl}/${config.endpoint}/${currentState.selectedRowId}`
            : `${apiBaseUrl}/${config.endpoint}`;

        const method = currentState.isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });
            if (!response.ok) throw new Error(`Ошибка при сохранении: ${response.statusText}`);

            // Получаем ключ текущего вида (например, 'accounts') для перезагрузки
            const viewKey = Object.keys(appConfig).find(key => appConfig[key] === config);
            await switchView(viewKey);
        } catch (error) {
            console.error('Ошибка при сохранении:', error);
            alert(error.message);
        }
    }

    async function deleteSelectedRow() {
        if (!currentState.selectedRowId) return;
        const config = currentState.config;

        if (!confirm(`Вы уверены, что хотите удалить запись с ID ${currentState.selectedRowId} из таблицы "${config.title}"?`)) return;

        try {
            const response = await fetch(`${apiBaseUrl}/${config.endpoint}/${currentState.selectedRowId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error(`Ошибка при удалении: ${response.statusText}`);

            const viewKey = Object.keys(appConfig).find(key => appConfig[key] === config);
            await switchView(viewKey);
        } catch (error) {
            console.error('Ошибка при удалении:', error);
            alert(error.message);
        }
    }

    // --- НАЗНАЧЕНИЕ ОБРАБОТЧИКОВ ---

    document.querySelectorAll('.sidebar-nav .nav-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const viewName = e.target.dataset.view;
            if (viewName) {
                document.querySelector('.sidebar-nav .nav-button.active')?.classList.remove('active');
                e.target.classList.add('active');
                switchView(viewName);
            }
        });
    });

    tbody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (!row) return;

        if (row.classList.contains('selected')) {
            deselectAllRows();
        } else {
            deselectAllRows();
            row.classList.add('selected');
            currentState.selectedRowId = row.dataset.id;
            updateActionButtons();
        }
    });

    addButton.addEventListener('click', () => showEditForm(false)); // false - значит "добавление"
    editButton.addEventListener('click', () => showEditForm(true));  // true - значит "редактирование"
    deleteButton.addEventListener('click', deleteSelectedRow);
    saveButton.addEventListener('click', saveForm);
    cancelButton.addEventListener('click', showTableView);

    // --- ИНИЦИАЛИЗАЦИЯ ---
    switchView('accounts'); // Загружаем "Счета" по умолчанию
});