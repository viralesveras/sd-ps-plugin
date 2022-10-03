
//Class representing API actions
class SDRestAPI
{
    constructor(api_root_url = defaults.api_root_url)
    {
        this.setURL(api_root_url);
        this.session_key = settings.load("session_key");
        if(this.session_key == null || this.session_key == "")
        {
            this.session_key = makeid(10);
            settings.save("session_key", this.session_key);
        }
    }

    setURL(api_root_url)
    {
        this.root_url = api_root_url;
    }

    post(path, data, params, cb_ok, cb_notok, cb_error)
    {
        //Set up the request and associated callbacks
        var this_api = this;
        let d = new DBG(`posting to ${this.root_url}/${path}`); try {            
        let xhr = new XMLHttpRequest();
        var url = `${this.root_url}/${path}`;
        if(params !== null)
        {
            url += "?";
            for(const [key, value] of Object.entries(params))
                url += `${key}=${value}&`;
            url = url.slice(0, -1);
        }
        xhr.open('POST', url);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.responseType = "json";

        //If response loads
        xhr.onload = function() {
            const obj = this.response;
            if(xhr.status === 200)
                //If response is OK
                cb_ok(this_api, xhr, this, url);
            else
                //If response is not OK
                cb_notok(this_api, xhr, this, url);
        }

        //If we can't send the request
        xhr.onerror = function() {
            cb_error(this_api, xhr, this, url);
        }

        //Perform the request
        xhr.send(JSON.stringify(data));
        } catch(e) { d.err(e); }

    }

    get(path, params, cb_ok, cb_notok, cb_error)
    {
        //Set up the request and associated callbacks
        var this_api = this;
        let d = new DBG(`getting from ${this.root_url}/${path}`); try {            
        let xhr = new XMLHttpRequest();
        var url = `${this.root_url}/${path}`;
        if(params !== null)
        {
            url += "?";
            for(const [key, value] of Object.entries(params))
                url += `${key}=${value}&`;
            url = url.slice(0, -1);
        }
        xhr.open('GET', url);
        xhr.responseType = "json";
        
        //If response loads
        xhr.onload = function() {
            const obj = this.response;
            if(xhr.status === 200)
                //If response is OK
                cb_ok(this_api, xhr, this, url);
            else
                //If response is not OK
                cb_notok(this_api, xhr, this, url);
        }

        //If we can't send the request
        xhr.onerror = function() {
            cb_error(this_api, xhr, this, url);
        }

        //Perform the request
        xhr.send();
        } catch(e) { d.err(e); }
    }
    
    info(cb_ok, cb_notok, cb_error)
    {
        let d = new DBG(`getting server info`); try {
            this.get("info", {}, cb_ok, cb_notok, cb_error);
        } catch(e) { d.err(e); }
    }

    txt2img(Txt2ImgRequest, cb_ok, cb_notok, cb_error)
    {
        let d = new DBG(`getting server info`); try {
            this.post("txt2img", 
                    Txt2ImgRequest.request,
                    Txt2ImgRequest.parameters,
                    cb_ok,
                    cb_notok,
                    cb_error);
        } catch(e) { d.err(e); }
    }

    txt2img_result(id, cb_ok, cb_notok, cb_error)
    {
        api.get(`txt2img/${id}`,
        {"key": this.session_key},
        cb_ok,
        cb_notok,
        cb_error);
    }

    cancel(id, cb_ok, cb_notok, cb_error)
    {
        let d = new DBG(`getting server info`); try {
            api.get(`cancel/${id}`,
                {"key": this.session_key},
                cb_ok,
                cb_notok,
                cb_error);
        } catch(e) { d.err(e); }
    }
}

var api = new SDRestAPI();

//Class representing txt2img request
class Txt2ImgRequest
{
    constructor(prompt, steps, width, height, cfg, seed, sampler, model)
    {
        console.log(`sampler: ${sampler}`);
        this.request = { 
            "prompt": prompt, 
            "ddim_steps": steps,
            "sampler_name": sampler,
            "toggles": [1, 2, 3, 4, 5],
            "realesrgan_model_name": "RealESRGAN_x4plus",
            "ddim_eta": 0,
            "n_iter": 1,
            "batch_size": 1,
            "cfg_scale": cfg,
            "seed": seed,
            "height": height,
            "width": width,
            "fp": "null",
            "variant_amount": 0
        };

        this.params = {
            "key": api.session_key,
            "model": model
        }
        console.log(`request: ${JSON.stringify(this.request)}`);
        console.log(`params: ${JSON.stringify(this.params)}`);
    }
}

