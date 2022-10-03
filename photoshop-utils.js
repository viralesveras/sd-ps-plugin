//Make Photoshop stuff available
const ps = require("photoshop");
const uxp = require("uxp");
const app = ps.app;
const constants = ps.constants;
const {localFileSystem: fs, fileTypes, formats } = uxp.storage;
const { entrypoints } = uxp;
const batchPlay = ps.action.batchPlay;

//Class representing high-level photoshop actions
class Photoshop
{
    async newLayerFromData(data, name)
    {
        if(name == null)
            name = "Unnamed Layer";
        var obj = this;
        let d = new DBG("preparing to add new layer from data"); try {    
            async function targetFunction(executionContext, descriptor) {
                let d = new DBG("adding new Photoshop layer from data"); try {    
                    let activeDoc = app.activeDocument;
                    const selection = await obj.getCurrentSelection();
                    const image = await fetch(`${data}`);
                    const temp = await fs.getTemporaryFolder();
                    const file = await temp.createFile("temp.png");
            
                    let newLayer = null;
                    try {
                        const img = await image.arrayBuffer();
                        await file.write(img);
            
                        let placeResult = await obj.placeFile(file);
                        await obj.rasterizeLayer(placeResult.ID);
                        newLayer = obj.getLayerByID(placeResult.ID);
                        d.log(`newLayer: ${JSON.stringify(newLayer)}`);
                        newLayer.name = name;
                        return newLayer.id;  
                    } catch (e) { d.log(e); }
                    finally 
                    {
                        file.delete(); 
                        obj.setCurrentSelection(selection);
                    }
                } catch(e) { d.err(e); }   
            }
            let result = await ps.core.executeAsModal(
                targetFunction, 
                {"commandName": "New Layer From Data"});
            return result;
        } catch(e) { d.err(e); }   
    }
    
    async copyToClipboardFromText(text)
    {
        let d = new DBG("copying text to clipboard"); try {    
            navigator.clipboard.setContent({"text/plain": text});
        } catch(e) { d.err(e); }   
    }

    async copyToClipboardFromData(data) 
    {
        var obj = this;
        let d = new DBG("preparing to copy to clipboard from data"); try {    
            async function targetFunction(executionContext, descriptor) {
                let d = new DBG("copying to clipboard from data"); try {    
                    const selection = await obj.getCurrentSelection();
                    const tempLayerID = await obj.newLayerFromData(data, "temp");
                    d.log("About to batchplay");
                    try {
                        const result = await batchPlay(
                            [
                                {_obj: "set", _target: [{
                                    _ref: "channel",_property: "selection"}],
                                to: {_enum: "ordinal", _value: "allEnum"},
                                _options: {dialogOptions: "dontDisplay"}},
                                {_obj: "copyEvent", copyHint: "pixels", 
                                _options: {dialogOptions: "dontDisplay"}}],
                            {
                                synchronousExecution: true, 
                                modalBehavior: "execute"}
                        );
                        d.log("Done with batchplay");
                        return result;
                    } catch (e) { d.log(e); }
                    finally 
                    {
                        try
                        {
                            d.log("Getting layer by ID");
                            let tempLayer = obj.getLayerByID(tempLayerID);
                            d.log("Deleting layer");
                            tempLayer.delete();    
                        } catch (e) { d.log(e); }
                        d.log("Setting selection back");
                        obj.setCurrentSelection(selection);
                        d.log("Done");
                    }
                } catch(e) { d.err(e); }
            }
            let result = await ps.core.executeAsModal(
                targetFunction, 
                {"commandName": "New Layer From Data"});
            return result;
        } catch(e) { d.err(e); }   

    }


    async getCurrentSelection()
    {
        let d = new DBG("preparing to get current selection"); try {    
            async function targetFunction() {
                let d = new DBG("getting current selection"); try {    
                    let activeDoc = app.activeDocument;
                    const result = await batchPlay(
                        [{"_obj": "get", "_target": [{"_property": "selection"},
                                {"_ref": "document", "_id": activeDoc.id}],
                            "_options": {"dialogOptions": "dontDisplay"}}
                        ],{
                        "synchronousExecution": true,
                        "modalBehavior": "execute"
                    });
                    return result;
                } catch(e) { d.err(e); }   
            }            
            const result = await ps.core.executeAsModal(
                targetFunction, 
                {"commandName": "Get Current Selection"});
            return result[0];                
        } catch(e) { d.err(e); }   
    }

    async setCurrentSelection(selection)
    {
        let d = new DBG("preparing to set current selection"); try {    
            async function targetFunction() {
                let d = new DBG("setting current selection"); try {    
                    const result = await batchPlay(
                        [
                        {_obj: "set", _target: [{
                                _ref: "channel", _property: "selection"}],
                            to: selection.selection,
                            _options: {dialogOptions: "dontDisplay"}}
                        ],
                        {
                        synchronousExecution: true,
                        modalBehavior: "execute"
                    });
                    return result;     
                } catch(e) { d.err(e); }   
            }
            if(selection == null || !('selection' in selection))
                return null;
            const result = await ps.core.executeAsModal(
                targetFunction, 
                {"commandName": "Set Current Selection"});
            return result[0];                
        } catch(e) { d.err(e); }   
    }


    async createEmptyLayer(name)
    {
        let d = new DBG(`creating empty layer named "${name}"`); try {    
            let activeDoc = app.activeDocument;
            return await activeDoc.createLayer({name: name});
        } catch(e) { d.err(e); }   
    }

    async placeFile(file)
    {
        await this.createEmptyLayer(`${file.name}`);
        let d = new DBG(`preparing to place file "${file.name}"`); try {    
            async function targetFunction() {
                let d = new DBG(`placing file "${file.name}"`); try {    
                    let token = fs.createSessionToken(file);
                    const result = await batchPlay(
                        [
                            {_obj: "placeEvent", 
                             null: {_path: token, _kind: "local", }},
                        ],
                        {
                        synchronousExecution: true,
                        modalBehavior: "execute"
                    });
                    return result;     
                } catch(e) { d.err(e); }   
            }
            const result = await ps.core.executeAsModal(
                targetFunction, 
                {"commandName": `Place file "${file.name}"`});
            return result[0];                
        } catch(e) { d.err(e); }   
    }

    getLayerByID(id)
    {
        let activeDoc = app.activeDocument;
        let layers = activeDoc.layers;
        return layers.find(layer => layer.id == id);
    }
    
    async rasterizeLayer(id)
    {
        let d = new DBG(`preparing to rasterize layer "${id}"`); try {    
            async function targetFunction() {
                let d = new DBG(`rasterizing layer "${id}"`); try {    
                    const result = await batchPlay(
                        [
                            {_obj: "rasterizeLayer", _target: [{
                                _ref: "layer",
                                _enum: "ordinal",
                                _value: "targetEnum"}],
                            layerID: [id],
                            _options: {dialogOptions: "dontDisplay"}},
                        ],
                        {
                        synchronousExecution: true,
                        modalBehavior: "execute"
                    });
                    return result;     
                } catch(e) { d.err(e); }   
            }
            const result = await ps.core.executeAsModal(
                targetFunction, 
                {"commandName": `Rasterize layer "${id}"`});
            return result[0];                
        } catch(e) { d.err(e); }   
    }

}

psu = new Photoshop();
