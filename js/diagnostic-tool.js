window.onload = function () {
  setTimeout(onPageLoad, 1000);
  onPageLoad();
};

function onPageLoad() {
  document.getElementById("collect-data").checked = true;
}

function sftStatusHandler(connState) {
  console.log("SFT status=", connState);
  if (connState === "connected") {
    setTimeout(() => {
      sftTd.textContent = "OK";
      sftTd.style.backgroundColor = "rgb(0, 197, 0)";
    }, 2000);
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
  window.location.href = "https://wire-calling-testtool.wire.com/";
});

//Checkbox validation
https: function handleSaveButtonValidation() {
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

//Attach event listeners
const hiddenDetails = document.getElementById("show-details");
const checkboxDataValidation = document.getElementById(
  "sensitive-data-validation"
);

hiddenDetails.addEventListener("change", handleShowDetails);
checkboxDataValidation.addEventListener("change", handleSaveButtonValidation);
