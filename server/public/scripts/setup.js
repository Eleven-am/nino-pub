let osUseragent;
let osUsername;
let osPassword;
let google_token;
let tmdb_api;
let database;
let library;
let homeBase;
let cypher;
let admin_mail;
let admin_pass;

document.getElementById("logo").setAttribute("class", "growOut");

setTimeout(() => {
    document.getElementById("logo").setAttribute("class", "slideLeft10");
    document.getElementById("TaS-container").setAttribute("class", "slideLeft");
    setTimeout(() => {
        document.getElementById("TaS-container").style.background = "rgba(0,0,0,0)";
        document.getElementById("primary").style.background = "linear-gradient(rgba(1, 16, 28, .5), rgba(1, 16, 28, .9))";
    }, 600)
}, 1100)

document.getElementById('tas-submit').onclick = () => login();

const login = () => {
    document.getElementById("TaS-container").style.opacity = "0";
    document.getElementById("loader").style.opacity = "1";
    document.getElementById("loader").style.zIndex = "999";
    setTimeout(() => {
        document.getElementById("TaS-container").setAttribute("id", "login-container");
        document.getElementById("login-container").innerHTML = `<div id="login-holder">
                    <span id="logger-span">You need an account to continue.</span>
                    <ul id="login-list">
                        <li id="login-button" data-id="login">Log In</li>
                        <li id="create-button" data-id="create">Create Account</li>
                    </ul>
                    <div id="login-form">
                        <form id="login-form-form">
                            <input type="text" name="username" id="log-username" placeholder="Username">
                            <input type="password"  name="" id="log-password" placeholder="Password">
                            <button id="log-submit" class="log-submit" type="button" data-id="login">Submit</button>
                        </form>
                    </div>
                </div>`;

        document.getElementById("login-container").style.opacity = "1";
        document.getElementById("loader").style.opacity = "0";
        document.getElementById("loader").style.zIndex = "-999";

        const loginBlock = {
            box: document.getElementById("login-container"),
            info: document.getElementById("logger-span"),
            login: document.getElementById("login-button"),
            create: document.getElementById("create-button"),
            form: document.getElementById("login-form-form"),
            submit: $("#log-submit")
        }

        const displayLogError = (type, response) => {
            if (type === "login") {
                document.getElementById("log-username").style.borderColor = "rgba(245, 78, 78, .9)";
                document.getElementById("log-password").style.borderColor = "rgba(245, 78, 78, .9)";
                loginBlock.info.style.color = "rgba(245, 78, 78, .9)";
                loginBlock.info.innerText = response;

            } else {
                document.getElementById("log-username").style.borderColor = "rgba(245, 78, 78, .9)";
                document.getElementById("confirm-password").style.borderColor = "rgba(245, 78, 78, .9)";
                document.getElementById("log-password").style.borderColor = "rgba(245, 78, 78, .9)";
                loginBlock.info.style.color = "rgba(245, 78, 78, .9)";
                loginBlock.info.innerText = response;

            }
        }

        const login = async (type, obj) => {
            const data = JSON.stringify(obj);
            let response = await pFetch("https://nino-homebase.herokuapp.com/auth/" + type, data);
            if (response.action !== "failed") {
                cypher = response.cypher;
                if (response.data === null) {
                    document.getElementById("login-container").style.opacity = "0";
                    document.getElementById("loader").style.opacity = "1";
                    document.getElementById("loader").style.zIndex = "999";
                    admin_mail = obj.username;
                    admin_pass = obj.password;
                    loadSQL();
                }
                else {
                    response.data.cypher = response.cypher
                    download(response.data)
                }
            } else {
                displayLogError(type, response.error);
            }
        }

        loginBlock.login.addEventListener("click", () => {
            loginBlock.submit.attr("data-id", "login");
            loginBlock.info.style.color = "white";
            loginBlock.info.innerText = "Enter your credentials to login";
            loginBlock.form.innerHTML = `<input type="text" name="username" id="log-username" placeholder="Username">
                    <input type="password"  name="" id="log-password" placeholder="Password">
                    <button id="log-submit"  class="log-submit" type="button" data-id="login">Submit</button>`;
        })

        loginBlock.create.addEventListener("click", () => {
            loginBlock.submit.attr("data-id", "register");
            loginBlock.info.innerText = "Enter a Username and password to create account";
            loginBlock.info.style.color = "white";
            loginBlock.form.innerHTML = `<input type="text" name="username" id="log-username" placeholder="Username">
                    <input type="password"  name="enter" id="log-password" placeholder="Enter password" required>
                    <input type="password"  name="confirm" id="confirm-password" placeholder="Confirm password" required>
                    <button id="log-submit"  class="log-submit" type="button" data-id="login">Submit</button>`;
        })

        $(document).on('click', '#log-submit', async () => {
            let type = loginBlock.submit.attr("data-id");
            let username = document.getElementById("log-username");
            let password = document.getElementById("log-password");
            if (type === "login") {
                const obj = {
                    username: username.value,
                    password: password.value
                };
                await login(type, obj);

            } else {
                let confirm = document.getElementById("confirm-password");
                if (confirm.value === password.value) {
                    const obj = {
                        username: username.value,
                        password: password.value
                    };
                    await login(type, obj);

                } else {
                    displayLogError(type, "Passwords did not match");
                }
            }
        })
    }, 1000)
}

const loadSQL = () => {
    document.getElementById("login-container").innerHTML = '';

    setTimeout(() => {
        document.getElementById("login-container").innerHTML = `
                <div id="login-info" style="top: 10%">
                    <span id="sql-info">To continue, enter you credentials to a valid MySQL database</span>
                    <br>
                    <span>If you don't have one consider visiting <span id="sql-site" class="hyperlink">freeMySqlHosting</span> to create one</span>
                </div>
                <div id="login-holder">
                    <ul id="login-list">
                        <li>host</li>
                        <li>username</li>
                        <li>password</li>
                        <li>database</li>
                        <li>port</li>
                    </ul>
                    <div id="login-form">
                        <form id="os-form">
                            <input type="text" name="sql-host" id="sql-host" placeholder="Host">
                            <input type="text" name="sql-user" id="sql-user" placeholder="Username">
                            <input type="password" name="sql-password" id="sql-password" placeholder="Password">
                            <input type="text" name="sql-database" id="sql-database" placeholder="Database">
                            <input type="text" name="sql-port" id="sql-port" placeholder="Port">
                            <button id="sql-submit" class="log-submit" type="button" data-id="sql">Submit</button>
                        </form>
                    </div>
                </div>`;

        document.getElementById("login-container").style.opacity = "1";
        document.getElementById("loader").style.opacity = "0";
        document.getElementById("loader").style.zIndex = "-999";

        document.getElementById("sql-site").onclick = () => {
            let win = window.open('https://www.freemysqlhosting.net', '_blank');
            win.focus();
        }

        document.getElementById("sql-submit").onclick = async () => {
            let sqlHost, sqlUser, sqlPassword, sqlDatabase, sqlPort;
            sqlHost = document.getElementById("sql-host").value;
            sqlUser = document.getElementById("sql-user").value;
            sqlPassword = document.getElementById('sql-password').value;
            sqlDatabase = document.getElementById('sql-database').value;
            sqlPort = document.getElementById('sql-port').value;
            let check = await pFetch('setup/testDB', JSON.stringify({
                host: sqlHost,
                user: sqlUser,
                password: sqlPassword,
                database: sqlDatabase,
                port: sqlPort
            }));

            if (sqlDatabase === '' || sqlPort === '' || sqlPassword === '' || sqlUser === '' || sqlHost === '' || !check) {
                document.getElementById("sql-host").style.borderColor = 'rgba(245, 78, 78, .9)';
                document.getElementById("sql-user").style.borderColor = 'rgba(245, 78, 78, .9)';
                document.getElementById('sql-password').style.borderColor = 'rgba(245, 78, 78, .9)';
                document.getElementById('sql-database').style.borderColor = 'rgba(245, 78, 78, .9)';
                document.getElementById('sql-port').style.borderColor = 'rgba(245, 78, 78, .9)';
                document.getElementById("sql-info").innerText = 'Please enter valid SQL credentials to continue';
                document.getElementById("sql-info").style.color = 'rgba(245, 78, 78, .9)';
            } else {
                database = {host: sqlHost, user: sqlUser, password: sqlPassword, database: sqlDatabase, port: sqlPort};
                document.getElementById("login-container").innerHTML = '';
                document.getElementById("login-container").style.opacity = "0";
                document.getElementById("loader").style.opacity = "1";
                document.getElementById("loader").style.zIndex = "999";
                setTimeout(() => loadTMDB(), 1000)
            }
        }
    }, 1000)

}

const loadTMDB = () => {
    document.getElementById("login-container").innerHTML = '';
    document.getElementById("login-container").style.opacity = "0";
    document.getElementById("loader").style.opacity = "1";
    document.getElementById("loader").style.zIndex = "999";

    setTimeout(() => {
        document.getElementById("login-container").innerHTML = `
                <div id="login-info">
                    <span id="tmdb-info">Please enter your TMDB API details to configure nino</span>
                    <br>
                    <span>If you don't have a TMDB developer account consider visiting <span id="tmdb-site" class="hyperlink">their site</span> to create one</span>
                </div>
                <div id="login-holder">
                    <ul id="login-list">
                        <li>API Key</li>
                        <li>Token</li>
                    </ul>
                    <div id="login-form">
                        <form id="tmdb-form">
                            <input type="text" name="api-key" id="api-key" placeholder="API Key">
                            <input type="text"  name="token" id="token" placeholder="Token">
                            <button id="tmdb-submit" class="log-submit" type="button" data-id="token">Submit</button>
                        </form>
                    </div>
                </div>`;

        document.getElementById("login-container").style.opacity = "1";
        document.getElementById("loader").style.opacity = "0";
        document.getElementById("loader").style.zIndex = "-999";

        document.getElementById("tmdb-site").onclick = () => {
            let win = window.open('https://developers.themoviedb.org/3/getting-started/introduction', '_blank');
            win.focus();
        }

        document.getElementById("tmdb-submit").onclick = async () => {
            let tmdbApiKey, tmdbToken;
            tmdbApiKey = document.getElementById("api-key").value;
            tmdbToken = document.getElementById("token").value;
            let check = await pFetch('setup/testTmdb', JSON.stringify({
                token: tmdbToken,
                apiKey: tmdbApiKey,
                base: 'https://api.themoviedb.org/3/'
            }));

            if (tmdbApiKey === '' || tmdbToken === '' || !check) {
                document.getElementById("tmdb-info").innerText = 'Please enter valid TMDb credentials to continue';
                document.getElementById("tmdb-info").style.color = 'rgba(245, 78, 78, .9)';
                document.getElementById("api-key").style.borderColor = 'rgba(245, 78, 78, .9)';
                document.getElementById("token").style.borderColor = 'rgba(245, 78, 78, .9)';
            } else {
                tmdb_api = {token: tmdbToken, apiKey: tmdbApiKey, base: 'https://api.themoviedb.org/3/'}
                document.getElementById("login-container").innerHTML = '';
                document.getElementById("login-container").style.opacity = "0";
                document.getElementById("loader").style.opacity = "1";
                document.getElementById("loader").style.zIndex = "999";
                setTimeout(() => loginGoogle('homeBase'), 1000)
            }
        };
    }, 1000)
}

const loadOpenSubs = () => {
    document.getElementById("login-container").innerHTML = '';
    document.getElementById("login-container").style.opacity = "0";
    document.getElementById("loader").style.opacity = "1";
    document.getElementById("loader").style.zIndex = "999";

    setTimeout(() => {
        document.getElementById("login-container").innerHTML = `
                <div id="login-info">
                    <span id="os-info">Please enter your Open subtitles API details to configure nino</span>
                    <br>
                    <span>If you don't have an OS developer account consider visiting <span id="os-site" class="hyperlink">their site</span> to create one</span>
                </div>
                <div id="login-holder">
                    <ul id="login-list">
                        <li>Useragent</li>
                        <li>Username</li>
                        <li>password</li>
                    </ul>
                    <div id="login-form">
                        <form id="os-form">
                            <input type="text" name="os-Useragent" id="os-Useragent" placeholder="Useragent">
                            <input type="text"  name="os-Username" id="os-Username" placeholder="Username">
                            <input type="text"  name="os-Password" id="os-Password" placeholder="Password">
                            <button id="os-submit" class="log-submit" type="button" data-id="openSub">Submit</button>
                        </form>
                    </div>
                </div>`;

        document.getElementById("login-container").style.opacity = "1";
        document.getElementById("loader").style.opacity = "0";
        document.getElementById("loader").style.zIndex = "-999";

        document.getElementById("os-site").onclick = () => {
            let win = window.open('https://trac.opensubtitles.org/projects/opensubtitles/wiki/DevReadFirst', '_blank');
            win.focus();
        }

        document.getElementById("os-submit").onclick = () => {
            osUseragent = document.getElementById("os-Useragent").value;
            osUsername = document.getElementById("os-Username").value;
            osPassword = document.getElementById('os-Password').value;

            if (osUseragent === '' || osUsername === '' || osPassword === '') {
                document.getElementById("os-info").innerText = 'Please enter valid OS credentials to continue';
                document.getElementById("os-info").style.color = 'rgba(245, 78, 78, .9)';
                document.getElementById("os-Useragent").style.borderColor = 'rgba(245, 78, 78, .9)';
                document.getElementById("os-Username").style.borderColor = 'rgba(245, 78, 78, .9)';
                document.getElementById("os-Password").style.borderColor = 'rgba(245, 78, 78, .9)';
            } else {
                document.getElementById("login-container").innerHTML = '';
                document.getElementById("login-container").style.opacity = "0";
                document.getElementById("loader").style.opacity = "1";
                document.getElementById("loader").style.zIndex = "999";
                setTimeout(() => loginGoogle(), 1000)
            }
        }
    }, 1000)
}

const loginGoogle = async string => {
    let link = await sFetch('setup/' + string);
    document.getElementById("login-container").innerHTML = `<div id="login-info">
            <span id="google-info">I never have access to your data all information is stored on your machine</span>
            <br>
            <span>Follow <span id="auth-site" class="hyperlink">this link</span> to authenticate nino with google</span>
        </div>
        <div id="login-holder">
                    <ul id="login-list">
                        <li>google token</li>
                    </ul>
                    <div id="login-form">
                        <form id="id-form">
                            <input type="text" name="google" id="google" placeholder="token">
                            <button id="id-submit" class="log-submit" type="button" data-id="confirm-token">Submit</button>
                        </form>
                    </div>
                </div>
        `;

    document.getElementById("auth-site").onclick = () => {
        let win = window.open(link, '_blank');
        win.focus();
    }

    document.getElementById("login-container").style.opacity = "1";
    document.getElementById("loader").style.opacity = "0";
    document.getElementById("loader").style.zIndex = "-999";

    document.getElementById("id-submit").onclick = async () => {
        let token = document.getElementById('google').value;
        token = await pFetch('setup/genToken', JSON.stringify({token}));
        if (!token) {
            document.getElementById("google-info").innerText = 'Please enter valid google credentials to continue';
            document.getElementById("google-info").style.color = 'rgba(245, 78, 78, .9)';
            document.getElementById('google').style.borderColor = 'rgba(245, 78, 78, .9)';

        } else {
            document.getElementById("login-container").innerHTML = '';
            document.getElementById("login-container").style.opacity = "0";
            document.getElementById("loader").style.opacity = "1";
            document.getElementById("loader").style.zIndex = "999";
            if (string === 'getToken'){
                google_token = token;
                setTimeout(() => buildFolders(), 1000)
            } else {
                homeBase = token;
                alert('for your security, nino creates two access to your account. One as read only which you just signed in as and the other as full access which would be needed to create folders and move files')
                alert('please sign in again when instructed');
                setTimeout(() => loginGoogle('getToken'), 1000)
            }
        }
    }
}

const buildFolders = async () => {
    alert("nino needs access to three folders: Movies, TV Shows and Backdrops");
    alert('if you do not have these folders, I can create them');
    let info = confirm('would you like me to create them?');
    if (info) {
        library = await sFetch('setup/createFolders');
        await confirmFolders()
    } else
        getFolders();
}

const getFolders = () => {
    document.getElementById("login-container").innerHTML = `
                <div id="login-info">
                    <span id="id-info">Please enter your folder ids to configure your nino library</span>
                    <br>
                    <span>To get your folder id, open the folder in a browser, it should look like  https://drive.google.com/drive/u/1/folders/<span id="id-site" class="hyperlink">XXXXX</span> that's your folder id</span>
                </div>
                <div id="login-holder">
                    <ul id="login-list">
                        <li>movies ID</li>
                        <li>tv ID</li>
                    </ul>
                    <div id="login-form">
                        <form id="id-form">
                            <input type="text" name="mov" id="mov" placeholder="movie ID">
                            <input type="text"  name="tv" id="tv" placeholder="tv ID">
                            <input type="text"  name="backdrop" id="backdrop" placeholder="backdrop ID">
                            <button id="id-submit" class="log-submit" type="button" data-id="token">Submit</button>
                        </form>
                    </div>
                </div>`;

    document.getElementById("login-container").style.opacity = "1";
    document.getElementById("loader").style.opacity = "0";
    document.getElementById("loader").style.zIndex = "-999";

    document.getElementById("id-site").onclick = () => {
        let win = window.open('https://www.shooshmonkey.com/help/how-to-find-your-google-drive-folder-id', '_blank');
        win.focus();
    }

    document.getElementById("id-submit").onclick = async () => {
        let movies, tvShows, backdrop;
        movies = document.getElementById("mov").value;
        tvShows = document.getElementById("tv").value;
        backdrop = document.getElementById("backdrop").value;
        library = {movies, backdrop, tvShows};
        await confirmFolders()
    }
}

const confirmFolders = async () => {
    document.getElementById("login-container").style.opacity = "0";
    document.getElementById("loader").style.opacity = "1";
    document.getElementById("loader").style.zIndex = "999";
    let info = await pFetch('setup/confirmFolders', JSON.stringify(library));
    if (info) {
        let json = {database, library, tmdb_api, google_token, admin_mail, admin_pass,
            cypher: "",
            logger: true,
            fanArt: {
            "apiKey": "84a65dfbe1b2441c7d2fe3f54c681cab",
            "base": "http://webservice.fanart.tv/v3/"
        }}

        let check = await pFetch('https://nino-homebase.herokuapp.com/auth/updateUser', JSON.stringify({username: admin_mail, cypher, data: json, homeBase}))
        if (check)
            download(json)
    } else getFolders()
}

const download = json => {
    alert('store the nino.json file in the config folder of the server')
    alert("remember to reload the server afterwards");
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json));
    document.getElementById("login-container").insertAdjacentHTML("beforeend", `<a href="" id="down"/>`);
    let dlAnchorElem = document.getElementById('down');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", "nino.json");
    dlAnchorElem.click();
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