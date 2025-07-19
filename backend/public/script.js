document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = 'http://localhost:3000/api';

    let currentState = {
        config: null,
        selectedRowId: null,
        isEditing: false,
    };

    const mainContent = document.querySelector('.main-content');
    const viewTable = document.getElementById('view-table');
    const viewEditForm = document.getElementById('view-edit-form');
    let welcomeView = null;

    const tableTitle = document.getElementById('table-title');
    const thead = viewTable.querySelector('thead');
    const tbody = viewTable.querySelector('tbody');

    const formTitle = document.getElementById('form-title');
    const formFieldsContainer = document.getElementById('dynamic-form-fields');

    // Кнопки
    const navMainButton = document.getElementById('nav-main');
    const navDataButton = document.getElementById('nav-data');
    const resetSelectionButton = document.getElementById('reset-selection');
    const addButton = document.getElementById('add-row-button');
    const editButton = document.getElementById('edit-row-button');
    const deleteButton = document.getElementById('delete-row-button');
    const saveButton = document.getElementById('save-row-button');
    const cancelButton = document.getElementById('cancel-button');


    function createWelcomeView() {
        if (welcomeView) return;
        welcomeView = document.createElement('div');
        welcomeView.id = 'welcome-view';
        welcomeView.className = 'hidden';
        welcomeView.innerHTML = `
            <div class="welcome-content">
                <img src="timestop.svg" alt="Логотип" class="welcome-logo">
                <h2>Добро пожаловать, Агент Организации</h2>
                <p>«Контроль – основа порядка. Порядок – ключ к спасению.»</p>
                <p1>Ты находишься в закрытом банковском секторе Организации, где каждая операция имеет значение. 
                Здесь ведётся чёткий учёт ресурсов, отслеживаются финансовые потоки и принимаются решения, которые формируют будущее.</p1>
            </div>
        `;
        mainContent.appendChild(welcomeView);
    }

    function showWelcomeView() {
        viewTable.classList.add('hidden');
        viewEditForm.classList.add('hidden');
        welcomeView.classList.remove('hidden');
    }

    function showTableView() {
        welcomeView.classList.add('hidden');
        viewEditForm.classList.add('hidden');
        viewTable.classList.remove('hidden');

        const isReportView = currentState.config && currentState.config.isReport;
        addButton.style.display = isReportView ? 'none' : 'inline-block';
        document.getElementById('edit-and-delete').style.display = isReportView ? 'none' : 'flex';

        deselectAllRows();
    }

    async function showEditFormView(isEditing) {
        currentState.isEditing = isEditing;
        let data = {};
        if (isEditing) {
            if (!currentState.selectedRowId) return;
            try {
                const itemUrl = currentState.config.buildItemUrl(apiBaseUrl, currentState.config.endpoint, currentState.selectedRowId);
                const response = await fetch(itemUrl);
                if (!response.ok) throw new Error('Не удалось получить данные для редактирования.');
                data = await response.json();
            } catch (error) {
                console.error(error);
                alert(error.message);
                return;
            }
        }
        renderForm(currentState.config, data);
        welcomeView.classList.add('hidden');
        viewTable.classList.add('hidden');
        viewEditForm.classList.remove('hidden');
    }

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
            if (!config.isReport) {
                const pkValue = typeof config.primaryKey === 'function' ? config.primaryKey(item) : item[config.primaryKey];
                row.dataset.id = pkValue;
            }
            config.columns.forEach(col => {
                const td = document.createElement('td');
                let value = item[col.key] || '';
                if (col.type === 'date' && value) value = new Date(value).toLocaleDateString('ru-RU');
                if (col.type === 'number' && typeof value === 'string' && !isNaN(value)) {
                    value = parseFloat(value).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                } else if (typeof value === 'number') {
                    value = value.toLocaleString('ru-RU');
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
            if (col.readonly && !currentState.isEditing) return;
            const isReadonlyOnEdit = col.readonly && currentState.isEditing;
            const value = data[col.key] || '';
            const inputId = `edit-${col.key}`;
            let formattedValue = value;
            if (col.type === 'date' && value) formattedValue = new Date(value).toISOString().split('T')[0];
            const inputHtml = col.type === 'textarea'
                ? `<textarea id="${inputId}" name="${col.key}" ${isReadonlyOnEdit ? 'readonly' : ''}>${formattedValue}</textarea>`
                : `<input type="${col.type || 'text'}" id="${inputId}" name="${col.key}" value="${formattedValue}" ${isReadonlyOnEdit ? 'readonly' : ''}>`;
            formFieldsContainer.innerHTML += `<div class="form-field"><label for="${inputId}">${col.label}</label>${inputHtml}</div>`;
        });
    }

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

    async function loadReport() {
        const config = appConfig.financial_report;
        currentState.config = config;
        tableTitle.textContent = 'Идет обработка данных...';
        thead.innerHTML = '';
        tbody.innerHTML = '';
        try {
            const response = await fetch(`${apiBaseUrl}/process-financial-data`, {
                method: 'POST'
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при обработке данных');
            }
            const data = await response.json();
            renderTable(config, data);
            showTableView();
        } catch (error) {
            console.error('Ошибка при загрузке отчета:', error);
            alert(error.message);
            tableTitle.textContent = 'Ошибка';
        }
    }


    function deselectAllRows() {
        tbody.querySelector('tr.selected')?.classList.remove('selected');
        currentState.selectedRowId = null;
        updateActionButtons();
    }

    function updateActionButtons() {
        const hasSelection = currentState.selectedRowId !== null;
        editButton.disabled = !hasSelection;
        deleteButton.disabled = !hasSelection;
    }

    async function saveForm() {
        const config = currentState.config;
        const dataToSave = {};
        config.columns.forEach(col => {
            const input = formFieldsContainer.querySelector(`#edit-${col.key}`);
            if (input && !(col.readonly && currentState.isEditing)) {
                dataToSave[col.key] = input.value;
            }
        });
        const url = currentState.isEditing ? config.buildItemUrl(apiBaseUrl, config.endpoint, currentState.selectedRowId) : `${apiBaseUrl}/${config.endpoint}`;
        const method = currentState.isEditing ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Ошибка при сохранении: ${errorData.error || response.statusText}`);
            }
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
        if (!confirm(`Вы уверены, что хотите удалить запись с ID ${currentState.selectedRowId}?`)) return;
        try {
            const itemUrl = config.buildItemUrl(apiBaseUrl, config.endpoint, currentState.selectedRowId);
            const response = await fetch(itemUrl, { method: 'DELETE' });
            if (!response.ok) throw new Error(`Ошибка при удалении: ${response.statusText}`);
            const viewKey = Object.keys(appConfig).find(key => appConfig[key] === config);
            await switchView(viewKey);
        } catch (error) {
            console.error('Ошибка при удалении:', error);
            alert(error.message);
        }
    }

    function setActiveButton(button) {
        document.querySelector('.sidebar .nav-button.active')?.classList.remove('active');
        if (button) button.classList.add('active');
    }

    document.querySelectorAll('[data-view]').forEach(button => {
        button.addEventListener('click', (e) => {
            const viewName = e.target.dataset.view;
            if (viewName) {
                setActiveButton(e.target);
                switchView(viewName);
            }
        });
    });

    navMainButton.addEventListener('click', (e) => {
        setActiveButton(e.target);
        showWelcomeView();
    });

    navDataButton.addEventListener('click', (e) => {
        if (!confirm('Это действие пересчитает и обновит финансовые данные в базе. Продолжить?')) {
            return;
        }
        setActiveButton(e.target);
        loadReport();
    });

    resetSelectionButton.addEventListener('click', deselectAllRows);

    tbody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (!row || (currentState.config && currentState.config.isReport)) return;

        if (row.classList.contains('selected')) {
            deselectAllRows();
        } else {
            deselectAllRows();
            row.classList.add('selected');
            currentState.selectedRowId = row.dataset.id;
            updateActionButtons();
        }
    });

    addButton.addEventListener('click', () => showEditFormView(false));
    editButton.addEventListener('click', () => showEditFormView(true));
    deleteButton.addEventListener('click', deleteSelectedRow);
    saveButton.addEventListener('click', saveForm);
    cancelButton.addEventListener('click', showTableView);

    function init() {
        createWelcomeView();
        navMainButton.click();
    }

    init();
});