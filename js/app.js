function renderHeader(columns, headerRow) {
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.title;
        headerRow.append(th);
    });
}

async function renderBody(config, tableBody) {
    tableBody.innerHTML = '';
    const response = await fetch(config.apiUrl);
    if (!response.ok) {
        throw new Error(`Something went wrong :)`)
    }
    const data = await response.json();

    Object.entries(data.data)
        .map(([key, value]) => ({id: key, ...value}))
        .forEach(item => {
            const tr = document.createElement('tr');
            config.columns.forEach(col => {
                const td = document.createElement('td');
                let tdContent;
                if (col.title === 'Дії') {
                    tdContent = createRemoveButton(config, item.id, tableBody);
                } else {
                    tdContent = typeof col.value === 'function' ? col.value(item) : item[col.value];
                }

                if (tdContent instanceof HTMLElement) {
                    td.appendChild(tdContent);
                } else {
                    td.innerHTML = tdContent;
                }
                tr.append(td);
            });
            tableBody.append(tr);
        });
}

function DataTable(config) {
    const parentContainer = document.querySelector(config.parent);

    const table = document.createElement('table');
    const tableHeader = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const tableBody = document.createElement('tbody');

    renderHeader(config.columns, headerRow);
    renderBody(config, tableBody);

    tableHeader.appendChild(headerRow);
    table.append(tableHeader, tableBody);
    parentContainer.appendChild(table);
}

function getAge(birthday) {
    const currentDate = new Date();
    const birth = new Date(birthday);
    let age = currentDate.getFullYear() - birth.getFullYear();
    const month = currentDate.getMonth() - birth.getMonth();
    if (month < 0) {
        age--;
    }
    const lastDigit = age % 10;
    const lastTwoDigits = age % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return `${age} років`;
    }

    return `${age} ${lastDigit === 1 ? ' рік' : (lastDigit < 5 && lastDigit > 0 ? ' роки' : ' років')}`;
}

function getColorLabel(color) {
    const result = document.createElement('div');
    result.style.width = '50px';
    result.style.height = '50px';
    result.style.backgroundColor = color;
    return result;
}

async function deleteItem(config, id, tableBody) {
    const response = await fetch(`${config.apiUrl}/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error(`Resource with id: ${id} is not exists`);
    }
    renderBody(config, tableBody);
}

function createRemoveButton(config, id, tableBody) {
    const button = document.createElement('button');
    button.innerText = 'Видалити';
    button.classList.add('button', 'button-red');
    button.addEventListener('click', () => deleteItem(config, id, tableBody));
    return button;
}

function createAddButton(config) {
    const parentContainer = document.querySelector(config.parent);
    const button = document.createElement('button');
    const modalWindow = document.querySelector(`${config.parent} #modal`);
    button.textContent = 'Додати запис до таблиці';
    button.classList.add('button', 'button-green');
    parentContainer.appendChild(button);

    button.addEventListener('click', () => {
        modalWindow.style.display = 'flex';
    });
}

function createInputWindow(config) {
    const parent = document.querySelector(config.parent);
    const modal = document.createElement('div');
    modal.innerHTML = '';
    modal.className = 'modal';
    modal.id = 'modal';
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    config.columns.forEach(col => {
        if (col.input) {
            const inputData = Array.isArray(col.input) ? col.input : [col.input];
            inputData.forEach(inp => {
                let input;
                if (inp.type === 'select') {
                    input = document.createElement('select');
                    inp.options.forEach(o => {
                        const option = document.createElement('option');
                        option.value = o;
                        option.textContent = o;
                        input.appendChild(option);
                    });
                } else {
                    input = document.createElement('input');
                }
                const label = document.createElement('label');
                input.type = inp.type;
                input.name = inp.name || col.value;
                input.required = inp.required !== false;
                label.htmlFor = input.name;
                label.textContent = inp.label || col.title;
                const br = document.createElement('br');

                modalContent.append(label, input, br);
                input.addEventListener('keydown', (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        validateAndSubmit();
                    }
                });
            });
        }
    });

    const enter = document.createElement('button');
    enter.textContent = 'Enter';
    enter.classList.add('button', 'button-green');
    const close = document.createElement('button');
    close.textContent = 'Close';
    close.classList.add('button', 'button-red');
    const br = document.createElement('br');

    modalContent.append(enter, br, close);
    modal.appendChild(modalContent);
    parent.appendChild(modal);

    enter.addEventListener('click', () => {
        validateAndSubmit();
    });

    function validateAndSubmit() {
        let isValid = true;
        const inputs = modal.querySelectorAll('input, select');
        inputs.forEach(i => {
            if (!i.value.trim()) {
                i.style.border = "2px solid red";
                isValid = false;
            } else {
                i.style.border = "";
            }
        });
        if (isValid) {
            const payload = {};
            inputs.forEach(i => {
                payload[i.name] = i.type === 'number' ? parseInt(i.value) : i.value;
                console.log(`${i.name} = ${i.value}`);
            });
            fetch(config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }).then(response => {
                if (response.ok) {
                    renderBody(config, document.querySelector(`${config.parent} table tbody`));
                }
            }).catch(error => {
                console.log(error);
            });
        }
    }
    modal.style.display = 'none';

    close.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}


const config1 = {
    parent: '#usersTable',
    columns: [
        {
            title: 'Ім’я',
            value: 'name',
            input: {
                type: 'text'
            }
        },
        {
            title: 'Прізвище',
            value: 'surname',
            input: {
                type: 'text'
            }
        },
        {
            title: 'Вік',
            value: (user) => getAge(user.birthday),
            input: {
                type: 'date',
                name: 'birthday'
            }
        },
        {
            title: 'Фото',
            value: (user) => `<img src="${user.avatar}" alt="${user.name} ${user.surname}"/>`,
            input: {
                type: 'url',
                name: 'avatar'
            }
        },
        {
            title: 'Дії',
            value: (user) => createRemoveButton(user.id)
        },
    ],
    apiUrl: "https://mock-api.shpp.me/odavydiuk/users"
};

const config2 = {
    parent: '#productsTable',
    columns: [
        {
            title: 'Назва',
            value: 'title',
            input: {
                type: 'text'
            }
        },
        {
            title: 'Ціна',
            value: (product) => `${product.price} ${product.currency}`,
            input: [
                {
                    type: 'number',
                    name: 'price',
                    label: 'Ціна'
                },
                {
                    type: 'select',
                    name: 'currency',
                    label: 'Валюта',
                    options: [
                        '$', '€', '₴'
                    ],
                    required: false
                }
            ]
        },
        {
            title: 'Колір',
            value: (product) => getColorLabel(product.color),
            input: {
                type: 'color',
                name: 'color'
            }
        },
        {
            title: 'Дії',
            value: (product) => createRemoveButton(product.id)
        },
    ],
    apiUrl: "https://mock-api.shpp.me/odavydiuk/products"
};

createInputWindow(config1);
createAddButton(config1);
DataTable(config1);

createInputWindow(config2);
createAddButton(config2);
DataTable(config2);
