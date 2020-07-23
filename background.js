const url = "https://ural-srv.herokuapp.com/info";

const default_options = {
  req_every: 5, // Minutes
  send_notif: true,
  is_updating: true
};
let timeout;
let isRecentlySent = false;

console.log("Initialising at ", new Date().toTimeString());
fetchData();
initScript();

function initScript() {
  console.log("initScript at", new Date().toTimeString());
  timeout !== undefined ? clearTimeout(timeout) : null;

  chrome.storage.sync.get("ext_options", function(data) {
    !data.ext_options ? chrome.storage.sync.set({ ext_options: default_options }) : null;
    console.log("Options: ", data.ext_options ? data.ext_options : default_options);
    if (data.ext_options && !data.ext_options.is_updating) return;

    timeout = setTimeout(
      () => {
        console.log("Fetching...");
        fetchData();
        initScript();
      },
      !data.ext_options ? default_options.req_every * 60000 : data.ext_options.req_every * 60000
    );
  });
}

function fetchData(cb = () => {}) {
  fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        console.log(response.status);
        console.log(response.statusText);
        //throw Error(response.statusText);
      }
    })
    .then(data => {
      console.log(data);
      saveData(data);
      cb();

    })
    .catch(err => console.log(err));
}

function saveData(data) {
  console.log("Saving received data");

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
}

function checkIsMapChanged(isChanged, mapName) {
  chrome.storage.sync.get("ext_options", function(data) {
    if (isChanged && data.ext_options.send_notif && !isRecentlySent) {
      chrome.notifications.create(
        {
          type: "basic",
          iconUrl: "./images/favicon-128.png",
          title: "UralServer66 - New Map!",
          message: `The map has changed to: ${mapName}`
          // contextMessage: 'contextMessage'
        },
        () => console.log("Notification was sent")
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
  chrome.browserAction.setBadgeBackgroundColor({
    color: '#F00'         
  }, () => console.log('set Badge color'));

  chrome.browserAction.setBadgeText(
    {
      text: "1"
    },
    () => console.log("Badge was set")
  );
}

function removeBadge() {
  chrome.browserAction.setBadgeText(
    {
      text: ""
    },
    () => console.log("Badge was disabled")
  );
}