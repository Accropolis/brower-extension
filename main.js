(function(browser) {

  // Useful constants
  // --------------------------------------------------------------------------
  const TWITCH_ID = "gjds1hg0hy0zanu764903orz2adzsy";
  const TWITCH_URL = "https://api.twitch.tv/kraken/streams/accropolis?client_id=" + TWITCH_ID;
  const DELAY = 10; // minute

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
    await browser.ta  bs.create({
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
      ((data.stream.channel && data.stream.channel.status && data.stream.channel.status.indexOf("[Rediffusions]") === -1) //title contains [Rediffusions]
      || data.stream.stream_type === "live")) //or the stream is live https://dev.twitch.tv/docs/v5/reference/streams/#get-live-streams

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

  // Update the extension status on a regular basis
  //
  // The extension check if a live is in progress or not every 2min
  //
  // @return { Promise }
  async function onLiveChange() {
    var data = await checkLiveStatus();
    var isOn = data != null
    var timeout = 12000

    if (isLive !== isOn) {
      var startWithDelay = new Date(data.stream.created_at).getTime() + DELAY * 60 * 1000;
      var now = new Date().getTime()
      if (startWithDelay > now) {
        timeout = startWithDelay - now
      } else {
        isLive = isOn;
        setBadgeText(isLive);

        if (isLive) {
          setNotification()
        }
      }
    }

    setTimeout(onLiveChange, timeout)
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
  onLiveChange();

}(window.browser || window.chrome));
