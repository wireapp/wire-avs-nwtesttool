

function wlogin(backendUrl, username, password, worker, errHandler) {

    const data = {
	email: username,
	password: password,
    };

    fetch(backendUrl + "/login?persist=true", {
	method: 'POST',
	body: JSON.stringify(data), // data can be `string` or {object}!
	headers:{
	    'Content-Type': 'application/json'
	}})
	.then((resp) => {
	    if (!resp.ok) {
		const error = resp.status.toString() + ' ' + resp.statusText;
		console.log('req failed:', error);
		if(errHandler) {
		    errHandler(error);
		}
		return;
	    }
	    
	    resp.json()
		.then(jauth => {
		    fetch(backendUrl + "/calls/config/v2", {
			method: 'GET',
			headers:{
			    'Authorization': jauth.token_type + ' ' + jauth.access_token,
			    'Accept': 'application/json',
			    'Content-Type': 'application/json'
			}
		    })
		    .then((resp2) => {
			if (!resp2.ok) {
			    const error = resp2.status.toString() + ' '
				  + resp2.statusText;
			    console.log('req2 failed:', error);
			    if(errHandler) {
				errHandler(error);
			    }
			    return;
			}
		      
			resp2.json()
			    .then((jconfig) => {
				if (worker)
				    worker(jconfig);
			    })
		    })
		    .catch((error) => {
			console.error('Error in req:', error);
			if(errHandler) {
			    errHandler(error);
			}
		    })
		})
	        .catch((error) => {
		    console.error('Error in req:', error);
		    if(errHandler) {
			errHandler(error);
		    }
		})
	})
    	.catch((error) => {
	    console.error('Error:', error);
	    if(errHandler) {
		errHandler(error);
	    }
	});    
}
