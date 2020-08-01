const refresh = document.getElementById("refresh");
const player_num = document.getElementById("player_num");
const player_total = document.getElementById("player_total");
const map = document.getElementById("map");
const time = document.getElementById("date");
const played_since = document.getElementById("played_since");
const table = document.getElementById("players_table");
const optionsBtn = document.getElementById("options-btn");
const optionsAcc = document.getElementById("options-accordion");
const sendNotif = document.getElementById("send_notif");
const reqEvery = document.getElementById("req_every");
const saveOptionsBtn = document.getElementById("save_options");
const reqErr = document.getElementById("req_every_err");
const savedMsg = document.getElementById("saved-msg");
const isUpdating = document.getElementById("is_updating");

const logs  = chrome.extension.getBackgroundPage.logs; // Logs war from background script.

chrome.extension.getBackgroundPage().removeBadge(); // Remove the badge when popup icon is clicked

saveOptionsBtn.addEventListener("click", () => {
  saveOptions();
});

optionsBtn.addEventListener("click", () => {
  optionsAcc.classList.toggle("active");
});

initLoading();

refresh.onclick = function () {
  chrome.extension.getBackgroundPage().fetchData(initLoading);
  refresh.classList.add("refresh-start");
  setTimeout(() => {
    refresh.classList.remove("refresh-start");
  }, 1000);
};

isUpdating.addEventListener("change", () => {
  if (!isUpdating.checked) {
    reqEvery.disabled = true;
  } else {
    reqEvery.disabled = false;
  }
});

function renderPlayers(players) {
  // Reset players table before refreshing
  table.innerHTML = `<tr>
            <th>Player</th>
            <th>Score</th>
          </tr>`;

  for (let player of players) {
    let tr = document.createElement("tr");
    let name = document.createElement("td");
    let score = document.createElement("td");

    name.innerHTML = player.name;
    score.innerHTML = player.score;

    tr.appendChild(name);
    tr.appendChild(score);

    table.appendChild(tr);
  }
}

// Get data from storage
function initLoading() {
  chrome.storage.sync.get("player_num", function (data) {
    player_num.innerHTML = data.player_num + " / ";
  });
  chrome.storage.sync.get("player_total", function (data) {
    player_total.innerHTML = data.player_total;
  });
  chrome.storage.sync.get("map", function (data) {
    map.innerHTML = data.map;
  });
  chrome.storage.sync.get("players", function (data) {
    renderPlayers(data.players);
  });
  chrome.storage.sync.get("date", function (data) {
    let fDate = new Date(data.date);
    time.innerHTML = fDate.toTimeString().split(" ")[0];
  });

  chrome.storage.sync.get("map_date", function (data) {
    let map_date = data.map_date;
    played_since.innerHTML = calculateTime(new Date(map_date), new Date());
  });

  chrome.storage.sync.get("ext_options", function (data) {
    let req_every = data.ext_options.req_every;
    let send_notif = data.ext_options.send_notif;
    let is_updating = data.ext_options.is_updating;
    reqEvery.value = req_every;
    sendNotif.checked = send_notif;
    isUpdating.checked = is_updating;

    if (!isUpdating.checked) {
      reqEvery.disabled = true;
    } else {
      reqEvery.disabled = false;
    }
  });
}

function saveOptions() {
  savedMsg.classList.remove("saved-active");

  if (reqEvery.value > 300 || reqEvery.value < 3) {
    reqEvery.value = 3; // 3 minutes restriction is set here
    reqErr.classList.add("err-active");
  } else {
    reqErr.classList.remove("err-active");
    savedMsg.classList.add("saved-active");
  }

  let newOptions = {
    req_every: reqEvery.value,
    send_notif: sendNotif.checked,
    is_updating: isUpdating.checked,
  };
  chrome.storage.sync.set({ ext_options: newOptions });
  logs && console.log("New options: ", newOptions);

  // Re-launch the script with timeout to apply new options
  chrome.extension.getBackgroundPage().initScript();
}

function calculateTime(oldTime, newTime) {
  return Math.round((newTime.getTime() - oldTime.getTime()) / (1000 * 60)) + " minutes";
}
