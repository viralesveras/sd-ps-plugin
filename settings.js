defaults = {
    "api_root_url": "http://127.0.0.1:5000"
}

//Object to help with settings
class PersistentSettings
{
    save(key, value)
    {
        var d = new DBG(`saving setting ${key}: ${value}`); try {        
            window.localStorage.setItem(key, value);
        } catch(e) { d.err(e); }
    }

    load(key)
    {
        var d = new DBG(`loading setting ${key}`); try {        
            var value = window.localStorage.getItem(key);
            d.log(`loaded setting: ${key}: ${value}`)
            if(value == null || value == "undefined")
                value = "";
            return value;
        } catch(e) { d.err(e); }
    }
}

settings = new PersistentSettings();
