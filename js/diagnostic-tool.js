window.onload = function () {
  setTimeout(onPageLoad, 1000);
  onPageLoad();
  populateTurnServerList();
};

function onPageLoad() {
  document.getElementById("collect-data").checked = true;
}

function populateTurnServerList() {
  const turnServDiv = document.querySelector(".js-turn-serv-list");
  const wcfgConfig = JSON.parse(localStorage.getItem("wcfg"));

  if (wcfgConfig.ice_servers?.length > 0) {
    wcfgConfig.ice_servers.forEach((iceServer) => {
      const serverUrl = iceServer.urls[0];
      const span = document.createElement("span");
      span.textContent = serverUrl;
      turnServDiv.appendChild(span);
    });
  }
}

//Show more diagnostic info
function handleShowDetails() {
  const hiddenDetails = document.getElementById("diagnostic-el-desc-container");
  const showDetails = document.getElementById("show-details");
  const spanElement = showDetails.querySelector("span");

  if (
    hiddenDetails.style.display === "none" ||
    hiddenDetails.style.display === ""
  ) {
    hiddenDetails.style.display = "flex";
    spanElement.textContent = "Hide details";
  } else {
    hiddenDetails.style.display = "none";
    spanElement.textContent = "Show details";
  }
}

// Send report to CS
const sendReportButton = document.getElementById("send-report-button");
sendReportButton.addEventListener("click", function () {
  window.open("https://support.wire.com/hc/en-us/requests/new", "_blank");
});

const logOutButton = document.getElementById("logout-button");
logOutButton.addEventListener("click", function () {
  location.replace("https://wire-calling-testtool.wire.com/");
});

//Checkbox validation
function handleSaveButtonValidation() {
  const checkboxDataValidation = document.getElementById(
    "sensitive-data-validation"
  );
  const btnSaveReport = document.getElementById("btn-save-report");

  if (checkboxDataValidation.checked) {
    btnSaveReport.removeAttribute("disabled");
  } else {
    btnSaveReport.setAttribute("disabled", true);
  }
}

function showMoreDetails() {
  const dropdown = document.querySelector(".dropdown");
  const extendIcon = dropdown.querySelector(".extend-intent");
  const collapseIcon = dropdown.querySelector(".collapse-intent");

  const serverStatus = document.querySelector(".server-status-container");

  extendIcon.classList.toggle("hidden");
  collapseIcon.classList.toggle("hidden");
  serverStatus.classList.toggle("hidden");

  dropdown.classList.toggle("dropdown-clicked");
}

//Attach event listeners
const hiddenDetails = document.getElementById("show-details");
const checkboxDataValidation = document.getElementById(
  "sensitive-data-validation"
);

hiddenDetails.addEventListener("change", handleShowDetails);
checkboxDataValidation.addEventListener("change", handleSaveButtonValidation);
