//TO ANY POOR SOUL READING THIS CODE:
//  THIS IS THE CODE EQUIVALENT OF A BRAINSTORM SESSION.
//  IT IS TERRIFYINGLY BAD.
//  I INTEND TO COMPLETELY REWRITE IT INTO A LESS HORRIFIC STATE.
//  PROCEED WITH CAUTION: YOUR SANITY IS IN DANGER.


const app = require("photoshop").app;
const {localFileSystem: fs, fileTypes, formats } = require('uxp').storage;
const { entrypoints } = require("uxp");

function getApiRootURL()
{
    url = document.getElementById("api_root_url").value; 
    if(typeof(url) !== 'string' || url === '')
    {
        console.log("Using default URL");
        url = "http://127.0.0.1:5000";
    }
    else
    {
        console.log(`Using URL: ${url}`);
    }
    console.log(`url: ${url}`);
    return url;
}

// attach event listeners for tabs
Array.from(document.querySelectorAll(".sp-tab")).forEach(theTab => {
    theTab.onclick = () => {
        localStorage.setItem("currentTab", theTab.getAttribute("id"));
        Array.from(document.querySelectorAll(".sp-tab")).forEach(aTab => {
            if (aTab.getAttribute("id") === theTab.getAttribute("id")) {
                aTab.classList.add("selected");
            } else {
                aTab.classList.remove("selected");
            }
        });
        Array.from(document.querySelectorAll(".sp-tab-page")).forEach(tabPage => {
            if (tabPage.getAttribute("id").startsWith(theTab.getAttribute("id"))) {
                tabPage.classList.add("visible");
            } else {
                tabPage.classList.remove("visible");
            }
        });
    }
});

function showLayerNames() {
        const app = require("photoshop").app;
        const allLayers = app.activeDocument.layers;
        const allLayerNames = allLayers.map(layer => layer.name);
        const sortedNames = allLayerNames.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
        document.getElementById("txt2img_output").innerHTML = `
            <ul>${
                sortedNames.map(name => `<li>${name}</li>`).join("")
            }</ul>`;
}



function buildModelMixUI(models)
{
    try
    {
        var model_mix_ui = document.getElementById("settings_model_mix_ui");
        model_mix_ui.innerHTML = "";
        model_mix_ui.classList.remove("group");
        var model_info = "";
        var val = 1;
        for(let i = 0; i < models.length; i++)
        {        
            model_info += `<sp-slider id="model_mix_${i}" class="padvertical" variant="filled" step="0.01" min="0" max="1" value="${val}"><sp-label slot="label">${models[i]}:</sp-label></sp-slider>`;
            val = 0;
        }
        if(models.length > 1)
        {
            model_mix_ui.classList.add("group");
            model_mix_ui.innerHTML = model_info;
        }
    }
    catch(e)
    {
        console.log(`Unable to build model mix UI: ${e}`);
    }
}


async function test(data)
{
    try
    {

        const batchPlay = require("photoshop").action.batchPlay;
        const image = await fetch(`${data}`);
        const temp = await fs.getTemporaryFolder();
        const file = await temp.createFile("temp.png");

        try
        {
            const img = await image.arrayBuffer();
            await file.write(img);
            //const app = require("photoshop").app;
            //const {localFileSystem: fs, fileTypes, formats } = require('uxp').storage;
    
            let entry = file
            let token = fs.createSessionToken(entry)

            const bgname = app.activeDocument.layers[0].name;
            const bgid = new Number(app.activeDocument.layers[0].ID);
            const newid = new Number(app.activeDocument.layers[app.activeDocument.layers.length - 1].ID + 1);

            const result = batchPlay(
                [
                    {
                            _obj: "make",
                            _target: [
                                {
                                        _ref: "layer"
                                }
                            ],
                            layerID: 3,
                            _options: {
                                dialogOptions: "dontDisplay"
                            }
                    },
                    {
                            _obj: "placeEvent",
                            ID: 4,
                            null: {
                                _path: token,
                                _kind: "local",
                            },
                            freeTransformCenterState: {
                                 _enum: "quadCenterState",
                                 _value: "QCSAverage"
                            },
                             offset: {
                                 _obj: "offset",
                                 horizontal: {
                                         _unit: "pixelsUnit",
                                         _value: 0
                                 },
                                 vertical: {
                                         _unit: "pixelsUnit",
                                         _value: 0
                                 }
                             },
                             width: {
                                 _unit: "pixelsUnit",
                                 _value: 100
                             },
                             height: {
                                 _unit: "pixelsUnit",
                                 _value: 100
                             },
                             _options: {
                                 dialogOptions: "dontDisplay"
                            }
                    },
                    {
                        _obj: "rasterizeLayer",
                        _target: [
                            {
                                    _ref: "layer",
                                    _enum: "ordinal",
                                    _value: "targetEnum"
                            }
                        ],
                        _options: {
                            dialogOptions: "dontDisplay"
                        }
                    },
                    {
                        _obj: "set",
                        _target: [
                           {
                              _ref: "layer",
                              _enum: "ordinal",
                              _value: "targetEnum"
                           }
                        ],
                        to: {
                           _obj: "layer",
                           name: `Txt2Img: "${document.getElementById("txt2img_prompt").value}"`
                        },
                        _options: {
                           dialogOptions: "dontDisplay"
                        }
                    },
                ],{
                synchronousExecution: true,
                modalBehavior: "execute"
            });

        }
        catch (e)
        {
            console.log(e); 
        }
        finally
        {
            file.delete();
        }
    }
    catch(e)
    {
        console.log(e);
    }
}

function postMessage(url, data, callback)
{
			
    //let result = document.querySelector('.result');
    //let name = document.querySelector('#prompt');
    //let email = document.querySelector('#email');
    
    // Creating a XHR object
    let xhr = new XMLHttpRequest();

    // open a connection
    xhr.open("POST", url, true);

    // Set the request header i.e. which type of content you are sending
    xhr.setRequestHeader("Content-Type", "application/json");

    // Create a state change callback
    xhr.onreadystatechange = function () 
    {
        if (xhr.readyState === 4)
        {
            console.log(`post response: ${this.response}`)
            var obj;
            if(xhr.status === 200)
            {
                obj = JSON.parse(this.response);
            }
            else
            {
                obj = {};
            }
            callback(xhr.status, obj)
        }
        else
        {
            document.getElementById("txt2img_output").innerHTML = "processing...";
        }
    };

    // Sending data with the request
    try
    {
        xhr.send(JSON.stringify(data));
    }
    catch(e)
    {
        console.log(`Exception while getting image: ${e}`);
    }
}

/*async function paste()
{
    console.log("In paste...");
    const batchPlay = require("photoshop").action.batchPlay;
    const result = await batchPlay(
        [
            {
                    _obj: "paste",
                    antiAlias: {
                        _enum: "antiAliasType",
                        _value: "antiAliasNone"
                    },
                    as: {
                        _class: "pixel"
                    },
                    _options: {
                        dialogOptions: "dontDisplay"
                    }
            }
        ],{
            synchronousExecution: false,
            modalBehavior: "fail"
        });    
}*/

async function newLayerFromData(data)
{
    try
    {
        const image = await fetch(`${data}`);
        const app = require("photoshop").app;
        const {localFileSystem: fs, fileTypes, formats } = require('uxp').storage;
        const temp = await fs.getTemporaryFolder();
        const file = await temp.createFile("temp.png");
        const img = await image.arrayBuffer();
        try
        {
            await file.write(img);
            const currentDocument = app.activeDocument;    
            const newDocument = await app.open(file);
            if(currentDocument)
            {
                await newDocument.activeLayers[0].duplicate(currentDocument);
                await newDocument.close();
            }    
        }
        catch (e)
        {
            console.log("Error loading data into layer");            
        }
        finally
        {
            file.delete();
        }
    }
    catch(e)
    {
        console.log(e);
    }
}

function getImage(id, retry = 3)
{
    try
    {
        console.log("In GetImage");
        let xhr = new XMLHttpRequest();
        api_root_url = getApiRootURL();
        xhr.open('GET', `${api_root_url}/txt2img/${id}`);
        console.log(`URL: ${api_root_url}/txt2img/${id}`);
        xhr.responseType = "json";
        xhr.onload = function() {
            console.log("this.response2: ", this.response);
            const obj = this.response;
            if(xhr.status === 200)
            {
                console.log("HTTP 200");
                if(this.response.retval !== null)
                {
                    console.log("Retval received.");
                    document.getElementById("txt2img_output").innerHTML = `<p>Done!</p>`;
                    test(this.response.retval[0][0]);
                }
                else
                {
                    console.log("Retval not yet received.");
                    try
                    {
                        console.log("Evaluating status.");
                        s = this.response.status;
                        task = s.cur_task;
                        jobs_ahead = s.jobs_ahead;
                        progress = s.cur_job_progress;
                        
                        document.getElementById("txt2img_output").innerHTML = 
                            `<p>Jobs ahead: ${jobs_ahead},<br>
                                Current task: ${task},<br>
                                Current job progress: ${(100 * progress).toFixed(2)}%</p>`;
                    }
                    catch(e)
                    {
                        console.log(`Unable to get progress status: ${e}`)
                        document.getElementById("txt2img_output").innerHTML = `No progress information`
                    }

                    setTimeout(function() {
                        getImage(id);
                    }, 1000);
                }
            }
            else
            {
                console.log("Error getting image.");
                document.getElementById("txt2img_output").innerHTML = `<p>Error getting image.</p>`;
            }
        }
        xhr.onerror = function() {
            if(retry > 0)
            {
                setTimeout(function() {
                    getImage(id, retry - 1);
                }, 1000);
            }
            else
            {
                document.getElementById("txt2img_output").innerHTML = `<p>Connection Error getting Image.</p>`;
            }
        }
        console.log("Before xhr.send");
        xhr.send();
    }
    catch(e)
    {
        console.log(`Exception while getting image: ${e}`);
    }
    console.log("Leaving GetImage");
}

function handlePost(status, data)
{
    try
    {
        if(status === 200)
        {
            var id = data.id;
            console.log("id: ", id);
            document.getElementById("txt2img_output").innerHTML = `<p>Started generating image ID ${id}. Waiting for result...</p>`;
            if("error" in data)
            {
                document.getElementById("txt2img_output").innerHTML = `<p>Failed to request image: ${data["error"]}</p>`;
            }
            else
            {
                getImage(id);
            }
        }
        else
        {
            document.getElementById("txt2img_output").innerHTML = `<p>$Error posting data.</p>`;        
        }
    }
    catch(e)
    {
        console.log(`Error while processing POST response: ${e}`);
    }
}


function txt2img()
{
    try
    {
        //sampler_name = sampler_name.trim();
        var data = { 
            "prompt": document.getElementById("txt2img_prompt").value, 
            "ddim_steps": document.getElementById("txt2img_steps").value,
            "sampler_name": document.getElementById("txt2img_sampler_name").value,
            "toggles": [1, 2, 3, 4, 5],
            "realesrgan_model_name": "RealESRGAN_x4plus",
            "ddim_eta": 0,
            "n_iter": 1,
            "batch_size": 1,
            "cfg_scale": document.getElementById("txt2img_cfg").value,
            "seed": document.getElementById("txt2img_seed").value,
            "height": document.getElementById("txt2img_height").value,
            "width": document.getElementById("txt2img_width").value,
            "fp": "null",
            "variant_amount": 0
        }; 
        api_root_url = getApiRootURL();
        postMessage(`${api_root_url}/txt2img`, data, handlePost);
    }
    catch(e)
    {
        console.log(`Error posting request: ${e}`)
    }    
}

async function newLayer()
{
    console.log("Test");
    try
    {
        let l = await app.activeDocument.layers.add();
    }
    catch(e)
    {
        console.log(e);
    }    
    console.log("Test2");
}

function btn_settings_toggle(id, btnid, b)
{
    if(b)
    {
        document.getElementById(id).classList.add("visible");
        button = document.getElementById(btnid);
        button.innerHTML = (new String(button.innerHTML)).replace("Show", "Hide");
    }
    else
    {
        document.getElementById(id).classList.remove("visible");
        button = document.getElementById(btnid);
        button.innerHTML = (new String(button.innerHTML)).replace("Hide","Show");
    }
}

var basic_settings_visible = false;
function btn_txt2img_basic_settings_toggle()
{
    basic_settings_visible = !basic_settings_visible;
    btn_settings_toggle("txt2img_basic_settings", "btn_txt2img_basic_settings_toggle", basic_settings_visible);
}

var advanced_settings_visible = false;
function btn_txt2img_advanced_settings_toggle()
{
    advanced_settings_visible = !advanced_settings_visible;
    btn_settings_toggle("txt2img_advanced_settings", "btn_txt2img_advanced_settings_toggle", advanced_settings_visible);
}

function restoreSettings()
{
    try
    {
        url = JSON.parse(window.localStorage.getItem('api_root_url'));
        if(url !== "")
        {
            document.getElementById("api_root_url").value = url;
        }
    }
    catch(e)
    {
        console.log("Unable to restore API Root URL.")
    }
}


function btn_settings_get_server_info()
{
    try
    {
        var connection_info = document.getElementById("settings_connection_info")
        var model_mix_ui = document.getElementById("settings_model_mix_ui")
        connection_info.innerHTML = "Unable to connect."
        model_mix_ui = "";
        let xhr = new XMLHttpRequest();
        api_root_url = getApiRootURL();
        xhr.open('GET', `${api_root_url}/info`);
        xhr.responseType = "json";
        xhr.onload = function() {
            console.log("this.response2: ", this.response);
            const obj = this.response;
            if(xhr.status === 200)
            {
                connection_info.innerHTML = `<p>Connected!<br>Server version: "${this.response.version}"</p>`;
                //buildModelMixUI(this.response.models);
            }
            else
            {
                connection_info.innerHTML = `<p>Unable to connect.</p>`;
            }
        }
        xhr.onerror = function() {
            console.log("Error getting server info.");
            connection_info.innerHTML = `<p>Connection Error.</p>`;
        }

        xhr.send();
    }
    catch(e)
    {
        console.log(`Unable to connect to API: ${e}`)
        connection_info.innerHTML = "Unable to connect."
    }
}

//document.getElementById("btnPopulate").addEventListener("click", test);
document.getElementById("btn_txt2img_generate").addEventListener("click", txt2img);
document.getElementById("btn_txt2img_basic_settings_toggle").addEventListener("click", btn_txt2img_basic_settings_toggle);
document.getElementById("btn_settings_get_server_info").addEventListener("click", btn_settings_get_server_info);
document.getElementById("api_root_url").addEventListener("input", evt => {
    window.localStorage.setItem('api_root_url', JSON.stringify(evt.target.value));
    connection_info = document.getElementById("settings_connection_info")
    connection_info.innerHTML = ""
})
//document.getElementById("btn_txt2img_advanced_settings_toggle").addEventListener("click", btn_txt2img_advanced_settings_toggle);

restoreSettings()
