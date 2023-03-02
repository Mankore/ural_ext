// const url = "https://ural-srv.herokuapp.com/info";
const url = "http://109.120.135.75:3000/info";
const backupUrl = "https://next-ural-crawler.vercel.app/api/info";

const logs = true; // Logging disabled by default

const default_options = {
  req_every: 5, // Minutes
  send_notif: true,
  is_updating: true,
};
let timeout;
let isRecentlySent = false;

logs && console.log("Initialising at ", new Date().toTimeString());
fetchData();
initScript();

function initScript() {
  logs && console.log("initScript at", new Date().toTimeString());
  timeout !== undefined ? clearTimeout(timeout) : null;

  chrome.storage.sync.get("ext_options", function (data) {
    !data.ext_options ? chrome.storage.sync.set({ ext_options: default_options }) : null;
    logs && console.log("Options: ", data.ext_options ? data.ext_options : default_options);
    if (data.ext_options && !data.ext_options.is_updating) return;

    timeout = setTimeout(
      () => {
        logs && console.log("Fetching...");
        fetchData();
        initScript();
      },
      !data.ext_options ? default_options.req_every * 60000 : data.ext_options.req_every * 60000
    );
  });
}

function fetchData(cb = () => {}) {
  updateRefreshState("refresh_pending");
  fetch(url)
    .catch(() => fetch(backupUrl))
    .then((response) => response.json())
    .then((data) => {
      logs && console.log(data);
      saveData(data);
      cb();
      // showSnackbar("Successfully refreshed");
      updateRefreshState("refresh_success");
    })
    .catch((err) => {
      updateRefreshState("refresh_fail");
      showSnackbar(`Data fetch failed`, "#d12440");
    });
}

function saveData(data) {
  logs && console.log("Saving received data");

  // Checks if map was changed and sends a notification
  checkIsMapChanged(data.isMapChanged, data.map);

  // Saves all the data in the storage
  chrome.storage.sync.set({ player_num: data.player_num });
  chrome.storage.sync.set({ player_total: data.player_total });
  chrome.storage.sync.set({ map: data.map });
  chrome.storage.sync.set({ date: data.date });
  chrome.storage.sync.set({ players: data.players });
  chrome.storage.sync.set({ map_date: data.map_date });
  chrome.storage.sync.set({ isMapChanged: data.isMapChanged });
  chrome.storage.sync.set({ settings: data.settings });
}

async function checkIsMapChanged(isChanged, mapName) {
  const oldData = await getStorageData("map");
  chrome.storage.sync.get("ext_options", function (data) {
    if (isChanged && data.ext_options.send_notif && !isRecentlySent && mapName !== oldData.map) {
      chrome.notifications.create(
        {
          type: "basic",
          iconUrl: "./images/favicon-128.png",
          title: "UralServer66 - New Map!",
          message: `The map has changed to: ${mapName}`,
          // contextMessage: 'contextMessage'
        },
        () => logs && console.log("Notification was sent")
      );

      // Set the badge after Sending Notification
      // The badge will be reset after clicking on an extension Icon
      setBadge();

      // If notification was sent then set the flag and reset it after 5 minutes
      isRecentlySent = true;
      setTimeout(() => {
        isRecentlySent = false;
      }, 5 * 60000);
    }
  });
}

function setBadge() {
  chrome.browserAction.setBadgeBackgroundColor(
    {
      color: "#F00",
    },
    () => logs && console.log("set Badge color")
  );

  chrome.browserAction.setBadgeText(
    {
      text: "1",
    },
    () => logs && console.log("Badge was set")
  );
}

function removeBadge() {
  chrome.browserAction.setBadgeText(
    {
      text: "",
    },
    () => logs && console.log("Badge was disabled")
  );
}

function isPopupOpen() {
  let views = chrome.extension.getViews({ type: "popup" });
  if (views.length === 0) {
    return false;
  } else {
    return true;
  }
}

function showSnackbar(message, bgColor = "#29cc44") {
  if (!isPopupOpen()) return;
  chrome.extension.sendMessage({ action: "show_snackbar", message, bgColor }, function () {});
}

function updateRefreshState(state) {
  if (!isPopupOpen()) return;
  chrome.extension.sendMessage({ action: state }, function () {});
}

const getStorageData = (key) =>
  new Promise((resolve, reject) =>
    chrome.storage.sync.get(key, (result) =>
      chrome.runtime.lastError ? reject(Error(chrome.runtime.lastError.message)) : resolve(result)
    )
  );
