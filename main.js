

(function(browser) {

  // Useful constants
  // --------------------------------------------------------------------------
  const TWITCH_ID = "gjds1hg0hy0zanu764903orz2adzsy";
  const TWITCH_URL = "https://api.twitch.tv/kraken/streams/accropolis?client_id=" + TWITCH_ID;
  const DELAY = 10; // minute
  const REFRESH_TIME = 2 * 60 * 1000; //2min

  // Global status
  // --------------------------------------------------------------------------
  var isLive = false;

  // Extension logic
  // --------------------------------------------------------------------------

  // Open a new tab to the most adequate Accropolis web page
  //
  // @return { Promise }
  async function openTab() {
    console.log("Opening tab");
    await browser.tabs.create({
      url: isLive ? "https://www.twitch.tv/accropolis" : "http://accropolis.fr"
    })
  }

  // Call the Twitch API to check is a liveis in progress
  //
  // @return { Promise => Boolean }
  async function checkLiveStatus() {
    var data = await fetch(TWITCH_URL).then((data) => {
      return data.json()
    });
    var isOn = Boolean(data.stream //stream is online
      &&
      data.stream.stream_type === "live") //the stream is live https://dev.twitch.tv/docs/v5/reference/streams/#get-live-streams


    return isOn ? data : null
  }

  // Update the browser action badge
  function setBadgeText(onAir) {
    browser.browserAction.setBadgeText({
      text: onAir ? browser.i18n.getMessage("badge") : ""
    });
  }

  // Display a notification indicating a live is in progress
  function setNotification() {
    // MS Edge doesn't support notifications yet
    if (!browser.notifications) {
      return;
    }

    browser.notifications.create("AccropolisLive", {
      type: "basic",
      title: browser.i18n.getMessage("title"),
      message: browser.i18n.getMessage("notification"),
      iconUrl: "icons/accropolis.svg",
      isClickable: true
    })
  }

  // The extension check if a live is in progress or not every 2min
  // Timeout the start of ([DELAY] min + 1 sec)
  //
  // @return { Promise }
  async function onLiveChange() {
    var data = await checkLiveStatus()
    var isOn = data != null
    var startWithDelay = 0
    var now = 0
    var delay = 0

    if(isOn && !isLive){
      startWithDelay = new Date(data.stream.created_at).getTime() + DELAY * 60 * 1000 // [DELAY] * 1 min
      now = new Date().getTime()

      if (startWithDelay + 1000 > now) {
        isOn = false
        delay = startWithDelay - now
      }else{
        delay = REFRESH_TIME
      }
    }else{
      delay = REFRESH_TIME
    }

    if (isLive !== isOn) {
      isLive = isOn;
      setBadgeText(isLive);
      if (isLive) {
        setNotification()
      }
    }

    setTimeout(onLiveChange, delay)
  }


  // Basic set up
  // --------------------------------------------------------------------------
  browser.browserAction.setBadgeBackgroundColor({
    color: "#07D21F"
  });

  // Set up events
  // --------------------------------------------------------------------------
  browser.browserAction.onClicked.addListener(openTab);

  // MS Edge doesn't support notifictations yet
  if (browser.notifications) {
    browser.notifications.onClicked.addListener(openTab);
  }

  // Start checking the live status
  // --------------------------------------------------------------------------
  onLiveChange()

}(window.browser || window.chrome));
