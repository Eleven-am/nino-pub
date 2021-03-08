let images = undefined;
let searchImg = false;
let searchTimer;

const search = {
    bool: false,
    doneTyping: null,
    input: document.getElementById("search-input"),
    result: document.getElementById("search-result"),
    output: document.getElementById("search-output")
}

const login_img = document.getElementById('login-img');

Array.prototype.search = function (needle, value) {
    let temp = this.filter(item => item[needle].toLowerCase().startsWith(value.toLowerCase()));
    let a = temp.concat(this);
    for (let i = 0; i < a.length; ++i) {
        for (let j = i + 1; j < a.length; ++j) {
            if (a[i][needle] === a[j][needle])
                a.splice(j--, 1);
        }
    }

    return a;
}

document.oncontextmenu = (e) => {
    e.preventDefault();
}
window.ondragstart = function () {
    return false;
}

const sFetch = async url => {
    return new Promise(resolve => {
        fetch(url)
            .then(response => resolve(response.json()))
    }).catch(err => console.error(err))
}

const prepAuth = async () => {
    images = await sFetch('load/authImages');
    animateAuth();
}

const animateAuth = () => {
    if (!searchImg) {
        login_img.innerHTML = images.map((link, i) =>
            `<img src="${link}" id="img-${i}" class="${i === 3 || i === 2 ? i === 2 ? "fade_img" : "glow_img" : ""}">`
        ).join('');

        let temp = images[0];
        images.shift();
        images.push(temp);
        setTimeout(() => {
            animateAuth();
        }, 5000)
    }
}

window.onload = async () => {
    if (localStorage.getItem("app_id") !== null) {
        let app_id = localStorage.getItem("app_id");
        let response = await pFetch('auth/authenticateApp_id', {auth: app_id});
        if (response === true) window.location.reload();
        else localStorage.removeItem('app_id');
    }
    await prepAuth();
}

const validateEmail = email => {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

const loadCreate = () => {
    let input = document.getElementById("log-input").value;
    document.getElementById("log-label").removeAttribute("style");
    document.getElementById("log-input").remove();
    document.getElementById("log-pass").remove();
    document.getElementById("log-input-div").setAttribute("id", "create-acc-div");
    document.getElementById("log-label").innerText = "create an account";

    let string = `
            <div id="create-flex">
                <div class="create-holders">
                    <label for="authKey">auth key</label>
                    <br>
                    <input id="authKey" type="text" placeholder="enter an auth key">
                    <br>
                    <label for="create-pass">password</label>
                    <br>
                    <input id="create-pass" type="password" placeholder="enter your password">
                </div>
                <div class="create-holders">
                    <label for="create-email">email address</label>
                    <br>
                    <input id="create-email" type="text" placeholder="enter your email address">
                    <br>
                    <label for="confirm-pass">confirm password</label>
                    <br>
                    <input id="confirm-pass" type="password" placeholder="confirm your password">
                </div>
            </div>`;

    document.getElementById("hook").insertAdjacentHTML("afterend", string);
    document.getElementById("log-submit").setAttribute("data-id", "create");
    $('#create-email').val(input);
}

const loadPass = () => {
    document.getElementById("log-label").removeAttribute("style");
    document.getElementById("log-input").setAttribute("id", "temp");
    document.getElementById("log-pass").setAttribute("id", "log-input");
    document.getElementById("temp").setAttribute("id", "log-pass");
    document.getElementById("log-label").innerText = "enter your password";
    document.getElementById("log-submit").setAttribute("data-id", "password");
}

$(document).on("click", "#log-submit", async () => {
    let type = $('#log-submit').attr('data-id');
    if (type === "email" || type === "password") {
        let input = $('#log-input').val();

        if (type === 'email') {
            if (validateEmail(input)) {

                $('#log-input-div').addClass('fade_input');
                document.getElementById("log-loader").style.opacity = "1";
                document.getElementById("log-loader").style.zIndex = "999";

                setTimeout(async () => {
                    let check = await pFetch('auth/confirmEmail', {email: input});

                    if (check) {
                        loadPass();
                        setTimeout(() => {
                            $('#log-input-div').addClass('glow_input');
                            document.getElementById("log-loader").style.opacity = "0";
                            document.getElementById("log-loader").style.zIndex = "-99999";
                        }, 500)

                    } else {
                        loadCreate();
                        setTimeout(() => {
                            document.getElementById("log-loader").style.opacity = "0";
                            document.getElementById("log-loader").style.zIndex = "-99999";
                            $('#create-acc-div').addClass('glow_input');
                            $("#submit-width").css('width', "40%");
                        }, 500)

                    }
                }, 100)
            } else {
                document.getElementById("log-label").innerText = "enter a valid email address";
                document.getElementById("log-input").style.borderColor = "rgba(245, 78, 78, .9)";
                document.getElementById("log-label").style.color = "rgba(245, 78, 78, .9)";
            }
        } else {
            let obj = {
                user: document.getElementById("log-pass").value,
                pass: document.getElementById("log-input").value
            }

            let response = await pFetch('auth/login', obj);
            if (response.hasOwnProperty('status') && response.hasOwnProperty('app_id')) {
                document.getElementById('log-input-div').setAttribute('class', 'fade_input');
                document.getElementById("log-loader").style.opacity = "1";
                document.getElementById("log-loader").style.zIndex = "999";
                setTimeout(() => {
                    localStorage.setItem("app_id", response.app_id);
                    window.location.reload();
                }, 500)

            } else {
                document.getElementById("log-label").innerText = response;
                document.getElementById("log-input").style.borderColor = "rgba(245, 78, 78, .9)";
                document.getElementById("log-label").style.color = "rgba(245, 78, 78, .9)";
            }
        }

    } else {
        let user = $('#create-email').val();
        let cPass1 = $('#create-pass').val();
        let cPass2 = $('#confirm-pass').val();
        let auth = $('#authKey').val();
        if (cPass1 === cPass2) {
            let response = await pFetch('auth/validateAuthKey', {auth});
            if (response === true) {
                let response = await pFetch('auth/register', {user, auth, pass: cPass1});
                if (response.hasOwnProperty('status') && response.hasOwnProperty('app_id')) {
                    document.getElementById('create-acc-div').setAttribute('class', 'fade_img');
                    document.getElementById("log-loader").style.opacity = "1";
                    document.getElementById("log-loader").style.zIndex = "999";
                    setTimeout(() => {
                        localStorage.setItem("app_id", response.app_id);
                        window.location.reload();
                    }, 500)

                } else {
                    document.getElementById("log-label").innerText = response;
                    document.getElementById("log-label").style.color = "rgba(245, 78, 78, .9)";
                }
            } else {
                document.getElementById("log-label").innerText = response;
                document.getElementById("log-label").style.color = "rgba(245, 78, 78, .9)";
                document.getElementById("authKey").style.borderColor = "rgba(245, 78, 78, .9)";
            }
        } else {
            document.getElementById("log-label").innerText = "passwords did not match";
            document.getElementById("log-label").style.color = "rgba(245, 78, 78, .9)";
            document.getElementById("confirm-pass").style.borderColor = "rgba(245, 78, 78, .9)";
            document.getElementById("create-pass").style.borderColor = "rgba(245, 78, 78, .9)";
        }
    }
})

$(document).on("keyup", "#login-container input", (event) => {
    if (event.which === 13) $('#log-submit').click();
})

document.getElementById('signIn-button').onclick = () => {
    let type = $('#log-submit').attr('data-id');
    if (type !== "email") {
        document.getElementById("login-container").setAttribute("class", "fade_input");
        setTimeout(() => {
            document.getElementById('login-container').innerHTML = `<div id="log-input-div">
                <div class="log-label-div" id="hook"><label id="log-label" for="log-input">email address</label></div>
                <div id="log-input-holder">
                    <input id="log-input" type="email" placeholder="enter your email address">
                    <input id="log-pass" type="password" placeholder="enter your password">
                </div>
                <div class="log-label-div"><div id="submit-width"><button id="log-submit" type="button" data-id="email">Submit</button></div></div>
            </div>`;
            document.getElementById("login-container").setAttribute("class", "glow_input");
        }, 500)
    }
}

document.getElementById("guest").onclick = async () => {
    let response = await sFetch('auth/guest');
    if (response.hasOwnProperty('status') && response.hasOwnProperty('app_id')) {
        localStorage.setItem("app_id", response.app_id);
        window.location.reload();

    } else alert("Something went wrong");
}

$(document).on("click", ".searchRes", async function (e) {
    search.input.value = '';
    searchImg = true;
    search.bool = false;
    if (searchTimer) clearTimeout(searchTimer)
    let poster = e.currentTarget.childNodes[1].attributes["src"].nodeValue.replace('search', 'auth');
    let string = `<img src="${poster}" id="img-10" class="glow_img">`;
    poster = document.getElementById("img-3").src;
    search.output.style.display = "none";
    let els = document.querySelectorAll('.glow_img')
    els.forEach(el => {
        el.setAttribute("class", "fade_img");
    });
    login_img.insertAdjacentHTML("beforeend", string);
    searchTimer = setTimeout(() => {
        searchImg = false;
        string = `<img src="${poster}" id="img-11" class="glow_img">`;
        els = document.querySelectorAll('.glow_img')
        els.forEach(el => {
            el.setAttribute("class", "fade_img");
        });
        login_img.insertAdjacentHTML("beforeend", string);
        setTimeout(() => {
            animateAuth();
        }, 5000)
    }, 5000)
});

document.addEventListener("click", function (event) {
    if (!search.output.contains(event.target) && search.bool && !search.input.contains(event.target)) {
        search.output.style.display = "none";
        search.input.value = '';
        search.bool = false;
        search.input.blur();
    }
});

search.input.addEventListener('keyup', async function () {
    await searchRes(search.input.value)
    clearTimeout(search.doneTyping);
    search.doneTyping = setTimeout(showImages, 500);
});

search.input.addEventListener('keydown', function () {
    clearTimeout(search.doneTyping);
});

const searchRes = async value => {
    search.bool = true;
    if (value.length) {
        let matches = await sFetch('info/search/' + value);
        if (matches.length) {
            matches = matches.search('name', value).splice(0, 16);
            showHtml(matches);
        } else
            search.output.style.display = "none";
    } else
        search.output.style.display = "none";
}

const showHtml = matches => {
    if (matches.length > 0) {
        search.result.innerHTML = matches.map(match => `
        <li data-id="${match.tmdb_id}" class="searchRes">
            <img class="info searchImages" src="" alt="${(match.type === 1 ? "m" : "s") + match.tmdb_id}">
            <span>${match.name}</span>
        </li>
        `).join('');

        search.output.style.display = "block";
    }
}

const showImages = () => {
    let link = "images/search/";
    let images = document.querySelectorAll('.searchImages');

    images.forEach(image => {
        image.src = link + image.attributes['alt'].nodeValue;
    });
}

async function pFetch(url, data) {
    return await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(response => {
        return response.json()
    })
        .catch(reason => console.log(reason));
}
