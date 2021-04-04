async function sFetch(url) {
    return await fetch(url)
        .then(response => response.json())
        .then(data => {
            return data;
        })
        .catch(reason => console.log(reason));
}

const result = document.getElementById("result");
let libType;
let localX;
let nullBack;
let name;
let year;
let autoScan = false;
let config;
let backup = [];
const title = document.getElementById("title-text");
const tmdb = document.getElementById("tmdb_id");
const getRec = document.getElementById("info_id");
const nextDown = document.getElementById("nextDown");
const suggest = document.getElementById("suggest");
const magnet = document.getElementById("magnet");
const editor = document.getElementById("editor");
const hide = document.getElementById("hide");
const subs = document.getElementById("subs");
const deleteEntry = document.getElementById("delete");
const manual = {
    block: document.getElementById("manual"),
    done: document.getElementById("manual-done"),
    name: document.getElementById("manual-name"),
    overview: document.getElementById("manual-overview"),
    id: document.getElementById("manual-id"),
    poster: {
        input: document.getElementById("poster"),
        image: document.getElementById("poster-img")
    },
    logo: {
        input: document.getElementById("logo"),
        image: document.getElementById("logo-img")
    },
    backdrop: {
        input: document.getElementById("backdrop"),
        image: document.getElementById("backdrop-img")
    }
}

Array.prototype.sortKey = function (key, asc) {
    return this.sort(function (a, b) {
        let x = a[key];
        let y = b[key];
        return asc ? ((x < y) ? -1 : ((x > y) ? 1 : 0)) : ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
}

Array.prototype.search = function (value) {
    let temp = this.sortKey('popularity', false);
    temp = temp.filter(item => item.name.toLowerCase().startsWith(value.toLowerCase()));
    let a = temp.concat(this);
    for (let i = 0; i < a.length; ++i) {
        for (let j = i + 1; j < a.length; ++j) {
            if ((a[i].name === a[j].name) && (a[i].tmdb_id === a[j].tmdb_id))
                a.splice(j--, 1);
        }
    }

    return a;
}

$("#movie").on("click", async () => {
    libType = "movie";
    hide.style.display = 'none';
    title.innerText = 'scanning...';
    let response = await sFetch("update/scan/movie");
    result.style.display = "block";
    manual.block.style.display = "none";
    await explode(response);
});

$("#tv").on("click", async () => {
    libType = "tv";
    title.innerText = 'scanning...';
    hide.style.display = 'none';
    let response = await sFetch("update/scan/tv");
    result.style.display = "block";
    manual.block.style.display = "none";
    await explode(response);
});

$("#update-db").on("click", async () => {
    let bool = !confirm('Would you like to perform a thorough scan?')
    flash('scanning episodes library');
    await sFetch("update/database/" + bool);
});

$("#auto").on("click", async () => {
    autoScan = !autoScan;
    flash('auto scan ' + (autoScan ? "" : 'de') + "activated");
});

$("#null").on("click", async () => {
    if (nullBack.id !== undefined){
        let response = await sFetch('update/art/' + (libType === 'movie' ? 1 : 0) + '/' + nullBack.id);
        manualEntry(response.nino, nullBack.name, nullBack.id, nullBack.overview);
    } else alert('please select a tmdb entry to proceed');
});

const explode = async data => {
    if (data !== false) {
        year = parseInt(`${data.year}`);
        localX = data.link;
        name = data.name;
        nullBack = {name};
        title.innerText = data.name + ': ' + year;
        let type = libType === "movie" ? 1 : 0;
        data = await sFetch("update/search/" + type + "/" + data.name);
        handleDo(data);
    } else {
        result.innerHTML = '';
        title.innerText = libType + " library scan complete";
        if (config.magnet)
            hide.removeAttribute('style');
    }
};

const handleDo = objectList => {
    let din = objectList.results;
    if (libType === "movie") {
        result.innerHTML = din.map(item => `
            <li class="target" overview="${item.overview}" name="${item.title}" id="${item.id}">
                  <img src="https://image.tmdb.org/t/p/original/${item.backdrop_path}" alt="" class="image">
                  <div>
                      <span class="name">${item.title}</span>
                      <p class="overview">${item.overview}</p>
                  </div>
              </li>
          `).join('');
    } else {
        result.innerHTML = din.map(item => `
            <li class="target" overview="${item.overview}" name="${item.name}" id="${item.id}">
                <img src="https://image.tmdb.org/t/p/original/${item.backdrop_path}" alt="" class="image">
                <div>
                    <span class="name">${item.name}</span>
                    <p class="overview">${item.overview}</p>
                </div>
            </li>
            `).join('');
    }

    setTimeout(async () => {
        if (autoScan) {
            if (din.length === 0)
                title.innerText = 'Unable to find ' + name + ' on TMDB';

            if (din.length === 1) {
                din = din[0];
                await consolidate(libType === "movie" ? din.title : din.name, din.overview, din.id, 1);

            } else if (libType === "movie") {
                for (const item of din)
                    if ((year !== false && !(new Date(item.release_date).getFullYear() === year || item.title === name)) || item.backdrop_path === null)
                        document.getElementById(`${item.id}`).remove();

                let list = document.querySelectorAll('.target');
                if (list.length > 1) {
                    for (const e of list) {
                        let item = din.find(file => file.id === parseInt(e.attributes.id.nodeValue));
                        if (year !== false && !(new Date(item.release_date).getFullYear() === year && item.title === name))
                            document.getElementById(`${item.id}`).remove();

                    }
                    list = document.querySelectorAll('.target');
                }

                if (list.length === 1)
                    list[0].click();

                else if (list.length === 0) {
                    title.innerText = 'waiting for ' + name + "'s TMDB_ID";
                    if (libType === "movie")
                        result.innerHTML = din.map(item => `
                        <li class="target" overview="${item.overview}" name="${item.title}" id="${item.id}">
                              <img src="https://image.tmdb.org/t/p/original/${item.backdrop_path}" alt="" class="image">
                              <div>
                                  <span class="name">${item.title}</span>
                                  <p class="overview">${item.overview}</p>
                              </div>
                          </li>
                      `).join('');
                    else
                        result.innerHTML = din.map(item => `
                        <li class="target" overview="${item.overview}" name="${item.name}" id="${item.id}">
                            <img src="https://image.tmdb.org/t/p/original/${item.backdrop_path}" alt="" class="image">
                            <div>
                                <span class="name">${item.name}</span>
                                <p class="overview">${item.overview}</p>
                            </div>
                        </li>
                        `).join('');
                }
            }
        }
    }, 100)
}

$(document).on("click", ".target", async e => {
    let name = e.currentTarget.attributes["name"].nodeValue;
    let overview = e.currentTarget.attributes["overview"].nodeValue;
    let id = e.currentTarget.attributes["id"].nodeValue;
    let response = await sFetch('update/notPresent/' + (libType === 'movie' ? 'm' : 's') + id);
    if (response.absent)
        await consolidate(name, overview, id);

    else {
        let bool = confirm('movie already exists on database, do you wish to replace it?');
        if (bool) {
            await sFetch('update/delete/' + response.location + '/' + libType);
            await consolidate(name, overview, id);
        } else {
            response = await sFetch('update/delete/' + localX + '/' + libType);
            await explode(response);
        }
    }
});

const consolidate = async (name, overview, id) => {
    nullBack = {name: name, overview: overview, id: id};
    let response = await sFetch('update/art/' + (libType === 'movie' ? 1 : 0) + '/' + id);
    if (response.apple.length)
        encode(response.apple, name, overview, id);
    else
        manualEntry(response.nino, name, id, overview);
}

const manualEntry = (response, name, id, overview) => {
    result.style.display = "none";
    manual.block.style.display = "block";
    manual.name.innerText = name;
    manual.overview.innerText = overview;
    manual.id.innerText = id;
    manual.poster.input.value = manual.poster.image.src = response.poster;
    manual.logo.input.value = manual.logo.image.src = response.logo;
    manual.backdrop.input.value = manual.backdrop.image.src = response.backdrop;

    setTimeout(() => {
        if (manual.backdrop.input.value !== '' && manual.poster.input.value !== '' && autoScan) {
            manual.done.click();
        }
    }, 100)
}

const encode = (res, name, overview, id) => {
    backup = res;
    result.innerHTML = res.map((obj, i) => `
            <li class="resolve" name="${obj.name}" data-id="${id}" id="${i}">
                <img src="${obj.poster}" alt="" class="image">
                <div>
                    <span class="name">${obj.name}</span>
                    <p class="overview">${overview}</p>
                </div>
            </li>
        `).join('');

    setTimeout(() => {
        if (autoScan) {
            let list = document.querySelectorAll('.resolve');
            if (backup.length === 1 && name === backup[0].name)
                list[0].click();

            else {
                for (let i = 0; i < backup.length; i++)
                    if (name !== backup[i].name)
                        document.getElementById(`${i}`).remove();

                let list_do = document.querySelectorAll('.resolve');
                if (list_do.length > 1)
                    title.innerText = 'Choose appropriate image for ' + name;

                if (list_do.length === 1)
                    setTimeout(() => {
                        list_do[0].click();
                    }, 100);

                else if (list_do.length === 0) {
                    result.innerHTML = res.map((obj, i) => `
                        <li class="resolve" name="${obj.name}" data-id="${id}" id="${i}">
                            <img src="${obj.poster}" alt="" class="image">
                            <div>
                                <span class="name">${obj.name}</span>
                                <p class="overview">${overview}</p>
                            </div>
                        </li>
                    `).join('');
                }
            }
        }
    }, 100)
}

$(document).on("click", ".search", async (e) => {
    let id = e.currentTarget.attributes["id"].nodeValue;
    let response = await sFetch('update/itemSuggestion/' + id);

    result.innerHTML = response.map(item => `
            <li class="suggest" overview="${item.overview}" name="${item.name}" id="${item.tmdb_id}">
                <img src="${item.backdrop}" alt="" class="image">
                <div>
                    <span class="name">${item.name}</span>
                    <p class="overview">${item.overview}</p>
                </div>
            </li>
            `).join('');
})

$(document).on("click", ".suggest", async (e) => {
    let id = e.currentTarget.attributes["id"].nodeValue;
    let result = await sFetch('update/magnet/' + id);
    alert(result);
})

$(document).on("click", ".resolve", async (e) => {
    let id = e.currentTarget.attributes["id"].nodeValue;
    let tmdb_id = e.currentTarget.attributes["data-id"].nodeValue;
    let temp = backup[parseInt(id)];
    const object = {...temp, ...{id: parseInt(tmdb_id), type: libType, gid: localX}}

    submit(object);
});

$(document).on("click", ".person", async (e) => {
    let id = e.currentTarget.attributes["id"].nodeValue;
    let response = await sFetch('update/getPerson/' + id);
    result.innerHTML = response.videography.map(item => `
        <li class="suggest" overview="${item.overview}" name="${item.name}" id="${item.tmdb_id}">
            <img src="${item.backdrop}" alt="" class="image">
            <div>
                <span class="name">${item.name}</span>
                <p class="overview">${item.overview}</p>
            </div>
        </li>
    `).join('');
});

const submit = object => {
    let bool = autoScan ? true : confirm("Do you wish to add this");
    if (bool) {
        result.innerHTML = '';
        title.innerText = 'scanning...';
        const data = JSON.stringify(object);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "update/item");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(data);

        xhr.onload = async function () {
            try {
                let response = JSON.parse(this.responseText);
                await explode(response);
            } catch (e) {
                console.log(e);
            }
        }
    }
}

const flash = message => {
    let temp = title.innerText;
    title.innerText = message;
    setTimeout(() => {
        title.innerText = temp
    }, 500);
}

manual.poster.input.onkeyup = () => {
    manual.poster.image.src = manual.poster.input.value;
}

manual.backdrop.input.onkeyup = () => {
    manual.backdrop.image.src = manual.backdrop.input.value;
}

manual.logo.input.onkeyup = () => {
    manual.logo.image.src = manual.logo.input.value;
}

manual.done.onclick = () => {
    result.style.display = "block";
    manual.block.style.display = "none";

    const object = {
        "name": manual.name.innerText,
        "poster": manual.poster.input.value,
        "backdrop": manual.backdrop.input.value,
        "logo": manual.logo.input.value,
        "id": manual.id.innerText,
        "type": libType,
        "gid": localX
    }

    submit(object);
}

tmdb.onclick = async () => {
    if (libType !== undefined) {
        let tmdb_id = prompt("Enter tmdb_id", "");
        let {name, overview, id} = await sFetch("update/get/" + libType + "/" + tmdb_id);
        nullBack = {name, overview, id};
        await consolidate(name, overview, id, 1);
    } else alert("select a library type");
}

getRec.onclick = async () => {
    let response;
    let check = confirm('are you looking for a person or media, media[true], person[false]');
    let name = prompt("Enter name", "");
    if (check){
        response = await sFetch("update/search/" + 0 + "/" + name);
        let tv = response.results.filter(item => item.backdrop_path !== null).map(item => {
            return {
                backdrop: "https://image.tmdb.org/t/p/original" + item.backdrop_path,
                name: item.name,
                overview: item.overview,
                tmdb_id: 's' + item.id,
                popularity: item.popularity
            }
        })
        response = await sFetch("update/search/" + 1 + "/" + name);
        let movie = response.results.filter(item => item.backdrop_path !== null).map(item => {
            return {
                backdrop: "https://image.tmdb.org/t/p/original" + item.backdrop_path,
                name: item.title,
                overview: item.overview,
                tmdb_id: 'm' + item.id,
                popularity: item.popularity
            }
        })
        response = movie.concat(tv).search(name)
        result.innerHTML = response.map(item => `
            <li class="search" overview="${item.overview}" name="${item.name}" id="${item.tmdb_id}">
                <img src="${item.backdrop}" alt="" class="image">
                <div>
                    <span class="name">${item.name}</span>
                    <p class="overview">${item.overview}</p>
                </div>
            </li>
            `).join('');
    } else {
        response = await sFetch("update/findPerson/" + name);
        result.innerHTML = response.map(item => `
            <li class="person" id="${item.id}">
                <img src="${item.image}" alt="" class="face">
                <div>
                    <span class="name">${item.name}</span>
                    <p class="overview">${item.known_for}</p>
                </div>
            </li>
        `).join('');
    }
}

const aller = string => window.location.href = window.location.href + 'update/' + string;
const reach = async location => sFetch('update/' + location)
    .then(response => flash(response));

window.onload = async () => {
    config = await sFetch('update/configuration');
    if (config.magnet)
        hide.style.display = 'block';
    else
        hide.style.display = 'none';

    if (config.subs)
        subs.style.display = 'block';
    else
        subs.style.display = 'none';
}

subs.onclick = async () => {
    let val = confirm('scan all subs or missing subs ? all[TRUE]; missing[FALSE]')
    await reach('forceScan/' + val);
}

nextDown.onclick = async () => {
    let val = confirm('scan for just new episodes or seasons and episodes ? episodes[TRUE], all[FALSE]')
    await reach('seasonScan/' + val);
}

title.onclick = () => {
    let val = confirm('do you wish to leave the page ?')
    if (val)
        window.location.reload();
}

suggest.onclick = () => reach('suggest');
magnet.onclick = () => aller('magnet');
editor.onclick = () => aller('editor');
deleteEntry.onclick = async () => {
    let info = confirm('would you like to delete ' + nullBack.name + '?')
    if (info) {
        flash(nullBack.name + 'has been deleted');
        let response = await sFetch('update/delete/' + localX + '/' + libType);
        result.style.display = "block";
        manual.block.style.display = "none";
        await explode(response);
    }
}