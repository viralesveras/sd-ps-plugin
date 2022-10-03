
//Class representing a returned image
class OutputImageHandle
{
    static handle_count = 1;
    //Initial construction
    constructor() 
    {
        this.buildUI();
        this.cancelled = false;
        this.done = false;
    }

    //Build the UI for this handle
    buildUI() 
    {
        let id_base = `image_handle_${this.handle_count}`;
        let group = new SPBody(`${id_base}_group`, "", "group");
        let response = new SPBody(`${id_base}_response`, "");
        let image = new SPBody(`${id_base}_image`, "");

        group.addChildren([response, image]);
        this.handle_count++;
        this.ui = group;
        this.response = response;
        this.image = image;        
    }

    //Cancel the request if it's still in progress.
    cancel() 
    {
        let d = new DBG("building DiffusionPlugin"); try {            
            cb_ok = (this_api, xhr, evt, url) => {
                msg = `<p>Request ${this.request.id} cancelled.</p>`;
                d.log(msg);
                this.response.element.innerHTML = msg;
                this.cancelled = true;
            }
            cb_notok = (this_api, xhr, evt, url) => {
                msg = `<p>Received error ${xhr.status} from server.</p>`;
                d.log(msg);
                this.response.element.innerHTML = msg;
            }
            cb_error = (this_api, xhr, evt, url) => {
                msg = `<p>Unable to connect to ${url}</p>`;
                d.log(msg);
                this.response.element.innerHTML = msg;
            }
            if(!this.done)
                api.cancel(this.request.response.id, cb_ok, cb_notok, cb_error);
        } catch(e) { d.log(e); }
    }    
}

//Class representing set of output images
class OutputImageSet
{
    static set_count = 1;

    //Initial construction
    constructor(element)
    {
        let d = new DBG("constructing output image set"); try {            
            this.element = element;
            this.ui = this.buildUI();
            this.clear();
            element.appendChild(this.ui.element);
        } catch(e) { d.err(e); }
    }

    buildUI()
    {
        let d = new DBG("building output image set UI"); try {            
            let id_base = `image_set_${this.set_count}`;
            let group = new SPBody(`${id_base}_group`, "Txt2Img Outputs", "group");
            this.set_count++;
            return group;
        } catch(e) { d.err(e); }
    }

    //Add a request to this set
    addImage()
    {
        let d = new DBG("adding image to output image set"); try {
            let imageHandle = new OutputImageHandle();
            let container = new SPBody(`${imageHandle.ui.element.id + "_container"}`);
            let close = new SPObject("img", `${imageHandle.ui.element.id + "_close"}`, "", "imghandle-close", {"title": "Remove this request", "src": "icons/cancel-icon.png"});
            close.element.addEventListener("click", (evt) => {
                this.removeImage(imageHandle);
            });
        imageHandle.ui.addChildren(close);
            container.addChildren(imageHandle.ui);
            container.imageHandle = imageHandle;
            this.ui.insertChild(container, 1);
            this.images.push(container);
            return imageHandle;
        } catch(e) { d.err(e); }
    }

    //Remove a specific image from this set
    removeImage(imageHandle)
    {
        let d = new DBG("removing image from output image set"); try {
            for(var i = 0; i < this.images.length; i++)
            {
                let container = this.images[i];
                if(container.imageHandle === imageHandle)
                {
                    this.ui.removeChild(container);
                    this.images.splice(i, 1);
                    container.imageHandle.cancel();
                }
            }
        } catch(e) { d.err(e); }
    }

    //Add a set of image handles
    /*addImages(imageHandles) 
    {
        for(var i = 0; i < imageHandles.length; i++)
            this.ui.addChildren(imageHandles[i].buildUI());
    }

    //Remove specific image handles
    removeImages(imageHandles) 
    {
        var filtered = images.filter((value, index, arr) => { 
            return !imageHandles.includes(value);
        });
    }*/

    //Clear the output section
    clear() 
    {
        this.images = [];
    }
}


function get_server_info(element)
{
    let d = new DBG("building DiffusionPlugin"); try {            
        cb_ok = (this_api, xhr, evt, url) => {
            msg = `<p>Connected!<br>Server version: "${evt.response.version}"</p>`;
            d.log(msg);
            element.innerHTML = msg;
            settings.save("api_root_url", api.root_url);
            dp.updateServerInfo(evt.response);
        }
        cb_notok = (this_api, xhr, evt, url) => {
            msg = `<p>Received error ${xhr.status} from server.</p>`;
            d.log(msg);
            element.innerHTML = msg;
        }
        cb_error = (this_api, xhr, evt, url) => {
            msg = `<p>Unable to connect to ${url}</p>`;
            d.log(msg);
            element.innerHTML = msg;
        }
        api.info(cb_ok, cb_notok, cb_error);
    } catch(e) { d.err(e); }
}

function addNewLayerButton(imageHandle)
{
    let newLayerButton = new SPObject(
        "img", 
        `${imageHandle.ui.element.id + "_newlayer"}`, 
        "", 
        "imghandle-newlayer", 
        {
            "title": "Add as new layer", 
            "src": "icons/newlayer-icon.png"
    });

    let prompt = imageHandle.request.request.prompt;
    newLayerButton.element.addEventListener("click", (evt) => {
        psu.newLayerFromData(
            imageHandle.request.result.retval[0][0], 
            `Txt2Img: "${prompt}"`);                            
    }); 
    imageHandle.ui.addChildren(newLayerButton);
}

function addCopyButton(imageHandle)
{
    let newLayerButton = new SPObject(
        "img", 
        `${imageHandle.ui.element.id + "_copy"}`, 
        "", 
        "imghandle-copy", 
        {
            "title": "Copy to clipboard", 
            "src": "icons/copy-icon.png"
    });
    
    let prompt = imageHandle.request.request.prompt;
    newLayerButton.element.addEventListener("click", (evt) => {
        psu.copyToClipboardFromData(
            imageHandle.request.result.retval[0][0]);
    }); 
    imageHandle.ui.addChildren(newLayerButton);
}

function addSourceButton(imageHandle)
{
    let newLayerButton = new SPObject(
        "img", 
        `${imageHandle.ui.element.id + "_copy"}`, 
        "", 
        "imghandle-source", 
        {
            "title": "Copy source parameters", 
            "src": "icons/source-icon.png"
    });
    
    let prompt = imageHandle.request.request.prompt;
    newLayerButton.element.addEventListener("click", (evt) => {
        let d = new DBG("getting source parameters"); try {         
            namedmodelmix = {};
            model = JSON.parse(imageHandle.request.params.model);
            for(var i = 0; i < imageHandle.request.model_names.length; i++)
                namedmodelmix[imageHandle.request.model_names[i]] = model[i];
            let source = {
                prompt: imageHandle.request.request.prompt,
                steps: imageHandle.request.request.ddim_steps,
                sampler: imageHandle.request.request.sampler_name,
                cfg: imageHandle.request.request.cfg_scale,
                width: imageHandle.request.request.width,
                height: imageHandle.request.request.height,
                
                seed: imageHandle.request.result.retval[1],
                models: namedmodelmix
            }
            psu.copyToClipboardFromText(JSON.stringify(source));
            console.log(JSON.stringify(source));
            console.log(imageHandle.request);
        } catch(e) { d.err(e); }
    }); 
    imageHandle.ui.addChildren(newLayerButton);
}


function get_txt2img_result(imageHandle, id, retry = 3)
{
    let d = new DBG("getting txt2img result"); try {         
        let element = imageHandle.image.element;
        cb_ok = (this_api, xhr, evt, url) => {
            imageHandle.request.result = evt.response;
            data = evt.response;
            if("error" in data)
                element.innerHTML = `<p>Failed to request image: ${data["error"]}</p>`;
            else
            {
                if(evt.response.retval !== null)
                {
                    element.innerHTML = `<img src=${evt.response.retval} width="100%"/>`;
                    let prompt = document.getElementById("txt2img_prompt").value
                    let seed = document.getElementById("txt2img_seed").value
                    let steps = document.getElementById("txt2img_steps").value
                    let width = document.getElementById("txt2img_width").value
                    let height = document.getElementById("txt2img_height").value
                    let cfg = document.getElementById("txt2img_cfg").value
                    let sampler = document.getElementById("txt2img_sampler").value
                    imageHandle.done = true;
                    addNewLayerButton(imageHandle);
                    addCopyButton(imageHandle);
                    addSourceButton(imageHandle);
                }
                else
                {
                    try {
                        s = evt.response.status;
                        task = s.cur_task;
                        jobs_ahead = s.jobs_ahead;
                        progress = s.cur_job_progress;
                        
                        element.innerHTML = 
                            `<p>Jobs ahead: ${jobs_ahead},<br>
                                Current task: ${task},<br>
                                Current job progress: ${(100 * progress).toFixed(2)}%</p>`;
                    } catch(e) {
                        console.log(`Unable to get progress status: ${e}`)
                        element.innerHTML = `No progress information`
                    }

                    setTimeout(() => {
                            if(!imageHandle.cancelled)
                                get_txt2img_result(imageHandle, id);
                        }, 
                        1000);
                }
            }
        }
        cb_notok = (this_api, xhr, evt, url) => {
            msg = `<p>Received error ${xhr.status} from server.</p>`;
            d.log(msg);
            element.innerHTML = msg;
        }
        cb_error = (this_api, xhr, evt, url) => {
            d.log(`Unable to get valid result from ${url}. Retris remaining: ${retry}`);
            element.innerHTML = msg;
            if(retry > 0)
                setTimeout(
                    function() {
                        if(!imageHandle.cancelled)
                            get_txt2img_result(imageHandle, id, retry - 1);
                    }, 
                    1000);
            else
                element.innerHTML = `<p>Connection Error getting Image.</p>`;
        }
        api.txt2img_result(id, cb_ok, cb_notok, cb_error);
    } catch(e) { d.err(e); }
}


function generate_txt2img(imageHandle, txt2imgreq)
{
    let d = new DBG("building DiffusionPlugin"); try {
        d.log(imageHandle);
        d.log(txt2imgreq);
        imageHandle.request = txt2imgreq
        imageHandle.request.model_names = dp.model_names;
        imageHandle.request.sampler_namess = dp.sampler_names
        let element = imageHandle.image.element;
        cb_ok = (this_api, xhr, evt, url) => {
            txt2imgreq.response = evt.response;
            data = evt.response;
            id = data.id;
            if("error" in data)
                element.innerHTML = `<p>Failed to request image: ${data["error"]}</p>`;
            else
            {
                element.innerHTML = `<p>Started generating image ID ${id}. Waiting for result...</p>`;
                get_txt2img_result(imageHandle, id, txt2imgreq);
            }
        }
        cb_notok = (this_api, xhr, evt, url) => {
            msg = `<p>Received error ${xhr.status} from server.</p>`;
            d.log(msg);
            element.innerHTML = msg;
        }
        cb_error = (this_api, xhr, evt, url) => {
            msg = `<p>Unable to connect to ${url}</p>`;
            d.log(msg);
            element.innerHTML = msg;
        }
        api.post("txt2img", 
                txt2imgreq.request, 
                txt2imgreq.params,
                cb_ok,
                cb_notok,
                cb_error);
    } catch(e) { d.err(e); }
}

function generate_txt2img_with_timeout(delay, imageHandle, req)
{
    setTimeout(() => {
           generate_txt2img(imageHandle, req);
        },
        delay);
}


//The actual plugin logic
class DiffusionPlugin
{
    constructor()
    {
        let d = new DBG("building DiffusionPlugin"); try {            
            //Get our base element
            this.element = document.getElementById("DiffusionPlugin");
            if(this.element == null)
                throw("Could not find DiffusionPlugin element.");

            //Restore settings
            this.model_names = settings.load("model_names");
            this.sampler_names = settings.load("sampler_names");
            try { this.model_mix = JSON.parse(settings.load("model_mix")); }
            catch { this.model_mix = {}; }

            //Clear the static "loading..." content
            this.clear();

            //Build the UI.
            this.buildUI();

            //Try to connect to the server.
            get_server_info("settings_server_info");
        } catch(e) { d.err(e); }
    }

    //Build the model mix slider group
    buildModelMixUI()
    {
        let d = new DBG("building model mix UI"); try {
            var group = new SPBody("model_mix_group", "Model mix", "group");
            var sliders = [];
            for(let i = 0; i < this.model_names.length; i++)
            {
                var val = this.model_mix[this.model_names[i]];
                if(val == null || val == "")
                    val = (i == 0) ? "1" : "0";
        
                sliders.push(new SPSlider(
                    `slider_model_mix_${this.model_names[i]}`, 
                    `${this.model_names[i]}`, 
                    [], 
                    {"variant": "filled", 
                     "step": "0.01", 
                     "min": "0", 
                     "max": "1", 
                     "value": `${val}`}));
                    sliders[i].element.addEventListener("change", (evt) => {
                    var model_name = evt.target.id.slice("slider_model_mix_".length);
                    this.model_mix[model_name] = `${evt.target.value}`;
                    settings.save("model_mix", JSON.stringify(this.model_mix));
                });
            }
            group.toggleVisibility(this.model_names.length > 1);
            d.log(`Number of models: ${this.model_names.length}`);
            group.addChildren(sliders);
            this.ui.settings_model_mix.clear();
            this.ui.settings_model_mix.addChildren(group);
        } catch(e) { d.err(e); }
    }


    //Build the UI and add it to the DOM.
    buildUI()
    {
        let d = new DBG("building DiffusionPlugin UI"); try {

            //Build settings page
            var settings_body = new SPBody("settings_body", "Server", "group");
            var settings_api_root_url = new SPTextField(
                "settings_api_root_url", 
                "API Root URL", 
                () => {api.setURL(settings_api_root_url.element.value);},
                "wide", 
                {"placeholder": `${defaults.api_root_url}`}
            );

            settings_api_root_url.element.value = settings.load("api_root_url");
            api.setURL(settings_api_root_url.element.value);

            var settings_server_info = new SPBody("settings_server_info");

            var settings_model_mix = new SPObject("div", "settings_model_mix");

            var button = new SPButton("btn_test",
                                "Get Server Info",
                                () => { get_server_info(settings_server_info.element); },
                                "wide");                                

            settings_body.addChildren([settings_api_root_url, button, settings_server_info]);

            // Execute a function when the user presses a key on the keyboard
            settings_api_root_url.element.addEventListener("keydown", function(event) {
                console.log("Keypress!");
                // If the user presses the "Enter" key on the keyboard
                if (event.key === "Enter") {
                    // Cancel the default action, if needed
                    event.preventDefault();
                    // Trigger the button element with a click
                    button.element.click();
                }
            }); 


            //Build Txt2Img page
            var txt2img_prompt = new SPTextArea(
                "txt2img_prompt", 
                "Prompt:", 
                () => {}, 
                "wide",
                {"placeholder": "(leave blank for unguided image generation)"}
            );
            txt2img_prompt.element.addEventListener("input", (evt) => {
                let d = new DBG("parsing txt2img prompt input"); try {
                    let value = evt.target.value;
                    console.log(`${value}`);
                    try {                    
                        let source = JSON.parse(`${value}`);
                        txt2img_prompt.element.value = source.prompt;
                        txt2img_width.element.value = source.width;
                        txt2img_height.element.value = source.height;
                        txt2img_seed.element.value = `${source.seed}`;
                        txt2img_steps.element.value = source.steps;
                        txt2img_num_images.element.value = 1;
                        txt2img_cfg.element.value = source.cfg;
                        let index = null;
                        for(var i = 0; i < dp.sampler_names.length; i++)
                            if(dp.sampler_names[i] == source.sampler)
                                index = i;
                        if(index != null)
                            txt2img_sampler.element.selectedIndex = index;
                    }
                    catch (e) {};
                } catch(e){ d.err(e); }
            });

            var txt2img_prompt_group = new SPBody("txt2img_prompt_group", "", "group");
            txt2img_prompt_group.addChildren(txt2img_prompt);

            var txt2img_steps = new SPSlider(
                "txt2img_steps", 
                "Sampling steps:",
                [],
                {"variant": "filled",
                 "min": "1",
                 "max": "250",
                 "value": "50"}
            );

            var txt2img_width = new SPSlider(
                "txt2img_width", 
                "Width:",
                [],
                {"variant": "filled",
                 "min": "64",
                 "max": "1024",
                 "value": "512",
                 "step": "64"}
            );

            var txt2img_height = new SPSlider(
                "txt2img_height", 
                "Height:",
                [],
                {"variant": "filled",
                 "min": "64",
                 "max": "1024",
                 "value": "512",
                 "step": "64"}
            );

            var txt2img_cfg = new SPSlider(
                "txt2img_cfg", 
                "Classifier Free Guidance:",
                [],
                {"variant": "filled",
                 "min": "-10",
                 "max": "30",
                 "value": "7.5",
                 "step": "0.1"}
            );

            var txt2img_num_images = new SPSlider(
                "txt2img_num_images", 
                "Number to generate:",
                [],
                {"variant": "filled",
                 "min": "1",
                 "max": "16",
                 "value": "4",
                 "step": "1"}
            );

            var txt2img_seed = new SPTextField(
                "txt2img_seed", 
                "Seed:",
                () => {},
                [],
                {"placeholder": "(leave blank for random)"}
            );

            var txt2img_sampler_DDIM = new SPMenuItem("txt2img_sampler_DDIM", "DDIM");
            var txt2img_sampler_PLMS = new SPMenuItem("txt2img_sampler_PLMS", "PLMS");
            var txt2img_sampler_k_dpm_2_a = new SPMenuItem("txt2img_sampler_k_dpm_2_a", "k_dpm_2_a");
            var txt2img_sampler_k_dpm_2 = new SPMenuItem("txt2img_sampler_k_dpm_2", "k_dpm_2");
            var txt2img_sampler_k_euler_a = new SPMenuItem("txt2img_sampler_k_euler_a", "k_euler_a");
            var txt2img_sampler_k_euler = new SPMenuItem("txt2img_sampler_k_euler", "k_euler");
            var txt2img_sampler_k_heun = new SPMenuItem("txt2img_sampler_k_heun", "k_heun");
            var txt2img_sampler_k_lms = new SPMenuItem("txt2img_sampler_k_lms", "k_lms", [], {"selected": "true"});

            var txt2img_sampler = new SPDropDown(
                "txt2img_sampler", 
                [
                    txt2img_sampler_DDIM,
                    txt2img_sampler_PLMS,
                    txt2img_sampler_k_dpm_2_a,
                    txt2img_sampler_k_dpm_2,
                    txt2img_sampler_k_euler_a,
                    txt2img_sampler_k_euler,
                    txt2img_sampler_k_heun,
                    txt2img_sampler_k_lms,
                ],
                "Sampler name",
                "fullwidth"
                )

            var txt2img_settings_collection = new SPObject(
                "sp-body", 
                "txt2img_settings_collection");
            txt2img_settings_collection.toggleVisibility();
            txt2img_settings_collection.addChildren(
                [txt2img_steps,
                 txt2img_width,
                 txt2img_height,
                 txt2img_num_images,
                 txt2img_cfg,
                 txt2img_seed,
                 txt2img_sampler]
            );

            function toggle_button(button, showText, hideText, group)
            {
                group.toggleVisibility();
                if(group.visible)
                    button.setText(hideText);
                else
                    button.setText(showText);
            }

            var txt2img_settings_toggle = new SPButton(
                "txt2img_settings_toggle",
                "Show Settings",
                () => { toggle_button(txt2img_settings_toggle,
                                      "Show Settings",
                                      "Hide Settings",
                                      txt2img_settings_collection);},
                "wide"
            );


            var txt2img_settings = new SPBody("txt2img_config", "", "group");
            txt2img_settings.addChildren(
                [txt2img_settings_toggle,
                 txt2img_settings_collection]
            )


            var txt2img_body = new SPBody("txt2img_body", "", "footer-offset");
            txt2img_body.addChildren([
                txt2img_prompt_group, 
                txt2img_settings]);

            this.txt2img_outputs = new OutputImageSet(txt2img_body.element);

            //Build tabs
            var settings_tab = new SPTabPage("tabpage_settings", "Settings");
            settings_tab.addChildren([settings_body, settings_model_mix]);
            

            var txt2img_generate = new SPButton(
                "btn_txt2img_generate", 
                "Generate", 
                () => {
                    var mix = [];
                    for(var i = 0; i < this.model_names.length; i++)
                        mix.push(Number(this.model_mix[this.model_names[i]]));
                    for(var i = 0; i < txt2img_num_images.element.value; i++)
                    {
                        let imageHandle = this.txt2img_outputs.addImage();
                        let req = new Txt2ImgRequest(
                            txt2img_prompt.element.value,
                            txt2img_steps.element.value,
                            txt2img_width.element.value,
                            txt2img_height.element.value,
                            txt2img_cfg.element.value,
                            txt2img_seed.element.value,
                            txt2img_sampler.element.value,
                            JSON.stringify(mix)
                        );
                        generate_txt2img_with_timeout(
                            20 * (txt2img_num_images.element.value - i),
                            imageHandle,
                            req);
                        }
                },
                "wide"
            );

            var txt2img_footer = new SPObject("footer", "txt2img_footer", "");
            txt2img_footer.addChildren(txt2img_generate);

            var txt2img_tab = new SPTabPage("tabpage_txt2img", "Txt2Img", ["visible"]); 
            txt2img_tab.addChildren([txt2img_body, txt2img_footer]);

            var tabpages = [settings_tab, txt2img_tab];
            var tabs = new SPTabs("tabs_diffusionplugin", tabpages);


            //Add wrapper
            var wrapper = new SPObject("div", "wrapper", null, "wrapper");
            wrapper.addChildren([tabs, tabpages]);
            this.ui = wrapper;
            this.ui.settings_tab = settings_tab;
            this.ui.txt2img_tab = txt2img_tab;
            this.ui.settings_model_mix = settings_model_mix;


            //Attach to our element in the DOM
            this.element.appendChild(this.ui.element);
            d.log(this.element.innerHTML);
        } catch(e){ d.err(e); }
    }

    updateServerInfo(info)
    {
        let d = new DBG("building DiffusionPlugin UI"); try {
            this.model_names = info.models;
            this.sampler_names = info.samplers;
            this.buildModelMixUI();
        } catch(e){ d.err(e); }
    }

    //Clear the contents.
    clear()
    {
        this.ui = null;
        this.element.innerHTML = "";
    }
};

//Globals
var dp;


//Top-level listeners
document.addEventListener("DOMContentLoaded", function() {
    let d = new DBG("loading Diffusion Plugin"); try {
        dp = new DiffusionPlugin();
    } catch(e) { d.err(e); }
  });

