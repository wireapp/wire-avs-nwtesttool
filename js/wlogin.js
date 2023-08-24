function wlogin(backendUrl, email, password, worker, errHandler) {
  const data = {
    email,
    password,
  };
  const errorMsg = document.getElementById("errorMsg");

  fetch(backendUrl + "/login?persist=false", {
    method: "POST",
    body: JSON.stringify(data), // data can be `string` or {object}!
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((resp) => {
      if (!resp.ok) {
        const error = resp.status.toString() + " " + resp.statusText;
        if (errHandler) {
          errHandler(error);
          errorMsg.textContent = "Please verify your details and try again";
        }
        return;
      }

      resp
        .json()
        .then((jauth) => {
          fetch(backendUrl + "/calls/config/v2", {
            method: "GET",
            headers: {
              Authorization: jauth.token_type + " " + jauth.access_token,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          })
            .then((resp2) => {
              if (!resp2.ok) {
                const error = resp2.status.toString() + " " + resp2.statusText;
                if (errHandler) {
                  errHandler(error);
                }
                return;
              }

              resp2.json().then((jconfig) => {
                if (jconfig) {
                  window.localStorage.setItem("wcfg", JSON.stringify(jconfig));
                }
                if (worker) worker();
              });
            })
            .catch((error) => {
              console.error("Error in req:", error);
              if (errHandler) {
                errHandler(error);
              }
            });
        })
    })
    .catch((error) => {
      console.error("Error:", error);
      if (errHandler) {
        errHandler(error);
      }
    });
}
