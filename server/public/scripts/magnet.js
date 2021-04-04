let libType;
let auto = false;
const output = document.getElementById("display-output");
const title = document.getElementById("title-text");
const submit = document.getElementById('submit');

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

const displayOutput = (info, count) => {
    count = count || 1;
    let id = `output-${count}`;
    if (!document.getElementById(id)) {
        let string = `<ul class="output-grid" id="${id}"></ul>`;
        output.insertAdjacentHTML('beforeend', string);
    }

    const element = document.getElementById(id);
    for (let i = 0; i < 5; i++) {
        element.innerHTML += `<li class="remove" id="${(info[i].type === 1 ? 'm' : 's') + info[i].tmdb_id}" name="${info[i].name}">
                                        <img src="${info[i].poster}" alt="">
                                   </li>`;
    }

    info = info.slice(5);
    if (info.length) displayOutput(info, count + 1);
    else if (info.length === 0 && auto) document.querySelectorAll('.remove').forEach(item => {
        item.click();
    })

}

$(document).on("click", ".remove", async function (e) {
    let id = e.currentTarget.attributes.id.nodeValue;
    let name = e.currentTarget.attributes.name.nodeValue;
    let type = libType === "movies" ? "movie/" : "tv/";
    title.innerText = name;

    let bool = auto;

    if (!auto) {
        let {overview} = await sFetch("update/get/" + type + id.replace(/m|s/, ''));
        bool = confirm(overview);
    }

    if (bool) {
        let result = await sFetch('update/magnet/' + id);
        let css_class = result === 'downloading' ? 'added' : 'failed';
        document.getElementById(id).setAttribute("class", css_class);
        if (result === 'downloading')
            await sFetch('update/magnet/opened/' + id);

    } else
        title.innerText = 'nino';
});

$(document).on("click", ".added", function (e) {
    let id = e.currentTarget.attributes["id"].nodeValue;
    document.getElementById(id).setAttribute("class", 'remove');
});

$(document).on("click", ".failed", function (e) {
    let id = e.currentTarget.attributes["id"].nodeValue;
    document.getElementById(id).setAttribute("class", 'remove');
});

$(document).on("click", ".reset", async function (e) {
    let id = e.currentTarget.attributes["id"].nodeValue;
    let check = await sFetch('update/magnet/reset/' + id);
    libType = id;

    if (id === 'movies')
        auto = confirm('would you like to auto download everything');
    else
        auto = false;

    if (check) {
        let info = await sFetch('update/magnet/showSuggestion');
        output.innerHTML = '';
        displayOutput(info);
    }
});

submit.onclick = async () => {
    let info = await sFetch('update/magnet/showSuggestion');
    output.innerHTML = '';
    displayOutput(info);
}