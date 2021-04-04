let info = [];
let searchBool = false;
const search = document.getElementById("search");
const searchResult = document.getElementById("search-result");
const searchOutput = document.getElementById("search-output");
const output = document.getElementById("display-output");
const submit = document.getElementById("span-div");
const select_one = document.getElementById('select1');
const select_two = document.getElementById('select2');

search.addEventListener("input", () => searchRes(search.value));

const searchRes = value => {
    searchBool = true;
    sFetch("load/search")
        .then(json => filter(json, value))
        .then(matches => showHtml(matches))
        .catch(reason => console.log(reason));
}

const filter = (json, value) => {
    let matches = json.filter(item => {
        const regex = new RegExp(value, 'gi');
        return item.name.match(regex);
    });

    if (value.length === 0 || matches.length === 0) {
        matches = [];
        searchOutput.style.display = "none";
    }
    return matches;
}

const displayOutput = (info, count) => {
    count = count || 1;
    let id = `output-${count}`;
    if (!document.getElementById(id)) {
        let string = `<ul class="output-grid" id="${id}"></ul>`;
        output.insertAdjacentHTML('beforeend', string);
    }

    const element = document.getElementById(id);
    for (let i = 0; i < 5; i++) {
        element.innerHTML += `<li class="remove ${id}" id="${info[i].info_id}">
                                            <img src="${info[i].image}" alt="">
                                       </li>`;
    }

    info = info.slice(5);
    if (info.length) displayOutput(info, count + 1);
}

const showHtml = matches => {
    if (matches.length > 0) {
        searchResult.innerHTML = matches.map(match => `
        <li class="searchRes" alt="${(match.type === 1 ? 'm' : 's') + match.tmdb_id}">
            <img class="info" src="${match.poster}">
            <span>${match.name}</span>
        </li>
        `).join('');

        searchOutput.style.display = "block";
    }
}

const buildPicks = response => {
    let string = '<option value="" disabled selected>Select your picks</option>';
    string += response.list.map(item => `
        <option value="${item}">${item}</option>
    `).join('');

    select_one.innerHTML = select_two.innerHTML = string;
    select_one.value = response.selected[0];
    select_two.value = response.selected[1];
}

$(document).on("click", ".remove", function (e) {
    let id = e.currentTarget.attributes["id"].nodeValue;

    for (let i = 0; i < info.length; i++)
        if (info[i].info_id === id) {
            info.splice(i, 1);
            break;
        }

    document.getElementById(id).remove();
});

$(document).on("click", ".searchRes", function (e) {
    let info_id = e.currentTarget.attributes["alt"].nodeValue;
    let image = e.currentTarget.childNodes[1].src;
    info.push({info_id, image});

    searchOutput.style.display = "none";
    output.innerHTML = '';
    displayOutput(info);
});

submit.onclick = async () => {
    let name = document.getElementById("name").value;
    let display = document.getElementById("info-name").value;
    if (name === "" && document.querySelectorAll('.remove').length) alert("Please enter a category");
    else {
        let blob = [];
        document.querySelectorAll('.remove').forEach(div => {
            blob.push(div.attributes["id"].nodeValue);
        })

        info = [];
        let selected = [{index: 0, name: select_one.value}, {index: 1, name: select_two.value}];
        let data = {name, display, blob, selected};

        data = JSON.stringify(data);
        output.innerHTML = '';
        document.getElementById("name").value = '';
        document.getElementById("info-name").value = '';
        data = await pFetch("update/category", data);
        buildPicks(data);
    }
}

async function sFetch(url) {
    return await fetch(url)
        .then(response => response.json())
        .then(data => {
            return data;
        })
        .catch(reason => console.log(reason));
}

async function pFetch(url, data) {
    return await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: data
    }).then(response => response.json())
        .then(data => {
            return data;
        })
        .catch(reason => console.log(reason));
}

window.onload = async () => {
    let response = await sFetch('update/getLists');
    buildPicks(response);
}

document.addEventListener("click", function (event) {
    if (!searchOutput.contains(event.target) && searchBool && !search.contains(event.target)) {
        searchOutput.style.display = "none";
        search.value = '';
        searchBool = false;
        search.blur();
    }
});