// Client ID and API key from the Developer Console
var CLIENT_ID = '933120916466-c17ghfo7rqn1mpa4jnltoh53q9vn5b8r.apps.googleusercontent.com';
var API_KEY = 'AIzaSyDJdUTxy8RPFgIAkkJaWM6ljrrthwTGub0';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest", "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
// var SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';
var SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar';

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');
var scheduleButton = document.getElementById('scheduleevt_button');
var deleteButton = document.getElementById('deleteevt_button');
var refreshButton = document.getElementById('refreshevt_button');
var clearLogsButton = document.getElementById('clearlogs_button');
var configsButton = document.getElementById('configs_button');

/*
  All data extraction to be done in these global variables
*/
var classon;
var classsub;
var classby;
var classat;
var classatdate;
var classatmont;
var classatyear;
var classathour;
var classatmins;
var eventslist;
var messageslist;

function getMonth(monthStr){
    return new Date(monthStr+'-1-01').getMonth()+1
}

String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

function confirmDialog(msg) {
  return confirm(msg);
}

function getClassSub(classon) {
  if (classon.slice(12, 14) == "ES") {
    return "Electrical Sciences";
  } else if (classon.slice(12, 14) == "WP") {
    return "Writing Practice";
  } else if (classon.slice(12, 14) == "SL") {
    return "Symbolic Logic";
  } else if (classon.slice(12, 14) == "PS") {
    return "Probablity and Statistics";
  }
}
/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
    scheduleButton.onclick = handleScheduleClick;
    deleteButton.onclick = handleDeleteEvtClick;
    refreshButton.onclick = handleRefreshEvtClick;
    clearLogsButton.onclick = handleClearLogsClick;
  }, function(error) {
    appendPre(JSON.stringify(error, null, 2));
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'inline';
    listMessages();
    listUpcomingEvents();
    scheduleButton.style.display = "inline";
    deleteButton.style.display = "inline";
    refreshButton.style.display = "inline";
    clearLogsButton.style.display = "inline";
    configsButton.style.display = "inline";
    document.getElementsByClassName('content_block').style.display = "block";
  } else {
    authorizeButton.style.display = 'inline';
    signoutButton.style.display = 'none';
    scheduleButton.style.display = "none";
    deleteButton.style.display = "none";
    refreshButton.style.display = "none";
    clearLogsButton.style.display = "none";
    configsButton.style.display = "none";
    document.getElementById('content').innerHTML = "";
    document.getElementById('accordionMails').innerHTML = "";
    document.getElementById('events_list').innerHTML = "";
    document.getElementById('logs_list').innerHTML = "";
    document.getElementById('mails_h').innerHTML = "";
    document.getElementById('events_h').innerHTML = "";
    document.getElementById('logs_h').innerHTML = "";
    document.getElementsByClassName('content_block').style.display = "none";
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

async function handleRefreshEvtClick(event) {
  // refreshButton.classList.add("rotate");
  document.getElementById('events_list').innerHTML = "";
  listUpcomingEvents();
  await new Promise(r => setTimeout(r, 1000));
  // refreshButton.classList.remove("rotate");
}

function handleClearLogsClick(event) {
  document.getElementById('logs_list').innerHTML = "";
}

async function handleDeleteEvtClick(event) {
  if (confirmDialog("Are you sure you want to delete all events? This action is irreversible.")) {
    for (var i = 0; i < eventslist.length; i++) {
      changeLogsH("\nDeleting Events");
      deleteEvent(eventslist[i].id, eventslist[i].summary);
    }
    await new Promise(r => setTimeout(r, 800));
  } else {
    // appendPre("Not deleting event");
  }
  changeLogsH("\nLogs:");
}

async function handleScheduleClick(event) {
  for (var i = 0; i < messageslist.length; i++) {
    changeLogsH("\nScheduling Events");
    var messageId = messageslist[i].id;
    gapi.client.gmail.users.messages.get({
      userId : 'me',
      id : messageId
    }).then(function(res) {
        var msg = atob(res.result.payload.parts[1].body.data.replace(/-/g, '+').replace(/_/g, '/').toString()).replace(/<br\/>/g, "");
        /*
          Extracting all data from the message text
        */
        classon = msg.slice(msg.search(" on ")+4, msg.search(" by "));
        classby = msg.slice(msg.search(" by ")+4, msg.search(" is ")-1);
        classat = msg.slice(msg.search(" at ")+4, msg.search("Please "));
        classatdate = classat.slice(0, 2);
        classatmont = classat.slice(5, 8);
        classatyear = classat.slice(9, 13);
        classathour = classat.slice(14,16);
        classatmins = classat.slice(17, 19);
        classatampm = classat.slice(20, 22);
        if (classatampm == "pm") {
          classathour = (parseInt(classathour)+12).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
        }
        classsub = getClassSub(classon);

        var classatfull = classatyear + '-' + getMonth(classatmont).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})
                                      + '-' + classatdate.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})
                                      + 'T' + classathour
                                      + ':' + classatmins
                                      + ':' + '00+05:30';
        var classatfullend = classatfull.replaceAt(11, (parseInt(classathour)+2).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}));

        var found = false;
        if (eventslist.length > 0) {
          for (var j = 0; j < eventslist.length; j++) {
            if ((eventslist[j].start.dateTime).toString() == classatfull) {
              appendLogsList("Event already found at " + eventslist[j].start.dateTime + " for " + eventslist[j].summary);
              found = true;
              break;
            }
          }
          if (found == false) {
            createNewEvent(classatfull, classatfullend);
          }
        } else {
          createNewEvent(classatfull, classatfullend, classsub, classby);
        }
    });
    await new Promise(r => setTimeout(r, 800));
  }
  changeLogsH("Logs:");
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

function appendMailH(message) {
  var h = document.getElementById('mails_h');
  var textContent = document.createTextNode(message + '\n');
  h.appendChild(textContent);
}

function appendEventH(message) {
  var h = document.getElementById('events_h');
  var textContent = document.createTextNode(message + '\n');
  h.appendChild(textContent);
}

function changeLogsH(message) {
  var h = document.getElementById('logs_h');
  // var textContent = document.createTextNode(message + '\n');
  // h.appendChild(textContent);
  h.innerHTML = message;
}

function appendMailList(mailhead, mailmessage, index) {
  var list = document.getElementById('accordionMails');
  list.innerHTML += `
  <div class="accordion-item">
    <h2 class="accordion-header" id="heading` + index + `">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse` + index + `" aria-expanded="false" aria-controls="collapse` + index + `">
        ` + mailhead + `
      </button>
    </h2>
    <div id="collapse` + index + `" class="accordion-collapse collapse" aria-labelledby="heading` + index + `" data-bs-parent="#accordionMails">
      <div class="accordion-body">
        ` + mailmessage + `
      </div>
    </div>
  </div>
  `;
}

function appendEventList(message) {
  var list = document.getElementById('events_list');
  var textContent = document.createElement('li');
  textContent.appendChild(document.createTextNode(message));
  list.appendChild(textContent);
}

function appendLogsList(message) {
  var list = document.getElementById('logs_list');
  var textContent = document.createElement('li');
  textContent.appendChild(document.createTextNode(message));
  list.appendChild(textContent);
  window.scrollTo(-50 ,document.body.scrollHeight);
}

function listMessages() {
  try {
    gapi.client.gmail.users.messages.list({
      userId : 'me',
      q : 'label:inbox from:noreply@impartus.com subject:"Impartus - Upcoming Class"',
      maxResults : 3
    }).then(function(response) {
      messageslist = response.result.messages;
      document.getElementById('mails_h').innerHTML = "";
      appendMailH("\n" + messageslist.length + ' Mail(s):');
      var ctr=0;
      if (messageslist && messageslist.length > 0) {
        for (i = 0; i < messageslist.length; i++) {
          var messageId = messageslist[i].id;
          gapi.client.gmail.users.messages.get({
            userId : 'me',
            id : messageId
          }).then(function(res) {
            // for (var i = 0; i < 25; i++) {
              // if (res.result.payload.parts[i].name == "Subject") {
                // if (res.result.payload.headers[i].value == "") {
                  var msg = atob(res.result.payload.parts[1].body.data.replace(/-/g, '+').replace(/_/g, '/').toString()).replace(/<br\/>/g, "");

                  classon = msg.slice(msg.search(" on ")+4, msg.search(" by "));
                  classby = msg.slice(msg.search(" by ")+4, msg.search(" is ")-1);
                  classsub = getClassSub(classon);

                  appendMailList(classsub + " lecture by " + classby, msg, ctr);
                  ctr++;
                // }
                // break;
              // }
            // }
          });
        }
      } else {
        appendMailList('No Messages found.', '', 0);
      }
    });
  } catch (e) {
    console.log('Error');
  }
}

function listUpcomingEvents() {
  // 'timeMin': (new Date()).toISOString(),
  gapi.client.calendar.events.list({
    'calendarId': 'primary',
    'showDeleted': false,
    'singleEvents': true,
    'maxResults': 10,
    'orderBy': 'startTime'
  }).then(function(response) {
    eventslist = response.result.items;
    document.getElementById('events_h').innerHTML = "";
    appendEventH('\n' + eventslist.length + ' Event(s):');

    if (eventslist.length > 0) {
      for (i = 0; i < eventslist.length; i++) {
        var event = eventslist[i];
        var when = event.start.dateTime;
        if (!when) {
          when = event.start.date;
        }
        appendEventList(event.summary + ' (' + when + ')')
      }
    } else {
      // appendEventList('No upcoming events found.');
    }
  });
}

function createNewEvent(classatfull, classatfullend, classSub, classBy) {
  var event = {
    'summary': classSub + " lecture by " + classBy,
    'start': {
      'dateTime': classatfull,
      'timeZone': 'Asia/Kolkata'
    },
    'end': {
      'dateTime': classatfullend,
      'timeZone': 'Asia/Kolkata'
    },
    'reminders': {
      'useDefault': false,
      'overrides': [
        {'method': 'popup', 'minutes': 15}
      ]
    }
  };

  var request = gapi.client.calendar.events.insert({
    'calendarId': 'primary',
    'resource': event
  });

  request.execute(function(event) {
    appendLogsList('Event created at ' + classatfull + " for " + event.summary);
  });
}

function deleteEvent(evtId, evtSummary) {
  gapi.client.calendar.events.delete({
    'calendarId' : 'primary',
    'eventId' : evtId
  }).then(function (response) {
    appendLogsList("Event " + evtSummary + " deleted.");
  });
}
